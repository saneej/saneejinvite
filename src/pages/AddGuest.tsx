import React, { useState } from 'react';
import { useGuests } from '../context/GuestContext';
import { InvitationStatus } from '../types';
import { UserPlus, AlertCircle, CheckCircle2, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AddGuest() {
  const { addGuest, guests, categories } = useGuests();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || '');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<InvitationStatus>(InvitationStatus.NOT_INVITED);
  
  const [showWarning, setShowWarning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent, force = false) => {
    e.preventDefault();
    if (!name) return;

    if (!force) {
      const exists = guests.some(g => g.name.toLowerCase() === name.toLowerCase());
      if (exists) {
        setShowWarning(true);
        return;
      }
    }

    addGuest({
      name,
      phone,
      category,
      notes,
      status
    });

    // Reset fields
    setName('');
    setPhone('');
    setNotes('');
    setShowWarning(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-24 md:pb-0 color-overlap min-h-screen">
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-natural-accent/15 rounded-full blur-[100px] pointer-events-none" />

      <header className="text-center relative pt-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-natural-olive/10 text-natural-olive rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-natural-border/30 rotate-3"
        >
          <UserPlus className="w-10 h-10" />
        </motion.div>
        <h2 className="text-5xl font-serif font-bold text-natural-olive mb-4">Add New Guest</h2>
        <div className="flex items-center justify-center gap-3">
          <Heart className="w-3 h-3 text-natural-accent fill-natural-accent" />
          <p className="text-natural-muted font-sans text-[10px] uppercase tracking-[0.3em] font-black">Growing your circle of love</p>
        </div>
      </header>

      <motion.form 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onSubmit={handleSubmit} 
        className="glass-card p-10 md:p-16 relative overflow-hidden shadow-2xl border-none"
      >
        <div className="absolute top-10 right-10 opacity-[0.03] pointer-events-none floating-accent">
          <Heart className="w-64 h-64 fill-natural-olive" />
        </div>
        
        <div className="space-y-10 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-natural-muted ml-2">Guest Identity</label>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-natural !bg-white/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-natural-muted ml-2">Contact Link</label>
              <input
                type="text"
                placeholder="WhatsApp or Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-natural !bg-white/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-natural-muted ml-2">Guest Group</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-natural !bg-white/50 cursor-pointer appearance-none"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-natural-muted ml-2">Invitation Flow</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InvitationStatus)}
                className="input-natural !bg-white/50 cursor-pointer appearance-none"
              >
                {Object.values(InvitationStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-natural-muted ml-2">Personal Considerations</label>
            <textarea
              placeholder="Dietary preferences, special roles, or travel notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-natural !bg-white/50 h-44 resize-none leading-relaxed py-6"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="btn-primary w-full py-6 group relative overflow-hidden"
            >
              <span className="relative z-10">Register Guest to List</span>
              <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
            </button>
          </div>

          <AnimatePresence>
            {showWarning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-natural-accent/10 border border-natural-accent/30 p-6 rounded-3xl flex flex-col gap-4"
              >
                <div className="flex items-center gap-3 text-natural-olive">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="font-bold text-sm">Duplicate Identity Detected</p>
                </div>
                <p className="text-sm text-natural-muted leading-relaxed font-medium">"{name}" is already present in your list. Are you sure you wish to add another entry with this name?</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    className="px-6 py-3 bg-natural-olive text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-natural-ink transition-colors shadow-md"
                  >
                    Confirm Addition
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWarning(false)}
                    className="px-6 py-3 bg-white text-natural-muted text-[10px] font-bold uppercase tracking-widest rounded-xl border border-natural-border transition-colors"
                  >
                    Discard Changes
                  </button>
                </div>
              </motion.div>
            )}

            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center gap-4 text-emerald-800 shadow-lg"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                   <p className="font-bold text-sm">Guest Successfully Added</p>
                   <p className="text-xs text-emerald-600/70">Your celebration list has been updated.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.form>
    </div>
  );
}
