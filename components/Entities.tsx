import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { User, Phone, Briefcase } from 'lucide-react';

interface EntityProps {
  type: 'clients' | 'barbers';
}

const Entities: React.FC<EntityProps> = ({ type }) => {
  const { data, addClient, addBarber } = useApp();
  const [name, setName] = useState('');
  const [info, setInfo] = useState(''); // Phone or Specialty
  
  const isClient = type === 'clients';
  const list = isClient ? data.clients : data.barbers;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isClient) {
      addClient({ name, phone: info });
    } else {
      addBarber({ name, specialty: info });
    }
    setName('');
    setInfo('');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white capitalize">{isClient ? 'Clientes' : 'Barbeiros'}</h2>
      
      <form onSubmit={handleSubmit} className="bg-barber-800 p-4 rounded-xl border border-barber-700 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs text-gray-400 mb-1">Nome</label>
          <input 
            type="text"
            placeholder={`Nome do ${isClient ? 'Cliente' : 'Barbeiro'}`}
            className="w-full bg-barber-900 border border-barber-700 rounded-lg p-2 text-white outline-none focus:border-barber-gold"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs text-gray-400 mb-1">{isClient ? 'Telefone' : 'Especialidade'}</label>
          <input 
            type="text"
            placeholder={isClient ? '(00) 00000-0000' : 'Ex: Corte Clássico'}
            className="w-full bg-barber-900 border border-barber-700 rounded-lg p-2 text-white outline-none focus:border-barber-gold"
            value={info}
            onChange={(e) => setInfo(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="w-full md:w-auto bg-barber-gold text-barber-900 font-bold px-6 py-2 rounded-lg hover:bg-barber-goldhover transition-colors">
          Adicionar
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((item: any) => (
          <div key={item.id} className="bg-barber-800 p-4 rounded-xl border border-barber-700 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-barber-700 flex items-center justify-center text-gray-300">
               <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{item.name}</h3>
              <p className="text-sm text-gray-400 flex items-center gap-2">
                {isClient ? <Phone className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                {isClient ? item.phone : item.specialty}
              </p>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <p className="text-gray-500 col-span-full text-center py-8">Nenhum registro encontrado.</p>
        )}
      </div>
    </div>
  );
};

export default Entities;