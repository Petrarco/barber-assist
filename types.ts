export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Client {
  id: string;
  name: string;
  phone: string;
}

export interface Barber {
  id: string;
  name: string;
  specialty: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  barberId: string;
  date: string; // ISO String
  service: string;
  status: AppointmentStatus;
}

export interface AppData {
  clients: Client[];
  barbers: Barber[];
  appointments: Appointment[];
}