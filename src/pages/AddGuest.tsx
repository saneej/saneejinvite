import React, { useState } from 'react';
import { useGuests } from '../context/GuestContext';
import { InvitationStatus } from '../types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AddGuest() {
  const { addGuest, guests, categories } = useGuests();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || '');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<InvitationStatus>(InvitationStatus.NOT_INVITED);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  
  const [showWarning, setShowWarning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const names = bulkText.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    
    names.forEach(n => {
      addGuest({
        name: n,
        category,
        status,
        notes: '',
        phone: ''
      });
    });

    setBulkText('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

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
    <div className="max-w-xl mx-auto space-y-10 pb-20">
      <header className="pt-4 border-b border-natural-border/50 pb-8 px-4 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif font-bold text-natural-ink">Add Guest</h2>
          <p className="text-natural-muted text-[10px] uppercase tracking-[0.2em] font-medium mt-1">Expanding your celebration</p>
        </div>
        <button 
          onClick={() => setBulkMode(!bulkMode)}
          className="text-[10px] font-bold uppercase tracking-widest text-natural-olive border border-natural-olive/30 px-3 py-1.5 rounded-lg hover:bg-natural-olive hover:text-white transition-all"
        >
          {bulkMode ? 'Single Entry' : 'Bulk Paste'}
        </button>
      </header>

      {bulkMode ? (
        <motion.form 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleBulkSubmit}
          className="bg-white p-8 rounded-2xl border border-natural-border/60 shadow-sm space-y-6 mx-4"
        >
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">Paste Names (One per line)</label>
            <textarea
              required
              placeholder="John Doe&#10;Jane Smith&#10;The Johnson Family"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="w-full bg-natural-sidebar/30 border border-natural-border/50 px-4 py-4 rounded-xl text-sm outline-none focus:border-natural-olive transition-all h-64 font-serif"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">Assign Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-natural-sidebar/30 border border-natural-border/50 px-4 py-3 rounded-xl text-xs outline-none appearance-none cursor-pointer"
              >
                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InvitationStatus)}
                className="w-full bg-natural-sidebar/30 border border-natural-border/50 px-4 py-3 rounded-xl text-xs outline-none appearance-none cursor-pointer"
              >
                {Object.values(InvitationStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-natural-olive text-white py-4 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-natural-ink transition-colors"
          >
            Add All Guests
          </button>
        </motion.form>
      ) : (
        <motion.form 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleSubmit} 
          className="bg-white p-8 md:p-10 rounded-2xl border border-natural-border/60 shadow-sm space-y-8 mx-4"
        >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">Guest Name</label>
            <input
              type="text"
              required
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-natural-sidebar/30 border border-natural-border/50 px-4 py-3 rounded-xl text-sm outline-none focus:border-natural-olive transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">Contact Info</label>
            <input
              type="text"
              placeholder="WhatsApp or Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-natural-sidebar/30 border border-natural-border/50 px-4 py-3 rounded-xl text-sm outline-none focus:border-natural-olive transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-natural-sidebar/30 border border-natural-border/50 px-4 py-3 rounded-xl text-sm outline-none focus:border-natural-olive transition-all appearance-none cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as InvitationStatus)}
              className="w-full bg-natural-sidebar/30 border border-natural-border/50 px-4 py-3 rounded-xl text-sm outline-none focus:border-natural-olive transition-all appearance-none cursor-pointer"
            >
              {Object.values(InvitationStatus).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">Notes</label>
          <textarea
            placeholder="Dietary requirements or special notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-natural-sidebar/30 border border-natural-border/50 px-4 py-3 rounded-xl text-sm outline-none focus:border-natural-olive transition-all h-32 resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-natural-olive text-white py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-natural-ink transition-colors shadow-sm"
        >
          Add Guest to List
        </button>

        <AnimatePresence>
          {showWarning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-natural-accent/5 border border-natural-accent/20 p-6 rounded-xl space-y-4"
            >
              <div className="flex items-center gap-2 text-natural-olive">
                <AlertCircle className="w-4 h-4" />
                <p className="text-xs font-bold uppercase tracking-wider">Duplicate Found</p>
              </div>
              <p className="text-xs text-natural-muted leading-relaxed font-medium">"{name}" is already in your list. Add them anyway?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  className="px-4 py-2 bg-natural-olive text-white text-[10px] font-bold uppercase rounded-lg hover:bg-natural-ink transition-colors"
                >
                  Yes, Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowWarning(false)}
                  className="px-4 py-2 bg-white border border-natural-border text-natural-muted text-[10px] font-bold uppercase rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 text-emerald-800"
            >
              <CheckCircle2 className="w-4 h-4" />
              <p className="text-xs font-bold uppercase tracking-wider">Added Successfully</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>
      )}
    </div>
  );
}
