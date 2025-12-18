import React, { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { AppointmentStatus } from '../types';
import { Bell, Check, Clock, X, AlertTriangle } from 'lucide-react';

interface Notification {
  id: string;
  type: 'upcoming' | 'late';
  clientName: string;
  time: string;
  minutesDiff: number;
}

const NotificationSystem = () => {
  const { data, updateAppointmentStatus } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [snoozed, setSnoozed] = useState<Record<string, number>>({}); // Map<AppointmentId, SnoozeUntilTimestamp>

  // Check for notifications periodically
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = Date.now();
      const currentNotifications = [...notifications];
      const newNotifications: Notification[] = [];

      data.appointments.forEach(app => {
        // Only care about PENDING
        if (app.status !== AppointmentStatus.PENDING) return;

        // Check snooze
        if (snoozed[app.id] && snoozed[app.id] > now) return;

        const appDate = new Date(app.date).getTime();
        const diffMs = appDate - now;
        const diffMins = Math.floor(diffMs / 60000);

        let type: 'upcoming' | 'late' | null = null;

        // Logic: 
        // Upcoming: 0 <= diffMins <= 15 (Starts in 0-15 mins)
        // Late: diffMins < 0 (Already started/passed)
        if (diffMins >= 0 && diffMins <= 15) {
          type = 'upcoming';
        } else if (diffMins < 0) {
          type = 'late';
        }

        if (type) {
          const isAlreadyShown = currentNotifications.some(n => n.id === app.id);
          if (!isAlreadyShown) {
             const client = data.clients.find(c => c.id === app.clientId);
             newNotifications.push({
               id: app.id,
               type,
               clientName: client?.name || 'Cliente',
               time: new Date(app.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
               minutesDiff: diffMins
             });
          }
        }
      });

      if (newNotifications.length > 0) {
        setNotifications(prev => {
          // Double check to prevent duplicates if interval fires rapidly
          const uniqueNew = newNotifications.filter(n => !prev.some(p => p.id === n.id));
          return [...prev, ...uniqueNew];
        });
      }

      // Cleanup resolved/deleted/non-pending appointments from notifications
      setNotifications(prev => prev.filter(n => {
         const app = data.appointments.find(a => a.id === n.id);
         return app && app.status === AppointmentStatus.PENDING;
      }));

    }, 5000); // Check every 5 seconds

    return () => clearInterval(checkInterval);
  }, [data.appointments, snoozed, notifications]);

  const handleSnooze = (id: string) => {
    // Snooze for 5 minutes
    setSnoozed(prev => ({ ...prev, [id]: Date.now() + 5 * 60 * 1000 }));
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleDismiss = (id: string) => {
    // Dismiss for 30 minutes
    setSnoozed(prev => ({ ...prev, [id]: Date.now() + 30 * 60 * 1000 }));
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleConfirm = (id: string) => {
    updateAppointmentStatus(id, AppointmentStatus.CONFIRMED);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {notifications.map(n => (
        <div 
          key={n.id} 
          className="bg-barber-800 border-l-4 border-barber-gold shadow-2xl rounded-r-lg p-4 pointer-events-auto transform transition-all duration-500 ease-in-out animate-fade-in-up"
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    {n.type === 'late' ? (
                       <AlertTriangle className="w-5 h-5 text-red-500" />
                    ) : (
                       <Bell className="w-5 h-5 text-barber-gold" />
                    )}
                    <div>
                        <h4 className={`font-bold text-sm ${n.type === 'late' ? 'text-red-400' : 'text-barber-gold'}`}>
                            {n.type === 'late' ? 'Atrasado' : 'Próximo Cliente'}
                        </h4>
                        <p className="text-white text-sm font-medium">
                            {n.clientName}
                        </p>
                    </div>
                </div>
                <button onClick={() => handleDismiss(n.id)} className="text-gray-500 hover:text-white p-1">
                    <X className="w-4 h-4" />
                </button>
            </div>
            
            <p className="text-xs text-gray-400 mb-3 ml-7">
               Horário: <span className="text-gray-300">{n.time}</span> • {n.type === 'late' ? `Atrasado há ${Math.abs(n.minutesDiff)} min` : `Em ${n.minutesDiff} min`}
            </p>

            <div className="flex gap-2 ml-7">
                <button 
                    onClick={() => handleConfirm(n.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 rounded font-medium transition-colors flex items-center justify-center gap-1"
                >
                    <Check className="w-3 h-3" /> Confirmar
                </button>
                <button 
                    onClick={() => handleSnooze(n.id)}
                    className="flex-1 bg-barber-700 hover:bg-barber-600 text-gray-300 text-xs py-2 rounded font-medium transition-colors flex items-center justify-center gap-1"
                >
                    <Clock className="w-3 h-3" /> Adiar (5m)
                </button>
            </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationSystem;