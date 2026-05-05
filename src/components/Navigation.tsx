import React from 'react';
import { LayoutDashboard, Users, UserPlus, Tags, Settings, Heart, LogOut } from 'lucide-react';
import { View } from '../types';
import { cn } from '../lib/utils';
import { useGuests } from '../context/GuestContext';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

const menuItems: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'guests', label: 'Guest List', icon: Users },
  { id: 'add', label: 'Add Guest', icon: UserPlus },
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { settings, logout } = useGuests();

  return (
    <aside className="w-64 bg-natural-sidebar border-r border-natural-border h-screen sticky top-0 hidden md:flex flex-col p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-32 bg-natural-accent/10 -translate-y-1/2 rounded-full blur-[60px] pointer-events-none" />
      
      <div className="mb-14 relative">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-natural-border/30">
           <Heart className="w-6 h-6 text-natural-olive fill-current" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-natural-olive leading-tight">Moriah</h1>
        <p className="text-[10px] uppercase tracking-[0.3em] text-natural-muted mt-2 font-black opacity-60">
          Wedding Planner
        </p>
      </div>
      
      <nav className="flex-1 space-y-2 relative z-10">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group text-sm font-bold uppercase tracking-widest",
              activeView === item.id 
                ? "bg-natural-olive text-white shadow-[0_10px_20px_rgba(90,90,64,0.2)]" 
                : "text-natural-ink hover:bg-natural-accent/50"
            )}
          >
            <item.icon className={cn(
              "w-4 h-4 transition-transform group-hover:scale-110",
              activeView === item.id ? "text-white" : "text-natural-olive opacity-50"
            )} />
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="mt-auto space-y-6 relative z-10">
        <div className="bg-white/50 backdrop-blur-sm p-6 rounded-[2rem] border border-natural-border/40 shadow-inner group">
          <p className="text-[9px] uppercase tracking-[0.2em] text-natural-muted font-bold group-hover:text-natural-olive transition-colors">Celebration of</p>
          <div className="mt-1">
            <span className="text-sm font-serif font-bold text-natural-olive">{settings.brideName} & {settings.groomName}</span>
            <div className="h-[1px] w-full bg-natural-border/50 my-2" />
            <span className="text-[10px] text-natural-muted font-medium">{new Date(settings.weddingDate).toLocaleDateString()}</span>
          </div>
        </div>

        <button 
          onClick={logout}
          className="w-full flex items-center gap-4 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all text-[10px] font-bold uppercase tracking-[0.2em] group"
        >
          <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export function MobileNav({ activeView, onViewChange }: SidebarProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 z-[100] bg-gradient-to-t from-white via-white to-transparent">
      <nav className="bg-natural-olive text-white rounded-[2rem] flex justify-around items-center p-3 shadow-[0_20px_50px_rgba(90,90,64,0.4)] border border-white/20 backdrop-blur-md">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300 px-3 py-1 rounded-xl",
              activeView === item.id ? "bg-white/10 scale-110 shadow-inner" : "opacity-50"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[8px] uppercase font-sans font-black tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
