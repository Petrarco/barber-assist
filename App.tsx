import React, { useState } from 'react';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Schedule from './components/Schedule';
import Entities from './components/Entities';
import VoiceAssistant from './components/VoiceAssistant';
import NotificationSystem from './components/NotificationSystem';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'agenda': return <Schedule />;
      case 'clientes': return <Entities type="clients" />;
      case 'barbeiros': return <Entities type="barbers" />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
      <NotificationSystem />
      <VoiceAssistant />
    </Layout>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;