import React, { useState, useEffect, useRef, memo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { Mic, MicOff, Volume2, Loader2, Play } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { AppointmentStatus } from '../types';

// --- Audio Utils (Defined locally to avoid complex imports for this single file component) ---
function createBlob(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 = btoa(binary);
  
  return {
    data: b64,
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- Component ---

const VoiceAssistant = () => {
  const { getFormattedSchedule, updateAppointmentStatus, data } = useApp();
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [log, setLog] = useState<string>('Clique no microfone para iniciar o assistente.');
  
  // Refs for audio handling to avoid re-renders
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<Promise<any> | null>(null);

  // Define the tool definition
  const confirmAppointmentTool: FunctionDeclaration = {
    name: 'confirmAppointments',
    parameters: {
      type: Type.OBJECT,
      description: 'Confirms a list of appointments given their IDs.',
      properties: {
        appointmentIds: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Array of appointment IDs to confirm.',
        },
      },
      required: ['appointmentIds'],
    },
  };

  const stopSession = () => {
    if (sessionRef.current) {
        sessionRef.current.then((session: any) => {
            try {
                session.close();
            } catch (e) {
                console.error("Error closing session", e);
            }
        });
        sessionRef.current = null;
    }

    // Stop Microphones
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    // Stop Speakers
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }

    setIsActive(false);
    setStatus('idle');
    setLog('Assistente desconectado.');
  };

  const startSession = async () => {
    try {
      setStatus('connecting');
      setLog('Conectando ao Gemini Live...');

      // 1. Setup Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      
      inputAudioContextRef.current = inputCtx;
      audioContextRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      // 2. Setup Gemini
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const scheduleContext = getFormattedSchedule();
      
      const systemInstruction = `
        Você é um assistente de barbearia profissional e eficiente. Fale em Português do Brasil.
        Sua principal função é ajudar o barbeiro a gerenciar o dia.
        
        Ao iniciar, verifique IMEDIATAMENTE os dados fornecidos abaixo sobre agendamentos pendentes.
        Se houver agendamentos pendentes (status PENDING), sua primeira fala DEVE ser informar quantos são, detalhar brevemente (quem e hora) e perguntar se o barbeiro gostaria de confirmá-los agora.
        
        Dados atuais da barbearia (JSON):
        ${scheduleContext}
        
        Se o usuário confirmar, use a ferramenta 'confirmAppointments' com os IDs correspondentes.
        Seja breve, direto e educado.
      `;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: systemInstruction,
          tools: [{ functionDeclarations: [confirmAppointmentTool] }],
        },
        callbacks: {
          onopen: async () => {
            setStatus('connected');
            setIsActive(true);
            setLog('Assistente ouvindo... (Pode falar)');
            
            // Start Mic Stream
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              streamRef.current = stream;
              
              const source = inputCtx.createMediaStreamSource(stream);
              sourceRef.current = source;
              
              const processor = inputCtx.createScriptProcessor(4096, 1, 1);
              processorRef.current = processor;

              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromise.then(session => {
                   session.sendRealtimeInput({ media: pcmBlob });
                });
              };

              source.connect(processor);
              processor.connect(inputCtx.destination);
            } catch (err) {
              console.error("Mic Error:", err);
              setLog("Erro ao acessar microfone.");
              stopSession();
            }
          },
          onmessage: async (message: LiveServerMessage) => {
             // Handle Audio Output
             const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio && outputCtx) {
                try {
                   nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                   const audioBuffer = await decodeAudioData(
                     decode(base64Audio),
                     outputCtx,
                     24000,
                     1
                   );
                   
                   const source = outputCtx.createBufferSource();
                   source.buffer = audioBuffer;
                   source.connect(outputCtx.destination);
                   
                   source.addEventListener('ended', () => {
                      sourcesRef.current.delete(source);
                   });
                   
                   source.start(nextStartTimeRef.current);
                   nextStartTimeRef.current += audioBuffer.duration;
                   sourcesRef.current.add(source);
                } catch (e) {
                   console.error("Audio Decode Error", e);
                }
             }

             // Handle Tool Calls
             if (message.toolCall) {
                for (const fc of message.toolCall.functionCalls) {
                   if (fc.name === 'confirmAppointments') {
                      const ids = (fc.args as any).appointmentIds;
                      setLog(`Confirmando agendamentos: ${ids.join(', ')}`);
                      
                      // Execute logic
                      ids.forEach((id: string) => updateAppointmentStatus(id, AppointmentStatus.CONFIRMED));

                      // Send response back
                      sessionPromise.then(session => {
                         session.sendToolResponse({
                            functionResponses: {
                               id: fc.id,
                               name: fc.name,
                               response: { result: `Agendamentos ${ids.join(', ')} confirmados com sucesso.` }
                            }
                         });
                      });
                   }
                }
             }
             
             // Handle Turn Complete (Optional logging)
             if (message.serverContent?.turnComplete) {
               // turn ended
             }
          },
          onclose: () => {
             console.log("Session closed");
             stopSession();
          },
          onerror: (e) => {
             console.error("Session error", e);
             setLog("Erro na conexão com IA.");
             stopSession();
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (error) {
      console.error("Connection failed:", error);
      setStatus('error');
      setLog('Falha ao conectar. Verifique API Key.');
      setIsActive(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSession();
    }
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
      <div className={`
        mb-2 p-3 rounded-lg shadow-lg max-w-xs transition-all duration-300 pointer-events-auto
        ${isActive ? 'bg-barber-800 border border-barber-gold text-white translate-y-0 opacity-100' : 'translate-y-4 opacity-0 hidden'}
      `}>
        <p className="text-xs font-mono">{log}</p>
      </div>

      <button
        onClick={isActive ? stopSession : startSession}
        className={`
          pointer-events-auto
          h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300
          ${isActive 
            ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
            : 'bg-barber-gold hover:bg-barber-goldhover'
          }
        `}
        title={isActive ? "Parar Assistente" : "Iniciar Assistente de Voz"}
      >
        {status === 'connecting' ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : isActive ? (
           <Mic className="w-6 h-6 text-white" />
        ) : (
           <div className="relative">
             <MicOff className="w-6 h-6 text-barber-900" />
             {data.appointments.some(a => a.status === AppointmentStatus.PENDING) && (
               <span className="absolute -top-1 -right-1 flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
               </span>
             )}
           </div>
        )}
      </button>
    </div>
  );
};

export default VoiceAssistant;