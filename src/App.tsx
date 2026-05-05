import { useState } from 'react';
import { View } from './types';
import { GuestProvider, useGuests } from './context/GuestContext';
import { Sidebar, MobileNav } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { GuestList } from './pages/GuestList';
import { AddGuest } from './pages/AddGuest';
import { Categories } from './pages/Categories';
import { Settings } from './pages/Settings';
import { AnimatePresence, motion } from 'motion/react';
import { Heart, LogIn, Loader2 } from 'lucide-react';

function AppContent() {
  const { user, login, isLoading } = useGuests();
  const [activeView, setActiveView] = useState<View>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-natural-sidebar">
        <Loader2 className="w-10 h-10 text-natural-olive animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-natural-sidebar relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
           <Heart className="w-[80vw] h-[80vw] fill-natural-olive" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-12 rounded-[3.5rem] shadow-2xl border border-natural-border text-center relative z-10"
        >
          <div className="w-20 h-20 bg-natural-olive text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg rotate-3 group overflow-hidden">
            <Heart className="w-10 h-10 fill-current group-hover:scale-125 transition-transform duration-500" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-natural-olive mb-4">Wedding Manager</h1>
          <p className="text-natural-muted text-sm leading-relaxed mb-10">Welcome to your personal guest list manager. Sign in to start organizing your special day.</p>
          
          <button 
            onClick={login}
            className="w-full flex items-center justify-center gap-3 py-4 bg-natural-olive text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-xs hover:bg-[#4a4a35] hover:shadow-xl transition-all active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            Sign in with Google
          </button>
          
          <p className="mt-8 text-[10px] uppercase tracking-widest text-natural-muted font-bold opacity-40">Your data is safe and private</p>
        </motion.div>
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard />;
      case 'guests': return <GuestList />;
      case 'add': return <AddGuest />;
      case 'categories': return <Categories />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
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
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <MobileNav activeView={activeView} onViewChange={setActiveView} />
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
