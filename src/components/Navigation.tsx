import React from 'react';
import { LayoutDashboard, Users, UserPlus, Tags, Settings, LogOut } from 'lucide-react';
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
    <aside className="w-64 bg-white border-r border-natural-border h-screen sticky top-0 hidden md:flex flex-col p-8">
      <div className="mb-12">
        <h1 className="text-xl font-serif font-bold text-natural-olive tracking-tight">Moriah</h1>
        <p className="text-[9px] uppercase tracking-[0.2em] text-natural-muted mt-1 font-medium opacity-70">
          Wedding Planner
        </p>
      </div>
      
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-xs font-medium tracking-wide",
              activeView === item.id 
                ? "bg-natural-sidebar text-natural-olive" 
                : "text-natural-ink hover:bg-natural-sidebar/50"
            )}
          >
            <item.icon className={cn(
              "w-4 h-4",
              activeView === item.id ? "text-natural-olive" : "text-natural-muted"
            )} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="mt-auto space-y-4">
        <div className="py-4 border-t border-natural-border/50">
          <p className="text-[9px] uppercase tracking-wider text-natural-muted font-medium mb-1">Celebration</p>
          <p className="text-xs font-medium text-natural-olive truncate">{settings.brideName} & {settings.groomName}</p>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all text-xs font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export function MobileNav({ activeView, onViewChange }: SidebarProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-natural-border px-6 py-3 pb-8">
      <nav className="flex justify-around items-center">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 transition-all duration-200",
              activeView === item.id ? "text-natural-olive" : "text-natural-muted"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[8px] uppercase tracking-wider font-bold">
              {item.id === 'dashboard' ? 'Home' : item.label.split(' ')[0]}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
