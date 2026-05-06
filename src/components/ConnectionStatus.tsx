import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, CloudOff, CloudCheck } from 'lucide-react';
import { cn } from '../lib/utils';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div 
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all",
        isOnline 
          ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
          : "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="w-3 h-3" />
          <span>Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          <span>Offline Mode</span>
        </>
      )}
    </div>
  );
}
