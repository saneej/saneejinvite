import { useState } from 'react';
import { View } from './types';
import { GuestProvider, useGuests } from './context/GuestContext';
import { Sidebar, MobileNav } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { GuestList } from './pages/GuestList';
import { AddGuest } from './pages/AddGuest';
import { Categories } from './pages/Categories';
import { Settings } from './pages/Settings';
import Invite from './pages/Invite';
import { Logs } from './pages/Logs';
import { WeddingAIBot } from './components/WeddingAIBot';
import { Onboarding } from './components/Onboarding';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

import { LandingPage } from './components/LandingPage';

function AppContent() {
  const { user, login, isLoading, settings } = useGuests();
  const [activeView, setActiveView] = useState<View>('dashboard');
  
  // Decide whether to show onboarding based on settings
  const isNewUser = user && !isLoading && settings.brideName === 'Emma' && settings.groomName === 'James';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-natural-sidebar text-natural-olive">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">Loading Elegance...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onLogin={login} />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard onViewChange={setActiveView} />;
      case 'guests': return <GuestList onViewChange={setActiveView} />;
      case 'add': return <AddGuest onViewChange={setActiveView} />;
      case 'categories': return <Categories />;
      case 'settings': return <Settings />;
      case 'invite': return <Invite />;
      case 'logs': return <Logs />;
      case 'onboarding': return <Onboarding onComplete={() => { setActiveView('dashboard'); }} />;
      default: return <Dashboard onViewChange={setActiveView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-natural-bg">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto max-h-screen">
        <div className="max-w-7xl mx-auto h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {isNewUser ? (
                <Onboarding onComplete={() => setActiveView('dashboard')} />
              ) : (
                renderView()
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <MobileNav activeView={activeView} onViewChange={setActiveView} />
      <WeddingAIBot />
    </div>
  );
}

export default function App() {
  return (
    <GuestProvider>
      <AppContent />
    </GuestProvider>
  );
}
