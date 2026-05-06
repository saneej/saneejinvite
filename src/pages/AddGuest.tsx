import React, { useState, useRef } from 'react';
import { useGuests } from '../context/GuestContext';
import { InvitationStatus, View, Guest } from '../types';
import { AlertCircle, CheckCircle2, Upload, Sparkles, X, Loader2, Plus, Trash2, Eye, EyeOff, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { extractGuestsFromImage } from '../services/aiService';
import { suggestGuestCategory } from '../services/geminiService';
import { cn } from '../lib/utils';

type EntryMode = 'SINGLE' | 'BULK' | 'AI';

export function AddGuest({ onViewChange }: { onViewChange: (view: View) => void }) {
  const { addGuest, bulkAddGuests, guests, categories, settings } = useGuests();
  const [mode, setMode] = useState<EntryMode>('SINGLE');
  
    // Single Mode State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || '');
  const [notes, setNotes] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ category: string, reasoning: string } | null>(null);
  const [suggestedBy, setSuggestedBy] = useState('');
  const [primaryCaller, setPrimaryCaller] = useState('');
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
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);

  const recentlyAdded = guests.slice(-5).reverse();

  const similarGuests = React.useMemo(() => {
    if (name.trim().length < 2) return [];

    const search = name.toLowerCase().trim();
    return guests.filter(g => {
      const guestName = g.name.toLowerCase();
      if (search.includes(guestName) || guestName.includes(search)) return true;
      
      const words1 = search.split(/\s+/).filter(w => w.length > 2);
      const words2 = guestName.split(/\s+/).filter(w => w.length > 2);
      
      return words1.some(w => words2.some(w2 => w2.includes(w) || w.includes(w2)));
    }).slice(0, 3);
  }, [name, guests]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          // Resize image to max 1024px while maintaining aspect ratio
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Use lower quality to reduce base64 size
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
          const names = await extractGuestsFromImage(resizedBase64, 'image/jpeg');
          setExtractedNames(names);
          setIsExtracting(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsExtracting(false);
      alert("Failed to read image. Please try again.");
    }
  };

  const handleAiSubmit = async () => {
    if (extractedNames.length === 0) return;
    
    await bulkAddGuests(extractedNames.map(n => ({
      name: n,
      category,
      status,
      notes: 'Added via AI',
      phone: ''
    })));
    
    setExtractedNames([]);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setMode('SINGLE');
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const names = bulkText.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    if (names.length === 0) return;

    await bulkAddGuests(names.map(n => ({
      name: n,
      category,
      status,
      notes: 'Bulk added',
      phone: ''
    })));

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
      suggestedBy,
      primaryCaller,
      status
    });

    // Reset fields
    setName('');
    setPhone('');
    setNotes('');
    setSuggestedBy('');
    setPrimaryCaller('');
    setAiSuggestion(null);
    setShowWarning(false);
    setIsWarningDismissed(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const getWhatsAppLink = (guest: Guest, type: 'greeting' | 'invitation') => {
    if (!guest.phone) return null;
    const template = type === 'greeting' ? settings.greetingMessage : settings.whatsappTemplate;
    if (!template) return null;
    
    const message = template
      .replace('[Name]', guest.name)
      .replace('[Date]', settings.weddingDate || '')
      .replace('[Venue]', settings.venue || '');
    
    const cleanPhone = guest.phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleSuggestCategory = async () => {
    if (!name.trim()) return;
    setIsSuggesting(true);
    try {
      const result = await suggestGuestCategory({
        guestName: name,
        notes: notes,
        availableCategories: categories
      });
      if (result) {
        setAiSuggestion({
          category: result.suggestedCategory,
          reasoning: result.reasoning
        });
      }
    } finally {
      setIsSuggesting(false);
    }
  };

  const applyAiCategory = () => {
    if (aiSuggestion) {
      setCategory(aiSuggestion.category);
      setAiSuggestion(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto space-y-6 md:space-y-10 pb-24"
    >
      <header className="pt-4 border-b border-natural-border/50 pb-8 px-4 relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-natural-olive/5 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000" />
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-natural-ink italic">Add Guests</h2>
            <p className="text-natural-muted text-[10px] uppercase tracking-[0.3em] font-bold mt-2 opacity-60">Add new guests to your list</p>
          </div>
        </div>
        
        <div className="flex gap-1 p-1.5 bg-natural-sidebar/60 backdrop-blur-sm rounded-[2rem] w-full shadow-inner border border-natural-border/30">
          <button 
            onClick={() => setMode('SINGLE')}
            className={cn(
              "flex-1 px-4 py-3 rounded-[1.5rem] text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
              mode === 'SINGLE' ? "bg-white text-natural-olive shadow-md ring-1 ring-natural-border/10" : "text-natural-muted hover:text-natural-ink"
            )}
          >
            Single
          </button>
          <button 
            onClick={() => setMode('BULK')}
            className={cn(
              "flex-1 px-4 py-3 rounded-[1.5rem] text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
              mode === 'BULK' ? "bg-white text-natural-olive shadow-md ring-1 ring-natural-border/10" : "text-natural-muted hover:text-natural-ink"
            )}
          >
            Bulk
          </button>
          <button 
            onClick={() => setMode('AI')}
            className={cn(
              "flex-1 px-4 py-3 rounded-[1.5rem] text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2",
              mode === 'AI' ? "bg-white text-natural-olive shadow-md ring-1 ring-natural-border/10" : "text-natural-muted hover:text-natural-ink"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Screen</span>
            <span className="sm:hidden">AI</span>
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
                <div className="relative group">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="custom-select w-full h-12 pr-10 appearance-none text-[10px] uppercase font-black tracking-widest"
                  >
                    {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-natural-olive pointer-events-none transition-transform group-hover:translate-y-[-40%]" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">Initial Status</label>
                <div className="relative group">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as InvitationStatus)}
                    className="custom-select w-full h-12 pr-10 appearance-none text-[10px] uppercase font-black tracking-widest"
                  >
                    {Object.values(InvitationStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-natural-olive pointer-events-none transition-transform group-hover:translate-y-[-40%]" />
                </div>
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
                  <h3 className="text-lg font-serif font-bold text-natural-ink">Add from Photo</h3>
                  <p className="text-xs text-natural-muted max-w-xs mx-auto mt-2 leading-relaxed">
                    Take a photo of your guest names (from paper or another phone). AI will read the names for you.
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
                    <div className="relative group">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="custom-select w-full h-12 pr-10 appearance-none text-[10px] uppercase font-black tracking-widest"
                      >
                        {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-natural-olive pointer-events-none group-hover:translate-y-[-40%] transition-transform" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">Status</label>
                    <div className="relative group">
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as InvitationStatus)}
                        className="custom-select w-full h-12 pr-10 appearance-none text-[10px] uppercase font-black tracking-widest"
                      >
                        {Object.values(InvitationStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-natural-olive pointer-events-none group-hover:translate-y-[-40%] transition-transform" />
                    </div>
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
            className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-natural-border/60 shadow-xl shadow-natural-olive/5 space-y-10 mx-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3 relative">
                <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted ml-1">Guest Name</label>
                <input
                  type="text"
                  required
                  placeholder="Full Name (e.g. Rahul Sharma)"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (e.target.value === '') setIsWarningDismissed(false);
                  }}
                  className="input-natural"
                />
                <AnimatePresence>
                  {similarGuests.length > 0 && !isWarningDismissed && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute z-30 left-0 right-0 top-full mt-3 bg-white border border-natural-olive/20 shadow-2xl rounded-2xl p-5 space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 text-natural-olive">
                          <AlertCircle className="w-4 h-4" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">Similarity Check</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setIsWarningDismissed(true)}
                          className="p-1.5 hover:bg-natural-sidebar rounded-full transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-natural-muted" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {similarGuests.map(g => (
                          <div key={g.id} className="flex items-center justify-between bg-natural-sidebar/40 p-3 rounded-xl border border-natural-border/20">
                            <div className="min-w-0">
                              <p className="font-serif font-bold text-natural-ink truncate">{g.name}</p>
                              <p className="text-[9px] text-natural-muted uppercase font-bold tracking-tighter opacity-60">{g.category}</p>
                            </div>
                            <span className="text-[8px] bg-white border border-natural-border px-2 py-0.5 rounded-full uppercase font-bold text-natural-muted shadow-sm">In List</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[9px] text-natural-muted italic leading-relaxed">If these are different guests, you can safely continue adding them.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted ml-1">Contact Info</label>
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-natural"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted ml-1">Category</label>
                  {(name || notes) && (
                    <button
                      type="button"
                      onClick={handleSuggestCategory}
                      disabled={isSuggesting}
                      className="text-[9px] font-bold uppercase tracking-widest text-natural-olive flex items-center gap-1.5 hover:opacity-80 transition-opacity disabled:opacity-50"
                    >
                      {isSuggesting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      AI Suggest Group
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setAiSuggestion(null);
                    }}
                    className="custom-select w-full h-14 pr-10 appearance-none text-[10px] uppercase font-black tracking-widest"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-olive pointer-events-none group-hover:translate-y-[-40%] transition-transform" />
                  
                  <AnimatePresence>
                    {aiSuggestion && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute z-40 left-0 right-0 top-full mt-4 bg-white border border-natural-olive/20 shadow-2xl rounded-[1.5rem] p-6 space-y-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="w-4 h-4 text-natural-olive" />
                              <p className="text-[10px] font-bold text-natural-olive uppercase tracking-[0.2em]">Match Found</p>
                            </div>
                            <h4 className="text-xl font-serif font-bold text-natural-ink">{aiSuggestion.category}</h4>
                            <p className="text-xs text-natural-muted mt-2 leading-relaxed italic border-l-2 border-natural-olive/10 pl-4">
                              "{aiSuggestion.reasoning}"
                            </p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setAiSuggestion(null)}
                            className="p-2 hover:bg-natural-sidebar rounded-full transition-colors"
                          >
                            <X className="w-4 h-4 text-natural-muted" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={applyAiCategory}
                          className="w-full bg-natural-olive text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-natural-olive/20 hover:bg-natural-ink transition-all"
                        >
                          Keep Suggested Category
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted ml-1">Current Status</label>
                <div className="relative group">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as InvitationStatus)}
                    className="custom-select w-full h-14 pr-10 appearance-none text-[10px] uppercase font-black tracking-widest"
                  >
                    {Object.values(InvitationStatus).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-olive pointer-events-none group-hover:translate-y-[-40%] transition-transform" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted italic ml-1">Suggested By</label>
                <input
                  type="text"
                  placeholder="e.g. Groom's Parents"
                  value={suggestedBy}
                  onChange={(e) => setSuggestedBy(e.target.value)}
                  className="input-natural"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted italic ml-1">Point of Contact</label>
                <input
                  type="text"
                  placeholder="Who is calling this guest?"
                  value={primaryCaller}
                  onChange={(e) => setPrimaryCaller(e.target.value)}
                  className="input-natural"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted ml-1">Personal Notes</label>
              <textarea
                placeholder="Mention allergies, arrival dates, or special greetings..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-natural-sidebar/50 border border-natural-border/40 px-6 py-5 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-natural-olive/5 focus:bg-white focus:border-natural-olive transition-all h-32 resize-none leading-relaxed"
              />
            </div>

            {/* Message Preview Section */}
            <div className="bg-natural-sidebar/30 rounded-[2rem] border border-natural-border/30 overflow-hidden">
              <button 
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="w-full px-8 py-5 flex items-center justify-between group transition-colors hover:bg-natural-sidebar/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-natural-olive/10 flex items-center justify-center text-natural-olive transition-transform group-hover:scale-110">
                    {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-natural-olive">Check Invitation</p>
                    <p className="text-[8px] text-natural-muted font-medium mt-0.5">See what they will receive</p>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full border border-natural-border/40 flex items-center justify-center group-hover:border-natural-olive/40 transition-colors">
                  <Plus className={cn("w-3 h-3 transition-transform duration-300", showPreview ? "rotate-45" : "rotate-0")} />
                </div>
              </button>
              
              <AnimatePresence>
                {showPreview && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-8 pb-8 space-y-6"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <Send className="w-3 h-3 text-natural-olive opacity-40 shrink-0" />
                        <p className="text-[8px] uppercase font-bold text-natural-olive/60 tracking-widest">Standard Greeting</p>
                      </div>
                      <div className="bg-white p-6 rounded-2xl rounded-tl-none border border-natural-border/30 shadow-sm relative">
                        <div className="absolute top-2 right-4 text-[7px] font-bold uppercase text-natural-muted/30">Step One</div>
                        <p className="text-xs text-natural-ink/80 leading-relaxed font-serif italic">
                          {(settings.greetingMessage || '').replace('[Name]', name || 'Valued Guest')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1 text-emerald-600">
                        <CheckCircle2 className="w-3 h-3 opacity-40 shrink-0" />
                        <p className="text-[8px] uppercase font-bold tracking-widest text-emerald-600/60">Final Invitation</p>
                      </div>
                      <div className="bg-emerald-50/40 p-6 rounded-2xl rounded-tl-none border border-emerald-100/50 shadow-sm relative">
                        <div className="absolute top-2 right-4 text-[7px] font-bold uppercase text-emerald-600/20">Step Two</div>
                        <p className="text-xs text-emerald-900 leading-relaxed font-serif whitespace-pre-wrap">
                          {(settings.whatsappTemplate || '')
                            .replace('[Name]', name || 'Valued Guest')
                            .replace('[Date]', settings.weddingDate || 'TBD')
                            .replace('[Venue]', settings.venue || 'Venue Location')}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="submit"
              className="btn-primary w-full shadow-xl shadow-natural-olive/10"
            >
              Save Guest
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
                  {guest.phone && (
                    <div className="flex bg-natural-sidebar/50 rounded-lg border border-natural-border/30 overflow-hidden">
                      <a
                        href={getWhatsAppLink(guest, 'greeting') || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 text-[7px] font-bold uppercase tracking-widest text-natural-olive hover:bg-natural-olive hover:text-white transition-all border-r border-natural-border/20"
                      >
                        Greet
                      </a>
                      <a
                        href={getWhatsAppLink(guest, 'invitation') || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 text-[7px] font-bold uppercase tracking-widest text-natural-olive hover:bg-natural-olive hover:text-white transition-all"
                      >
                        Invite
                      </a>
                    </div>
                  )}
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
    </motion.div>
  );
}
