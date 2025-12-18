import React, { ReactNode } from 'react';
import { Scissors, Calendar, Users, User, Menu } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="min-h-screen flex flex-col bg-barber-900 text-gray-200 font-sans">
      {/* Header */}
      <header className="bg-barber-800 border-b border-barber-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-barber-gold p-1.5 rounded-lg">
              <Scissors className="w-6 h-6 text-barber-900" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Barber<span className="text-barber-gold">Assist</span></h1>
          </div>
          
          <nav className="hidden md:flex gap-1">
            {['dashboard', 'agenda', 'clientes', 'barbeiros'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab 
                    ? 'bg-barber-700 text-barber-gold' 
                    : 'text-gray-400 hover:text-white hover:bg-barber-700/50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-barber-800 border-t border-barber-700 pb-safe z-40">
        <div className="flex justify-around items-center h-16">
          <button onClick={() => setActiveTab('dashboard')} className={`p-2 flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-barber-gold' : 'text-gray-500'}`}>
            <Menu className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </button>
          <button onClick={() => setActiveTab('agenda')} className={`p-2 flex flex-col items-center gap-1 ${activeTab === 'agenda' ? 'text-barber-gold' : 'text-gray-500'}`}>
            <Calendar className="w-5 h-5" />
            <span className="text-[10px]">Agenda</span>
          </button>
          <button onClick={() => setActiveTab('clientes')} className={`p-2 flex flex-col items-center gap-1 ${activeTab === 'clientes' ? 'text-barber-gold' : 'text-gray-500'}`}>
            <Users className="w-5 h-5" />
            <span className="text-[10px]">Clientes</span>
          </button>
          <button onClick={() => setActiveTab('barbeiros')} className={`p-2 flex flex-col items-center gap-1 ${activeTab === 'barbeiros' ? 'text-barber-gold' : 'text-gray-500'}`}>
            <User className="w-5 h-5" />
            <span className="text-[10px]">Equipe</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Layout;