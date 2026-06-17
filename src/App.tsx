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
import { SharedListPage } from './pages/SharedList';
import { CategoryDetail } from './pages/CategoryDetail';
import { Checklist } from './pages/Checklist';
import { AnimatePresence, motion } from 'motion/react';
import { Flower } from 'lucide-react';
import { Preloader } from './components/Preloader';

import { LandingPage } from './components/LandingPage';

function AppContent() {
  const { user, login, isLoading, settings } = useGuests();
  
  // URL Param detection
  const urlParams = new URLSearchParams(window.location.search);
  const initialShareId = urlParams.get('share');
  
  const [activeView, setActiveView] = useState<View>(initialShareId ? 'shared' : 'dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sharedId] = useState(initialShareId);
  
  // Decide whether to show onboarding based on settings
  const isNewUser = user && !isLoading && settings.brideName === 'Emma' && settings.groomName === 'James';

  if (isLoading) {
    return <Preloader />;
  }

  if (!user) {
    return <LandingPage onLogin={login} />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard onViewChange={setActiveView} />;
      case 'guests': return <GuestList onViewChange={setActiveView} />;
      case 'add': return <AddGuest onViewChange={setActiveView} />;
      case 'categories': return <Categories onViewChange={setActiveView} onCategorySelect={setSelectedCategory} />;
      case 'settings': return <Settings />;
      case 'invite': return <Invite />;
      case 'logs': return <Logs />;
      case 'onboarding': return <Onboarding onComplete={() => { setActiveView('dashboard'); }} />;
      case 'shared': return <SharedListPage sharedId={sharedId || ''} onImportSuccess={() => setActiveView('guests')} />;
      case 'checklist': return <Checklist onViewChange={setActiveView} />;
      case 'category-detail': return <CategoryDetail categoryName={selectedCategory || ''} onViewChange={setActiveView} />;
      default: return <Dashboard onViewChange={setActiveView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-natural-sidebar font-sans selection:bg-natural-olive/20">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      
      <main className="flex-1 min-w-0 relative pb-24 md:pb-8">
        {/* Subtle Background Pattern */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
          <svg width="100%" height="100%">
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-12 relative z-10">
          {/* Mobile Header */}
          <div className="md:hidden flex flex-col items-center justify-center mb-10 px-2 text-center">
            <motion.div 
              whileTap={{ scale: 0.9 }}
              className="w-12 h-12 rounded-2xl bg-white shadow-xl border border-natural-border/30 flex items-center justify-center text-natural-olive mb-4"
            >
              <Flower className="w-6 h-6" />
            </motion.div>
            <div className="group transition-all">
              <h1 className="text-2xl font-serif font-black text-natural-olive italic leading-none transition-transform group-hover:-rotate-1">Wedding Vows</h1>
              <p className="text-[9px] uppercase tracking-[0.4em] text-natural-muted font-black opacity-40 mt-3">Shaadi Manager</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ 
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1] 
              }}
              className="h-full"
            >
              {isNewUser && activeView === 'dashboard' ? (
                <Onboarding onComplete={() => setActiveView('dashboard')} />
              ) : (
                renderView()
              )}
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
