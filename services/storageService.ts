import { AppData, AppointmentStatus, Appointment, Client, Barber } from '../types';

const STORAGE_KEY = 'barber_assist_data_v1';

const generateId = () => Math.random().toString(36).substr(2, 9);

const MOCK_DATA: AppData = {
  clients: [
    { id: 'c1', name: 'Carlos Silva', phone: '(11) 99999-1234' },
    { id: 'c2', name: 'Roberto Almeida', phone: '(11) 98888-5678' },
    { id: 'c3', name: 'João Souza', phone: '(21) 97777-4321' },
  ],
  barbers: [
    { id: 'b1', name: 'Mestre Navalha', specialty: 'Corte Clássico' },
    { id: 'b2', name: 'Barba Ruiva', specialty: 'Barba Terapia' },
  ],
  appointments: [
    {
      id: 'a1',
      clientId: 'c1',
      barberId: 'b1',
      date: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
      service: 'Corte + Barba',
      status: AppointmentStatus.PENDING
    },
    {
      id: 'a2',
      clientId: 'c2',
      barberId: 'b2',
      date: new Date(new Date().setHours(15, 30, 0, 0)).toISOString(),
      service: 'Barba Modelada',
      status: AppointmentStatus.CONFIRMED
    },
    {
      id: 'a3',
      clientId: 'c3',
      barberId: 'b1',
      date: new Date(new Date().setHours(16, 0, 0, 0)).toISOString(),
      service: 'Corte Degrade',
      status: AppointmentStatus.PENDING
    }
  ]
};

export const getStoredData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return MOCK_DATA;
};

export const saveStoredData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const createId = generateId;