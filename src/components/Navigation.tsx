import React from 'react';
import { LayoutDashboard, Users, UserPlus, Tags, Settings, LogOut, Send, History, Flower, CheckCircle2 } from 'lucide-react';
import { View } from '../types';
import { cn } from '../lib/utils';
import { useGuests } from '../context/GuestContext';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

const menuItems: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'guests', label: 'Guest List', icon: Users },
  { id: 'checklist', label: 'Simple Checklist ✍️', icon: CheckCircle2 },
  { id: 'add', label: 'Add Guest', icon: UserPlus },
  { id: 'invite', label: 'Invite', icon: Send },
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'logs', label: 'Logs', icon: History },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { settings, logout } = useGuests();

  return (
    <aside className="w-64 bg-white border-r border-natural-border h-screen sticky top-0 hidden md:flex flex-col p-8 z-50">
      <div className="mb-12 flex flex-col items-center text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-3xl bg-natural-olive text-white flex items-center justify-center shadow-2xl shadow-natural-olive/30 mb-4 rotate-3 hover:rotate-0 transition-transform duration-500">
            <Flower className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-black text-natural-olive tracking-tight leading-none italic">Wedding Vows</h1>
            <p className="text-[9px] uppercase tracking-[0.5em] text-natural-muted mt-3 font-black opacity-40">
              SHAADI MANAGER
            </p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group text-xs font-medium tracking-wide relative overflow-hidden",
                isActive 
                  ? "text-natural-olive" 
                  : "text-natural-ink hover:bg-natural-sidebar/50"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-natural-sidebar -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon className={cn(
                "w-4 h-4 transition-transform group-hover:scale-110",
                isActive ? "text-natural-olive" : "text-natural-muted"
              )} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="mt-auto space-y-4">
        <div className="p-4 bg-natural-sidebar/30 rounded-2xl border border-natural-border/30">
          <p className="text-[8px] uppercase tracking-wider text-natural-muted font-bold mb-1 opacity-50">Planning with</p>
          <p className="text-xs font-serif font-bold text-natural-olive truncate italic">
            {settings.brideName} & {settings.groomName}
          </p>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

const mobileItems: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'guests', label: 'Guests', icon: Users },
  { id: 'add', label: 'Add', icon: UserPlus },
  { id: 'invite', label: 'Invite', icon: Send },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function MobileNav({ activeView, onViewChange }: SidebarProps) {
  return (
    <div className="md:hidden fixed bottom-6 left-6 right-6 z-[100] bg-white/80 backdrop-blur-xl border border-natural-border shadow-2xl rounded-[2.5rem] px-4 py-2 ring-1 ring-black/5">
      <nav className="flex justify-between items-center relative gap-1">
        {mobileItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-2xl transition-all duration-500 relative group",
                isActive ? "text-natural-olive" : "text-natural-muted"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="mobile-active"
                  className="absolute inset-0 bg-natural-sidebar rounded-2xl -z-10"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
              <div className="relative">
                <item.icon className={cn(
                  "w-5 h-5 transition-all duration-300",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )} />
                {isActive && (
                  <motion.div 
                    layoutId="mobile-dot"
                    className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-natural-olive rounded-full border-2 border-white"
                  />
                )}
              </div>
              <span className={cn(
                "text-[8px] uppercase tracking-[0.2em] font-bold transition-all duration-300",
                isActive ? "opacity-100 translate-y-0" : "opacity-40"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
