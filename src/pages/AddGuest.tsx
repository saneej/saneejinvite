import React, { useState, useRef } from 'react';
import { useGuests } from '../context/GuestContext';
import { InvitationStatus, View } from '../types';
import { AlertCircle, CheckCircle2, Upload, Sparkles, X, Loader2, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { extractGuestsFromImage } from '../services/aiService';
import { cn } from '../lib/utils';

type EntryMode = 'SINGLE' | 'BULK' | 'AI';

export function AddGuest({ onViewChange }: { onViewChange: (view: View) => void }) {
  const { addGuest, guests, categories, settings } = useGuests();
  const [mode, setMode] = useState<EntryMode>('SINGLE');
  
  // Single Mode State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || '');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<InvitationStatus>(InvitationStatus.NOT_INVITED);
  const [showPreview, setShowPreview] = useState(false);

  // Bulk Mode State
  const [bulkText, setBulkText] = useState('');

  // AI Mode State
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedNames, setExtractedNames] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showWarning, setShowWarning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const recentlyAdded = guests.slice(-5).reverse();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        const names = await extractGuestsFromImage(base64, file.type);
        setExtractedNames(names);
        setIsExtracting(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsExtracting(false);
      alert("Failed to read image. Please try again.");
    }
  };

  const handleAiSubmit = () => {
    extractedNames.forEach(n => {
      addGuest({
        name: n,
        category,
        status,
        notes: '',
        phone: ''
      });
    });
    setExtractedNames([]);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setMode('SINGLE');
  };

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
      <header className="pt-4 border-b border-natural-border/50 pb-8 px-4">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-serif font-bold text-natural-ink">Add Guests</h2>
            <p className="text-natural-muted text-[10px] uppercase tracking-[0.2em] font-medium mt-1">Expanding your celebration</p>
          </div>
        </div>
        
        <div className="flex gap-2 p-1 bg-natural-sidebar/30 rounded-xl w-fit">
          <button 
            onClick={() => setMode('SINGLE')}
            className={cn(
              "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
              mode === 'SINGLE' ? "bg-white text-natural-olive shadow-sm" : "text-natural-muted hover:text-natural-ink"
            )}
          >
            Single
          </button>
          <button 
            onClick={() => setMode('BULK')}
            className={cn(
              "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
              mode === 'BULK' ? "bg-white text-natural-olive shadow-sm" : "text-natural-muted hover:text-natural-ink"
            )}
          >
            Bulk Paste
          </button>
          <button 
            onClick={() => setMode('AI')}
            className={cn(
              "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2",
              mode === 'AI' ? "bg-white text-natural-olive shadow-sm" : "text-natural-muted hover:text-natural-ink"
            )}
          >
            <Sparkles className="w-3 h-3" />
            AI Screenshot
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {mode === 'BULK' ? (
          <motion.form 
            key="bulk"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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
        ) : mode === 'AI' ? (
          <motion.div
            key="ai"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-8 rounded-2xl border border-natural-border/60 shadow-sm space-y-8 mx-4"
          >
            {!extractedNames.length ? (
              <div className="space-y-6 text-center py-8">
                <div className="w-16 h-16 bg-natural-sidebar rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-natural-olive" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-natural-ink">Upload Screenshot</h3>
                  <p className="text-xs text-natural-muted max-w-xs mx-auto mt-2 leading-relaxed">
                    Upload a screenshot of your WhatsApp group or member list. AI will extract the names automatically.
                  </p>
                </div>
                
                <input 
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isExtracting}
                  className="btn-primary px-8 py-3 flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Select Image
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-natural-sidebar/30 p-4 rounded-xl">
                  <div>
                    <h4 className="text-sm font-bold text-natural-olive italic">{extractedNames.length} names extracted</h4>
                    <p className="text-[10px] tracking-widest uppercase text-natural-muted">Review names before adding</p>
                  </div>
                  <button onClick={() => setExtractedNames([])} className="p-2 text-natural-muted hover:text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {extractedNames.map((name, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-natural-sidebar/20 rounded-xl border border-natural-border/20 group">
                      <input 
                        className="flex-1 bg-transparent text-sm font-serif outline-none border-b border-transparent focus:border-natural-olive/30"
                        value={name}
                        onChange={(e) => {
                          const newNames = [...extractedNames];
                          newNames[idx] = e.target.value;
                          setExtractedNames(newNames);
                        }}
                      />
                      <button 
                        onClick={() => setExtractedNames(prev => prev.filter((_, i) => i !== idx))}
                        className="opacity-0 group-hover:opacity-100 text-natural-muted hover:text-rose-500 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
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
                    <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">Status</label>
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
                  onClick={handleAiSubmit}
                  className="w-full bg-natural-olive text-white py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-natural-ink transition-all"
                >
                  Confirm & Add to List
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.form 
            key="single"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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

        {/* WhatsApp Preview Toggle */}
        <div className="bg-natural-sidebar/20 rounded-2xl border border-natural-border/30 overflow-hidden">
          <button 
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="w-full px-6 py-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-natural-muted hover:text-natural-olive transition-colors"
          >
            <div className="flex items-center gap-2">
              {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              Invite Message Preview
            </div>
            <span className="text-[8px] opacity-60">View template example</span>
          </button>
          
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-6"
              >
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 leading-relaxed font-serif whitespace-pre-wrap">
                  {(settings.whatsappTemplate || '')
                    .replace('[Name]', name || 'Guest Name')
                    .replace('[Date]', settings.weddingDate || '')
                    .replace('[Venue]', settings.venue || '')}
                </div>
                <p className="text-[9px] text-natural-muted mt-2 italic">* Edit template in Settings</p>
              </motion.div>
            )}
          </AnimatePresence>
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
      </AnimatePresence>

      {/* Recently Added List */}
      {guests.length > 0 && (
        <section className="mx-4 space-y-4">
          <div className="flex justify-between items-end px-1">
            <div>
              <h3 className="text-sm font-serif font-bold text-natural-ink">Recently Added</h3>
              <p className="text-[9px] text-natural-muted uppercase tracking-widest">Last 5 additions</p>
            </div>
            <button 
              onClick={() => onViewChange('guests')}
              className="text-[9px] font-bold uppercase tracking-widest text-natural-olive hover:underline"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-2">
            {recentlyAdded.map((guest) => (
              <div key={guest.id} className="bg-white p-3 rounded-xl border border-natural-border/40 flex justify-between items-center group">
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-natural-ink truncate">{guest.name}</h4>
                  <p className="text-[9px] uppercase tracking-wider text-natural-muted font-medium">{guest.category}</p>
                </div>
                <div className="flex items-center gap-2">
                   <div className={cn(
                    "px-1.5 py-0.5 rounded text-[7px] uppercase font-bold tracking-tight",
                    guest.status === InvitationStatus.NOT_INVITED ? "bg-slate-50 text-slate-400" : "bg-emerald-50 text-emerald-600"
                  )}>
                    {guest.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
