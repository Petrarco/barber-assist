import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppData, Client, Barber, Appointment, AppointmentStatus } from '../types';
import { getStoredData, saveStoredData, createId } from '../services/storageService';

interface AppContextType {
  data: AppData;
  addClient: (client: Omit<Client, 'id'>) => void;
  addBarber: (barber: Omit<Barber, 'id'>) => void;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'status'>) => void;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  getFormattedSchedule: () => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>({ clients: [], barbers: [], appointments: [] });

  useEffect(() => {
    setData(getStoredData());
  }, []);

  useEffect(() => {
    if (data.clients.length > 0) { // Avoid saving empty init state
      saveStoredData(data);
    }
  }, [data]);

  const addClient = (client: Omit<Client, 'id'>) => {
    const newClient = { ...client, id: createId() };
    setData(prev => ({ ...prev, clients: [...prev.clients, newClient] }));
  };

  const addBarber = (barber: Omit<Barber, 'id'>) => {
    const newBarber = { ...barber, id: createId() };
    setData(prev => ({ ...prev, barbers: [...prev.barbers, newBarber] }));
  };

  const addAppointment = (appointment: Omit<Appointment, 'id' | 'status'>) => {
    const newAppointment = { ...appointment, id: createId(), status: AppointmentStatus.PENDING };
    setData(prev => ({ ...prev, appointments: [...prev.appointments, newAppointment] }));
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    setData(prev => ({
      ...prev,
      appointments: prev.appointments.map(app => 
        app.id === id ? { ...app, status } : app
      )
    }));
  };

  // Helper for AI context
  const getFormattedSchedule = () => {
    const pending = data.appointments
      .filter(a => a.status === AppointmentStatus.PENDING)
      .map(a => {
        const client = data.clients.find(c => c.id === a.clientId);
        const barber = data.barbers.find(b => b.id === a.barberId);
        const date = new Date(a.date).toLocaleString('pt-BR', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
        return `ID: ${a.id}, Cliente: ${client?.name}, Barbeiro: ${barber?.name}, Horário: ${date}, Serviço: ${a.service}`;
      });

    return JSON.stringify({
      pendingCount: pending.length,
      pendingDetails: pending,
      today: new Date().toLocaleDateString('pt-BR')
    });
  };

  return (
    <AppContext.Provider value={{ data, addClient, addBarber, addAppointment, updateAppointmentStatus, getFormattedSchedule }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};