import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { AppointmentStatus, Appointment } from '../types';
import { Check, X, Clock, Calendar as CalIcon, Scissors, ChevronRight } from 'lucide-react';

const Schedule = () => {
  const { data, addAppointment, updateAppointmentStatus } = useApp();
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [clientId, setClientId] = useState('');
  const [barberId, setBarberId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [service, setService] = useState('');

  // Sort by date/time
  const sortedAppointments = [...data.appointments].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Group by Date
  const groupedAppointments = sortedAppointments.reduce((groups, app) => {
    const appDate = new Date(app.date);
    appDate.setHours(0, 0, 0, 0); // Reset time for grouping
    const key = appDate.toISOString();

    if (!groups[key]) {
      groups[key] = {
        date: appDate,
        items: []
      };
    }
    groups[key].items.push(app);
    return groups;
  }, {} as Record<string, { date: Date; items: Appointment[] }>);

  // Sort groups by date key just in case
  const sortedGroups = Object.values(groupedAppointments).sort((a, b) => a.date.getTime() - b.date.getTime());

  const getDayHeader = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() === today.getTime()) return 'Hoje';
    if (date.getTime() === tomorrow.getTime()) return 'Amanhã';
    
    // Capitalize first letter
    const dateStr = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !barberId || !date || !time) return;

    const isoDate = new Date(`${date}T${time}`).toISOString();
    
    addAppointment({
      clientId,
      barberId,
      date: isoDate,
      service
    });
    
    setShowForm(false);
    setClientId('');
    setBarberId('');
    setDate('');
    setTime('');
    setService('');
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Agenda</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-barber-gold text-barber-900 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-barber-goldhover transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Novo Agendamento'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-barber-800 p-4 rounded-xl border border-barber-700 animate-fade-in space-y-4 mb-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-xs text-gray-400 mb-1">Cliente</label>
               <select 
                className="w-full bg-barber-900 border border-barber-700 rounded-lg p-2 text-white"
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                required
               >
                 <option value="">Selecione...</option>
                 {data.clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
             </div>
             <div>
               <label className="block text-xs text-gray-400 mb-1">Barbeiro</label>
               <select 
                className="w-full bg-barber-900 border border-barber-700 rounded-lg p-2 text-white"
                value={barberId}
                onChange={e => setBarberId(e.target.value)}
                required
               >
                 <option value="">Selecione...</option>
                 {data.barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
               </select>
             </div>
             <div>
               <label className="block text-xs text-gray-400 mb-1">Data</label>
               <input 
                type="date" 
                className="w-full bg-barber-900 border border-barber-700 rounded-lg p-2 text-white"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
               />
             </div>
             <div>
               <label className="block text-xs text-gray-400 mb-1">Hora</label>
               <input 
                type="time" 
                className="w-full bg-barber-900 border border-barber-700 rounded-lg p-2 text-white"
                value={time}
                onChange={e => setTime(e.target.value)}
                required
               />
             </div>
             <div className="md:col-span-2">
               <label className="block text-xs text-gray-400 mb-1">Serviço</label>
               <input 
                type="text" 
                placeholder="Ex: Corte e Barba"
                className="w-full bg-barber-900 border border-barber-700 rounded-lg p-2 text-white"
                value={service}
                onChange={e => setService(e.target.value)}
                required
               />
             </div>
           </div>
           <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg font-medium">
             Salvar Agendamento
           </button>
        </form>
      )}

      <div className="space-y-8">
        {sortedGroups.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-barber-800/50 rounded-xl border border-dashed border-barber-700">
             <CalIcon className="w-12 h-12 mb-4 opacity-20" />
             <p>Nenhum agendamento encontrado.</p>
           </div>
        ) : (
          sortedGroups.map((group, groupIndex) => (
            <div key={group.date.toISOString()} className="animate-fade-in-up" style={{ animationDelay: `${groupIndex * 100}ms` }}>
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-xl font-bold text-barber-gold">
                  {getDayHeader(group.date)}
                </h3>
                <div className="h-px bg-barber-700 flex-1"></div>
              </div>

              <div className="space-y-3">
                {group.items.map(app => {
                  const client = data.clients.find(c => c.id === app.clientId);
                  const barber = data.barbers.find(b => b.id === app.barberId);
                  const dateObj = new Date(app.date);

                  return (
                    <div key={app.id} className="bg-barber-800 p-4 rounded-xl border border-barber-700 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-barber-gold/50 transition-colors group">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl shrink-0 border ${
                          app.status === AppointmentStatus.PENDING ? 'bg-amber-900/20 text-amber-500 border-amber-500/20' :
                          app.status === AppointmentStatus.CONFIRMED ? 'bg-green-900/20 text-green-500 border-green-500/20' :
                          'bg-gray-700/20 text-gray-400 border-gray-600/20'
                        } flex flex-col items-center justify-center w-16 h-16`}>
                          <span className="text-lg font-bold">{dateObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-white group-hover:text-barber-gold transition-colors">{client?.name || 'Cliente Desconhecido'}</h3>
                          <div className="text-sm text-gray-400 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                             <span className="flex items-center gap-1.5"><Scissors className="w-3.5 h-3.5" /> {app.service}</span>
                             <span className="flex items-center gap-1.5"><CalIcon className="w-3.5 h-3.5" /> {barber?.name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center pl-4 border-l border-barber-700/50 md:border-none md:pl-0">
                        {app.status === AppointmentStatus.PENDING && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => updateAppointmentStatus(app.id, AppointmentStatus.CONFIRMED)}
                              className="p-2 bg-green-600/20 text-green-500 hover:bg-green-600 hover:text-white rounded-lg transition-colors"
                              title="Confirmar"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => updateAppointmentStatus(app.id, AppointmentStatus.CANCELLED)}
                              className="p-2 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                              title="Cancelar"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                        
                        <div className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                           app.status === AppointmentStatus.PENDING ? 'bg-amber-500/10 text-amber-500' :
                           app.status === AppointmentStatus.CONFIRMED ? 'bg-green-500/10 text-green-500' :
                           'bg-gray-500/10 text-gray-500'
                        }`}>
                          {app.status === AppointmentStatus.PENDING && <Clock className="w-3 h-3" />}
                          {app.status === AppointmentStatus.CONFIRMED && <Check className="w-3 h-3" />}
                          {app.status}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Schedule;