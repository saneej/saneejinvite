import React from 'react';
import { useGuests } from '../context/GuestContext';
import { History, UserPlus, Trash2, Edit2, FileDown, Clock, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export function Logs() {
  const { logs } = useGuests();

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Added Guest': return <UserPlus className="w-4 h-4 text-emerald-600" />;
      case 'Deleted Guest': return <Trash2 className="w-4 h-4 text-rose-600" />;
      case 'Updated Guest': return <Edit2 className="w-4 h-4 text-amber-600" />;
      case 'Bulk Import': return <FileDown className="w-4 h-4 text-blue-600" />;
      default: return <History className="w-4 h-4 text-natural-muted" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4">
      <header className="pt-4 border-b border-natural-border/50 pb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-natural-olive/10 rounded-2xl">
            <History className="w-6 h-6 text-natural-olive" />
          </div>
          <div>
            <h2 className="text-3xl font-serif font-bold text-natural-ink">Activity Log</h2>
            <p className="text-natural-muted text-[10px] uppercase tracking-[0.2em] font-medium mt-1">
              Tracking your progress & changes
            </p>
          </div>
        </div>
      </header>

      {logs.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-natural-sidebar rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-natural-muted opacity-30" />
          </div>
          <div>
            <p className="text-natural-ink font-serif font-medium">No activity yet</p>
            <p className="text-natural-muted text-xs">Your actions will appear here as you manage your guests.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="group bg-white border border-natural-border/30 rounded-2xl p-5 hover:shadow-lg transition-all flex items-start gap-5"
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                log.action === 'Added Guest' ? "bg-emerald-50" :
                log.action === 'Deleted Guest' ? "bg-rose-50" :
                log.action === 'Updated Guest' ? "bg-amber-50" : "bg-blue-50"
              )}>
                {getActionIcon(log.action)}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-natural-ink uppercase tracking-wider">{log.action}</h4>
                  <span className="text-[10px] text-natural-muted font-medium">
                    {format(log.timestamp, 'MMM d, h:mm a')}
                  </span>
                </div>
                <p className="text-sm text-natural-ink/80 font-medium">{log.details}</p>
                {log.guestName && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[9px] font-bold text-natural-muted uppercase tracking-tighter">Target:</span>
                    <span className="text-[9px] font-bold text-natural-olive">{log.guestName}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          <p className="text-center text-[9px] text-natural-muted italic pt-4">
            Showing the last 100 activities. Activity logs are synced across your devices.
          </p>
        </div>
      )}
    </div>
  );
}
