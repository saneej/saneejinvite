import React, { useState } from 'react';
import { useGuests } from '../context/GuestContext';
import { InvitationStatus, View } from '../types';
import { Check, Search, ArrowLeft, Smile } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface ChecklistProps {
  onViewChange: (view: View) => void;
}

export function Checklist({ onViewChange }: ChecklistProps) {
  const { guests, updateGuest } = useGuests();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'not_invited' | 'invited'>('all');

  // Toggle guest invited status
  const handleToggle = async (guestId: string, currentStatus: InvitationStatus) => {
    const isInvited = currentStatus === InvitationStatus.INVITED || currentStatus === InvitationStatus.CONFIRMED;
    const newStatus = isInvited ? InvitationStatus.NOT_INVITED : InvitationStatus.INVITED;
    await updateGuest(guestId, { status: newStatus });
  };

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterMode === 'not_invited') {
      return guest.status === InvitationStatus.NOT_INVITED && matchesSearch;
    }
    if (filterMode === 'invited') {
      return (guest.status === InvitationStatus.INVITED || guest.status === InvitationStatus.CONFIRMED) && matchesSearch;
    }
    return matchesSearch;
  });

  const totalCount = guests.length;
  const invitedCount = guests.filter(g => g.status === InvitationStatus.INVITED || g.status === InvitationStatus.CONFIRMED).length;
  const pendingCount = totalCount - invitedCount;

  // Stagger animation rules
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', sharpness: 100 } }
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-natural-border/60 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-natural-olive/5 rounded-bl-full pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <button
              onClick={() => onViewChange('dashboard')}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-natural-olive hover:text-natural-ink transition-colors px-3 py-1.5 bg-natural-sidebar/50 rounded-full border border-natural-border/30"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </button>
            <h2 className="text-3xl md:text-4xl font-serif font-black text-natural-ink italic pt-2 flex items-center gap-2.5">
              ✍️ Invitation Checklist
            </h2>
            <p className="text-[11px] uppercase tracking-widest font-black text-natural-muted">
              The simplest way to check off who is invited and who is pending!
            </p>
          </div>

          {/* Quick Scorecard Bubble */}
          <div className="bg-natural-sidebar/40 border border-natural-border/30 px-6 py-4 rounded-[2rem] flex items-center gap-4 shrink-0">
            <div className="text-center">
              <span className="text-3xl font-serif font-black text-emerald-600 italic">{invitedCount}</span>
              <p className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 mt-1">✓ Invited</p>
            </div>
            <div className="h-8 w-px bg-natural-border/40" />
            <div className="text-center">
              <span className="text-3xl font-serif font-black text-slate-400 italic">{pendingCount}</span>
              <p className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 mt-1">⏳ Pending</p>
            </div>
            <div className="h-8 w-px bg-natural-border/40" />
            <div className="text-center">
              <span className="text-3xl font-serif font-black text-natural-olive italic">{totalCount}</span>
              <p className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 mt-1">👥 Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-white p-4 rounded-[2rem] border border-natural-border/60 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="🔎 Who are you looking for? Type a name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-natural-sidebar/40 border border-natural-border/30 pl-11 pr-5 py-3 h-12 rounded-2xl text-xs outline-none focus:ring-4 focus:ring-natural-olive/5 focus:bg-white focus:border-natural-olive transition-all text-natural-ink"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex bg-natural-sidebar/40 p-1 rounded-2xl border border-natural-border/20 w-full md:w-auto overflow-x-auto shrink-0 select-none">
          <button
            onClick={() => setFilterMode('all')}
            className={cn(
              "flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
              filterMode === 'all' 
                ? "bg-white text-natural-ink shadow-sm" 
                : "text-natural-muted hover:text-natural-ink"
            )}
          >
            All Guests ({totalCount})
          </button>
          <button
            onClick={() => setFilterMode('not_invited')}
            className={cn(
              "flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
              filterMode === 'not_invited' 
                ? "bg-white text-slate-800 shadow-sm border border-slate-100" 
                : "text-natural-muted hover:text-natural-ink"
            )}
          >
            ⏳ Pending ({guests.filter(g => g.status === InvitationStatus.NOT_INVITED).length})
          </button>
          <button
            onClick={() => setFilterMode('invited')}
            className={cn(
              "flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
              filterMode === 'invited' 
                ? "bg-white text-emerald-600 shadow-sm border border-emerald-50" 
                : "text-natural-muted hover:text-natural-ink"
            )}
          >
            ✓ Invited ({guests.filter(g => g.status === InvitationStatus.INVITED || g.status === InvitationStatus.CONFIRMED).length})
          </button>
        </div>
      </div>

      {/* Guest Checklist Display */}
      {filteredGuests.length > 0 ? (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
        >
          {filteredGuests.map((guest) => {
            const isInvited = guest.status === InvitationStatus.INVITED || guest.status === InvitationStatus.CONFIRMED;
            
            return (
              <motion.div
                key={guest.id}
                variants={itemVariants}
                onClick={() => handleToggle(guest.id, guest.status)}
                className={cn(
                  "relative group cursor-pointer p-6 rounded-[2rem] border-2 flex items-center justify-between transition-all duration-300 md:hover:scale-[1.02] select-none",
                  isInvited
                    ? "bg-emerald-50/15 border-emerald-200/60 shadow-sm shadow-emerald-500/[0.02]"
                    : "bg-white border-natural-border/50 hover:border-natural-olive/20 hover:shadow-md"
                )}
              >
                {/* Visual glow backdrop for checked item */}
                {isInvited && (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 to-transparent pointer-events-none rounded-[2rem]" />
                )}

                <div className="min-w-0 pr-4 z-10">
                  <span className="text-[8px] font-black uppercase tracking-widest text-natural-muted/65 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                    {guest.category}
                  </span>
                  <h4 className={cn(
                    "text-base font-serif font-black mt-2 leading-tight transition-all truncate italic",
                    isInvited ? "text-emerald-800 line-through decoration-emerald-200/80 decoration-2" : "text-natural-ink"
                  )}>
                    {guest.name}
                  </h4>
                  <p className="text-[10px] text-natural-muted mt-1 font-medium">
                    {guest.phone ? `📞 ${guest.phone}` : 'No phone number'}
                  </p>
                </div>

                {/* Circular Satisfying Tick box */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevents double click toggle
                    handleToggle(guest.id, guest.status);
                  }}
                  className={cn(
                    "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0 relative z-20 shadow-sm",
                    isInvited
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105"
                      : "border-slate-300 bg-slate-50 text-slate-300 hover:border-emerald-500 hover:text-emerald-500 hover:bg-white"
                  )}
                  title={isInvited ? "Mark as Not Invited" : "Mark as Invited"}
                >
                  <Check className={cn(
                    "w-6 h-6 stroke-[4px] transition-transform duration-300",
                    isInvited ? "scale-100 rotate-0" : "scale-0 rotate-12"
                  )} />
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="bg-white py-16 px-6 text-center text-natural-muted italic rounded-[2.5rem] border border-dashed border-natural-border/80 shadow-inner">
          <Smile className="w-10 h-10 mx-auto text-natural-olive/30 mb-3 animate-bounce" />
          <p className="font-serif font-black text-natural-ink text-sm not-italic">
            No guests found!
          </p>
          <p className="text-xs text-natural-muted mt-1">
            {guests.length === 0 
              ? "Add some guests in the list creator first!" 
              : "Try typing a different name in the search box."}
          </p>
          {guests.length === 0 && (
            <button
              onClick={() => onViewChange('add')}
              className="mt-4 px-6 py-2.5 bg-natural-olive text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-natural-ink transition-colors"
            >
              Add Your First Guest 🚀
            </button>
          )}
        </div>
      )}
    </div>
  );
}
