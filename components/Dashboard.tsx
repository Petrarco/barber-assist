import React from 'react';
import { useApp } from '../contexts/AppContext';
import { AppointmentStatus } from '../types';
import { CalendarCheck, Clock, DollarSign, UserCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard = () => {
  const { data } = useApp();

  const pendingCount = data.appointments.filter(a => a.status === AppointmentStatus.PENDING).length;
  const confirmedCount = data.appointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length;
  const todayCount = data.appointments.filter(a => {
    const d = new Date(a.date);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
  }).length;

  const chartData = [
    { name: 'Pendentes', value: pendingCount, color: '#fbbf24' }, // Amber 400
    { name: 'Confirmados', value: confirmedCount, color: '#4ade80' }, // Green 400
    { name: 'Hoje', value: todayCount, color: '#60a5fa' }, // Blue 400
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-barber-800 p-4 rounded-xl border border-barber-700 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm">Pendentes</h3>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-white">{pendingCount}</p>
        </div>
        <div className="bg-barber-800 p-4 rounded-xl border border-barber-700 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm">Confirmados</h3>
            <CalendarCheck className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-white">{confirmedCount}</p>
        </div>
        <div className="bg-barber-800 p-4 rounded-xl border border-barber-700 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm">Hoje</h3>
            <UserCheck className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-white">{todayCount}</p>
        </div>
        <div className="bg-barber-800 p-4 rounded-xl border border-barber-700 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm">Clientes</h3>
            <DollarSign className="w-5 h-5 text-barber-gold" />
          </div>
          <p className="text-2xl font-bold text-white">{data.clients.length}</p>
        </div>
      </div>

      <div className="bg-barber-800 p-6 rounded-xl border border-barber-700 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-6">Visão Geral de Agendamentos</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ backgroundColor: '#2d2d2d', border: '1px solid #404040', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-amber-900/20 border border-amber-900/50 p-4 rounded-lg">
        <h4 className="text-amber-500 font-medium mb-1">Dica do Assistente</h4>
        <p className="text-sm text-amber-200/80">
          Você tem {pendingCount} agendamentos pendentes. Clique no microfone no canto inferior direito para que eu possa confirmá-los para você!
        </p>
      </div>
    </div>
  );
};

export default Dashboard;