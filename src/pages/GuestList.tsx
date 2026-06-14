import React, { useState } from 'react';
import { useGuests } from '../context/GuestContext';
import { InvitationStatus, Guest, View } from '../types';
import { Search, Edit2, Trash2, X, Users, ChevronDown, Check, PlusCircle, Sparkles, Wand2, RefreshCw, UserPlus } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import { ConnectionStatus } from '../components/ConnectionStatus';
import { AIInvitationAssistant } from '../components/AIInvitationAssistant';
import { suggestCategories } from '../services/aiService';
import { suggestGuestCategory } from '../services/geminiService';

export function GuestList({ onViewChange }: { onViewChange: (view: View) => void }) {
  const { guests, categories, deleteGuest, updateGuest, bulkAddGuests, settings, addGuest } = useGuests();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterHasPhone, setFilterHasPhone] = useState(false);
  const [filterHasNotes, setFilterHasNotes] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkCategory, setBulkCategory] = useState('Uncategorized');
  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ category: string, reasoning: string } | null>(null);
  const [aiGuest, setAiGuest] = useState<Guest | null>(null);

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (guest.phone && guest.phone.includes(searchTerm));
    const matchesCategory = filterCategory === 'All' || guest.category === filterCategory;
    const matchesStatus = filterStatus === 'All' || guest.status === filterStatus;
    
    const matchesPhone = !filterHasPhone || (guest.phone && guest.phone.trim().length > 0);
    const matchesNotes = !filterHasNotes || (guest.notes && guest.notes.trim().length > 0);

    let matchesDate = true;
    if (startDate) {
      const start = new Date(startDate).getTime();
      matchesDate = matchesDate && guest.createdAt >= start;
    }
    if (endDate) {
      // Set end date to the end of the day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && guest.createdAt <= end.getTime();
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesDate && matchesPhone && matchesNotes;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('All');
    setFilterStatus('All');
    setFilterHasPhone(false);
    setFilterHasNotes(false);
    setStartDate('');
    setEndDate('');
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredGuests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredGuests.map(g => g.id));
    }
  };

  const handleBulkStatusUpdate = (status: InvitationStatus) => {
    selectedIds.forEach(id => {
      updateGuest(id, { status });
    });
    setSelectedIds([]);
    setShowBulkMenu(false);
  };

  const handleBulkDelete = () => {
    selectedIds.forEach(id => deleteGuest(id));
    setSelectedIds([]);
  };

  const processBulkAdd = async () => {
    const names = bulkText.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    if (names.length === 0) return;

    const guestsToAdd = names.map(name => ({
      name,
      category: bulkCategory,
      status: InvitationStatus.NOT_INVITED,
      phone: '',
      notes: 'Added via bulk import'
    }));

    await bulkAddGuests(guestsToAdd);
    setBulkText('');
    setShowBulkAdd(false);
  };

  const autoCategorize = async () => {
    const names = bulkText.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    if (names.length === 0) return;
    
    setIsAutoCategorizing(true);
    try {
      const categoryNames = categories.map(c => c.name);
      const suggestions = await suggestCategories(names, categoryNames);
      // For simplicity, we'll just show the user and they can confirm, 
      // but here we will actually transform the bulk text into a more structured list 
      // if we wanted to. To keep it consistent with the UI, we'll just 
      // pre-group them or notify user.
      // Better yet: Automatically create the guests with the suggested categories.
      
      const guestsToAdd = suggestions.map((s: { name: string; category: string }) => ({
        name: s.name,
        category: s.category,
        status: InvitationStatus.NOT_INVITED,
        phone: '',
        notes: 'AI auto-categorized'
      }));

      await bulkAddGuests(guestsToAdd);
      setBulkText('');
      setShowBulkAdd(false);
      alert(`Successfully imported ${guestsToAdd.length} guests with AI categorization!`);
    } catch (err) {
      alert("AI categorization failed. Please try manual import.");
    } finally {
      setIsAutoCategorizing(false);
    }
  };

  const getWhatsAppLink = (guest: Guest, type: 'greeting' | 'invitation') => {
    if (!guest.phone) return null;
    const date = settings.weddingDate || '';
    const venue = settings.venue || '';
    const template = type === 'greeting' ? settings.greetingMessage : settings.whatsappTemplate;
    
    if (!template) return null;

    const message = template
      .replace('[Name]', guest.name)
      .replace('[Date]', date)
      .replace('[Venue]', venue);
    
    const cleanPhone = guest.phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const statusColors = {
    [InvitationStatus.NOT_INVITED]: 'bg-slate-100 text-slate-500',
    [InvitationStatus.INVITED]: 'bg-purple-50 text-purple-700 border border-purple-100',
    [InvitationStatus.CONFIRMED]: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    [InvitationStatus.NOT_COMING]: 'bg-rose-50 text-rose-700 border border-rose-100',
  };

  const handleSuggestCategory = async () => {
    if (!editingGuest?.name.trim()) return;
    setIsSuggesting(true);
    try {
      const result = await suggestGuestCategory({
        guestName: editingGuest.name,
        notes: editingGuest.notes || '',
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
    if (aiSuggestion && editingGuest) {
      const updated = { ...editingGuest, category: aiSuggestion.category };
      setEditingGuest(updated);
      updateGuest(editingGuest.id, { category: aiSuggestion.category });
      setAiSuggestion(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-6 border-b border-natural-border/30 pb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-natural-ink italic">Our Guests</h2>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-natural-muted text-[10px] uppercase tracking-[0.4em] font-bold opacity-60">
              {filteredGuests.length} guests in list
            </p>
            {filteredGuests.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-natural-olive hover:text-natural-ink transition-colors flex items-center gap-2 px-3 py-1 bg-natural-sidebar/30 rounded-full border border-natural-border/20"
              >
                {selectedIds.length === filteredGuests.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <button
            onClick={() => setShowBulkAdd(true)}
            className="px-6 py-3 bg-white text-[10px] font-bold text-emerald-700 uppercase tracking-[0.2em] rounded-2xl border border-emerald-100/50 shadow-sm hover:shadow-xl hover:bg-emerald-50 transition-all h-14 flex items-center justify-center gap-3 group"
          >
            <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Bulk Import
          </button>
          
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-natural-muted transition-colors group-focus-within:text-natural-olive" />
            <input
              type="text"
              placeholder="Search by name or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-natural-border px-14 py-4 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-natural-olive/5 focus:border-natural-olive transition-all h-14 shadow-sm"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 p-1.5 text-natural-muted hover:text-rose-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Quick Add Bar */}
      <div className="relative group mx-auto max-w-3xl">
        <div className="absolute inset-x-0 bottom-0 h-px bg-natural-olive/30 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-700 origin-center" />
        <input 
          type="text"
          placeholder="✍️ Type a name here, then press Enter on your keyboard to add them! (Example: Aunt Sarah, Family)"
          className="w-full bg-natural-sidebar/30 border border-natural-border/40 px-8 py-5 rounded-[2rem] text-sm md:text-base font-serif outline-none focus:bg-white focus:shadow-2xl transition-all h-16 text-natural-ink"
          onKeyDown={async (e) => {
            if (e.key === 'Enter') {
              const val = e.currentTarget.value.trim();
              if (!val) return;
              const parts = val.split(',').map(p => p.trim());
              const name = parts[0];
              const category = parts[1] || 'General';
              await addGuest({ name, category, status: InvitationStatus.NOT_INVITED, phone: '', notes: 'Quick added' });
              e.currentTarget.value = '';
            }
          }}
        />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-widest text-natural-muted/60 bg-white px-3 py-1 rounded-full border border-natural-border/40 hidden sm:block">
          Press Enter 🚀
        </div>
      </div>

      {/* Enhanced Filter Bar */}
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[3rem] border border-natural-border/30 shadow-xl shadow-natural-olive/5 space-y-8">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-natural-olive/10 flex items-center justify-center">
              <ChevronDown className="w-4 h-4 text-natural-olive" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.3em] font-black text-natural-ink">
              🔍 Filter & Find Guests
            </p>
          </div>
          <AnimatePresence>
            {(searchTerm || filterCategory !== 'All' || filterStatus !== 'All' || startDate || endDate || filterHasPhone || filterHasNotes) && (
              <motion.button 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={clearFilters}
                className="text-[10px] uppercase tracking-widest font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-2"
              >
                Reset Filters
                <X className="w-3 h-3" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-natural-muted ml-2">Group / Circle 👥</label>
            <div className="relative group">
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="custom-select w-full h-14 appearance-none pr-12 uppercase font-black text-[10px] tracking-widest text-natural-ink italic"
              >
                <option value="All">All Groups</option>
                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-olive pointer-events-none transition-transform group-hover:translate-y-[-40%]" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-natural-muted ml-2">RSVP / Invitation Status 📨</label>
            <div className="relative group">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="custom-select w-full h-14 appearance-none pr-12 uppercase font-black text-[10px] tracking-widest text-natural-ink italic"
              >
                <option value="All">All Statuses</option>
                {Object.values(InvitationStatus).map(status => <option key={status} value={status}>{status}</option>)}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-olive pointer-events-none transition-transform group-hover:translate-y-[-40%]" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-natural-muted ml-2">Added after date 📅</label>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-natural-sidebar/40 border border-natural-border/40 px-6 py-4 rounded-2xl text-[10px] font-bold text-natural-ink uppercase tracking-widest outline-none cursor-pointer hover:border-natural-olive transition-all h-14"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-natural-muted ml-2">Added before date 📅</label>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-natural-sidebar/40 border border-natural-border/40 px-6 py-4 rounded-2xl text-[10px] font-bold text-natural-ink uppercase tracking-widest outline-none cursor-pointer hover:border-natural-olive transition-all h-14"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-2">
          <button
            onClick={() => setFilterHasPhone(!filterHasPhone)}
            className={cn(
              "flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border shadow-sm",
              filterHasPhone 
                ? "bg-natural-olive text-white border-natural-olive shadow-xl shadow-natural-olive/20" 
                : "bg-natural-sidebar/50 text-natural-muted border-natural-border/40 hover:border-natural-olive/40"
            )}
          >
            <div 
              className={cn(
                "custom-checkbox transition-all", 
                filterHasPhone ? "active" : "bg-white"
              )}
            >
              <Check className={cn("w-3 h-3 transition-transform", filterHasPhone ? "scale-100 text-white" : "scale-0")} />
            </div>
            Has Contact
          </button>

          <button
            onClick={() => setFilterHasNotes(!filterHasNotes)}
            className={cn(
              "flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border shadow-sm",
              filterHasNotes 
                ? "bg-natural-olive text-white border-natural-olive shadow-xl shadow-natural-olive/20" 
                : "bg-natural-sidebar/50 text-natural-muted border-natural-border/40 hover:border-natural-olive/40"
            )}
          >
            <div 
              className={cn(
                "custom-checkbox transition-all", 
                filterHasNotes ? "active" : "bg-white"
              )}
            >
              <Check className={cn("w-3 h-3 transition-transform", filterHasNotes ? "scale-100 text-white" : "scale-0")} />
            </div>
            Has Internal Notes
          </button>
        </div>
      </div>

      {filteredGuests.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-96 flex flex-col items-center justify-center text-natural-muted gap-6 bg-white rounded-[2rem] border-dashed border-2 border-natural-border m-4 p-8 text-center"
        >
          <div className="w-20 h-20 bg-natural-sidebar rounded-full flex items-center justify-center">
            <UserPlus className="w-8 h-8 opacity-20" />
          </div>
          <div className="max-w-xs space-y-2">
            <p className="font-serif italic text-xl text-natural-ink">
              {searchTerm || filterCategory !== 'All' || filterStatus !== 'All' 
                ? 'No one matches your search.' 
                : 'Your guest list is empty.'}
            </p>
            <p className="text-[10px] uppercase tracking-widest leading-relaxed">
              {searchTerm || filterCategory !== 'All' || filterStatus !== 'All'
                ? 'Try searching for someone else.'
                : 'Start by adding your first guest below.'}
            </p>
          </div>
          
          {!(searchTerm || filterCategory !== 'All' || filterStatus !== 'All') && (
            <button 
              onClick={() => onViewChange('add')}
              className="flex items-center gap-2 bg-natural-olive text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-natural-ink transition-colors shadow-lg"
            >
              <PlusCircle className="w-4 h-4" />
              Add First Guest
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            show: {
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
          className="space-y-3 relative"
        >
          <AnimatePresence mode="popLayout">
            {filteredGuests.map((guest, idx) => (
              <motion.div
                layout
                key={guest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="group relative"
              >
                <div className={cn(
                  "p-5 md:p-6 rounded-[2rem] border transition-all flex items-center gap-4 md:gap-8 bg-white shadow-sm hover:shadow-2xl hover:shadow-natural-olive/5 relative z-0 overflow-hidden",
                  selectedIds.includes(guest.id) ? "border-natural-olive ring-1 ring-natural-olive/10" : "border-natural-border/30"
                )}>
                  {/* Subtle Background Pattern */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-natural-olive/5 rounded-bl-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-700 pointer-events-none opacity-0 group-hover:opacity-100" />

                  {/* Select Checkbox (Bulk Manage) */}
                  <div className="flex items-center shrink-0 select-none">
                    <button
                      type="button"
                      onClick={() => toggleSelection(guest.id)}
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                        selectedIds.includes(guest.id)
                          ? "bg-natural-olive border-natural-olive text-white shadow-sm"
                          : "border-slate-200 bg-slate-50 hover:border-natural-olive text-transparent hover:bg-white"
                      )}
                      title="Select guest for bulk actions"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3.5px]" />
                    </button>
                  </div>

                  {/* Mark as Invited - Simple, satisfying Checkbox */}
                  <div className="flex items-center gap-2.5 shrink-0 select-none border-r border-slate-100 pr-4">
                    <button 
                      type="button"
                      onClick={() => {
                        const isCurrentlyInvited = guest.status === InvitationStatus.INVITED || guest.status === InvitationStatus.CONFIRMED;
                        const newStatus = isCurrentlyInvited ? InvitationStatus.NOT_INVITED : InvitationStatus.INVITED;
                        updateGuest(guest.id, { status: newStatus });
                      }}
                      className={cn(
                        "w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-200",
                        (guest.status === InvitationStatus.INVITED || guest.status === InvitationStatus.CONFIRMED)
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10 scale-105" 
                          : "border-slate-300 bg-slate-50 text-slate-400 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50/50"
                      )}
                      title={
                        guest.status === InvitationStatus.INVITED || guest.status === InvitationStatus.CONFIRMED 
                          ? "Uncheck to mark as Not Invited" 
                          : "Check to mark as Invited"
                      }
                    >
                      <Check className={cn(
                        "w-4 h-4 stroke-[4px] transition-transform duration-200",
                        (guest.status === InvitationStatus.INVITED || guest.status === InvitationStatus.CONFIRMED) 
                          ? "scale-105" 
                          : "scale-0"
                      )} />
                    </button>
                    <div className="text-left hidden md:block">
                      <p className={cn(
                        "text-[10px] uppercase font-black tracking-wider leading-none",
                        (guest.status === InvitationStatus.INVITED || guest.status === InvitationStatus.CONFIRMED)
                          ? "text-emerald-600"
                          : "text-slate-400"
                      )}>
                        {(guest.status === InvitationStatus.INVITED || guest.status === InvitationStatus.CONFIRMED) ? "Invited ✓" : "Not Invited"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <h4 className="text-lg md:text-xl font-serif font-bold text-natural-ink truncate italic">{guest.name}</h4>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[8px] uppercase font-black tracking-widest shadow-sm",
                        statusColors[guest.status]
                      )}>
                        {guest.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1.5 bg-natural-sidebar/50 px-3 py-1 rounded-full border border-natural-border/20">
                        <Users className="w-3 h-3 text-natural-olive/60" />
                        <p className="text-[9px] uppercase tracking-widest text-natural-muted font-bold">
                          {guest.category}
                        </p>
                      </div>
                      
                      {(guest.suggestedBy || guest.primaryCaller) && (
                        <div className="hidden sm:flex items-center gap-3 text-[8px] font-bold uppercase tracking-widest text-natural-olive/60 italic overflow-hidden">
                          {guest.suggestedBy && (
                            <span className="flex items-center gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-natural-olive/30" />
                              By {guest.suggestedBy}
                            </span>
                          )}
                          {guest.primaryCaller && (
                            <span className="flex items-center gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-natural-olive/30" />
                              {guest.primaryCaller} to Call
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 relative z-10">
                    <div className="hidden lg:flex items-center gap-4 border-l border-natural-border/20 pl-8">
                      {guest.phone ? (
                        <div className="flex items-center gap-3">
                          <div className="flex bg-natural-sidebar rounded-2xl p-1 shadow-inner">
                            <a
                              href={getWhatsAppLink(guest, 'greeting') || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-natural-olive hover:bg-white hover:shadow-sm rounded-xl transition-all"
                            >
                              Greet
                            </a>
                            <a
                              href={getWhatsAppLink(guest, 'invitation') || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-natural-olive hover:bg-white hover:shadow-sm rounded-xl transition-all"
                            >
                              Invite
                            </a>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setAiGuest(guest)}
                            className="w-10 h-10 bg-natural-olive text-white rounded-2xl flex items-center justify-center shadow-lg shadow-natural-olive/20 hover:bg-natural-ink transition-all"
                          >
                            <Sparkles className="w-4 h-4" />
                          </motion.button>
                        </div>
                      ) : (
                        <p className="text-[8px] uppercase tracking-widest font-black text-natural-muted px-4 opacity-30 italic">No contact info</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleSelection(guest.id)}
                        className={cn(
                          "w-10 h-10 flex items-center justify-center rounded-2xl border transition-all",
                          selectedIds.includes(guest.id) 
                            ? "bg-slate-800 border-slate-800 text-white shadow-md scale-105" 
                            : "border-slate-200 text-slate-300 hover:border-slate-400 hover:bg-slate-50"
                        )}
                        title={selectedIds.includes(guest.id) ? "Deselect guest" : "Select guest for bulk actions"}
                      >
                        <Check className={cn("w-4 h-4 transition-transform duration-200 stroke-[3px]", selectedIds.includes(guest.id) ? "scale-100" : "scale-0")} />
                      </button>
                      <button
                        onClick={() => setEditingGuest(guest)}
                        className="w-10 h-10 flex items-center justify-center text-natural-muted hover:text-natural-olive hover:bg-natural-sidebar rounded-2xl transition-all"
                        title="Edit guest details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(guest.id)}
                        className="w-10 h-10 flex items-center justify-center text-natural-muted hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                        title="Delete guest"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {deleteId === guest.id && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="absolute inset-0 z-20 bg-rose-50/95 backdrop-blur-sm rounded-[2rem] flex items-center justify-center gap-6 border-2 border-rose-100"
                    >
                      <p className="text-xs font-bold uppercase tracking-widest text-rose-600">Permanently remove {guest.name}?</p>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => {
                            deleteGuest(guest.id);
                            setDeleteId(null);
                          }}
                          className="bg-rose-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-rose-500/20 hover:bg-rose-700 transition-colors"
                        >
                          Delete
                        </button>
                        <button 
                          onClick={() => setDeleteId(null)}
                          className="bg-white border border-rose-200 text-rose-600 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em]"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Bulk Add Modal */}
      <AnimatePresence>
        {showBulkAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-natural-ink/80 backdrop-blur-md" 
              onClick={() => setShowBulkAdd(false)} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 relative shadow-2xl border border-natural-border/30"
            >
              <button 
                onClick={() => setShowBulkAdd(false)} 
                className="absolute top-6 right-6 p-2 text-natural-muted hover:text-natural-ink transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-6">
                 <h3 className="text-2xl font-serif font-bold text-natural-ink">Bulk Guest Import</h3>
                 <p className="text-natural-muted text-[10px] uppercase tracking-widest font-bold mt-1">Add multiple names at once</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-natural-muted tracking-widest ml-1">Paste Names (One per line)</label>
                  <textarea 
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder="John Doe&#10;Jane Smith&#10;Michael Brown..."
                    className="w-full bg-natural-sidebar/30 border border-natural-border/50 px-4 py-4 rounded-2xl text-xs outline-none focus:border-natural-olive transition-all h-64 resize-none leading-relaxed font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-natural-muted tracking-widest ml-1">Assign to Category</label>
                  <select 
                    value={bulkCategory}
                    onChange={(e) => setBulkCategory(e.target.value)}
                    className="w-full bg-natural-sidebar/30 border border-natural-border/50 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest outline-none cursor-pointer hover:border-natural-olive transition-all h-12"
                  >
                    <option value="Uncategorized">Select Category...</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowBulkAdd(false)}
                      className="flex-1 px-6 py-4 border border-natural-border rounded-xl text-[10px] font-bold uppercase tracking-widest text-natural-muted hover:bg-natural-sidebar transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={processBulkAdd}
                      disabled={!bulkText.trim() || isAutoCategorizing}
                      className="flex-[2] bg-natural-sidebar/50 border border-natural-border/30 text-natural-ink px-6 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-natural-sidebar transition-all disabled:opacity-50"
                    >
                      Basic Import
                    </button>
                  </div>
                  <button 
                    onClick={autoCategorize}
                    disabled={!bulkText.trim() || isAutoCategorizing}
                    className="w-full bg-natural-olive text-white px-6 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-natural-ink transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isAutoCategorizing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        AI is analyzing names...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Smart Categorize & Import with AI
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-800 leading-relaxed italic">
                  <strong>Tip:</strong> This feature works fully offline! Your names will be saved to your device and synced as soon as you have internet.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Assistant Modal */}
      <AnimatePresence>
        {aiGuest && (
          <AIInvitationAssistant 
            guest={aiGuest}
            settings={settings}
            onClose={() => setAiGuest(null)}
            onUseMessage={(msg) => {
              // The assistant handles copying, just close if needed
              setAiGuest(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 sm:bottom-12 left-1/2 -translate-x-1/2 z-[80] w-[calc(100%-4rem)] max-w-3xl"
          >
            <div className="bg-natural-ink/95 backdrop-blur-2xl text-white p-6 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(30,48,34,0.5)] flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10 ring-1 ring-white/5">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setSelectedIds([])}
                  className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl transition-all group"
                >
                  <X className="w-5 h-5 group-hover:scale-110" />
                </button>
                <div>
                  <p className="text-2xl font-serif italic text-emerald-400 leading-none">{selectedIds.length} <span className="text-white">Selected</span></p>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-black mt-2">Manage multiple guests</p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative group flex-1 md:flex-initial">
                  <button 
                    onClick={() => setShowBulkMenu(!showBulkMenu)}
                    className="w-full md:w-auto bg-white/10 hover:bg-white/20 px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-4 transition-all h-14 border border-white/5"
                  >
                    Change Status
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-500", showBulkMenu && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {showBulkMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: -10, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full right-0 mb-4 w-64 bg-white rounded-[2rem] shadow-2xl border border-natural-border overflow-hidden p-3"
                      >
                        <p className="text-[9px] uppercase tracking-widest font-black text-natural-muted px-4 py-3 opacity-40">Choose New Status</p>
                        {Object.values(InvitationStatus).map((status) => (
                          <button
                            key={status}
                            onClick={() => handleBulkStatusUpdate(status)}
                            className="w-full text-left px-4 py-3.5 text-[11px] uppercase tracking-widest font-bold text-natural-ink hover:bg-natural-sidebar rounded-xl transition-all flex items-center justify-between group"
                          >
                            {status}
                            <div className="w-2 h-2 rounded-full bg-natural-olive opacity-0 group-hover:opacity-100 transition-all" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button 
                  onClick={handleBulkDelete}
                  className="w-14 h-14 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-2xl transition-all border border-rose-500/20 group"
                  title="Delete Selected"
                >
                  <Trash2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Edit Modal */}
      <AnimatePresence>
        {editingGuest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 shrink-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-natural-ink/90 backdrop-blur-sm" 
              onClick={() => setEditingGuest(null)} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] p-8 md:p-12 relative shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-y-auto max-h-[90vh]"
            >
              <button 
                onClick={() => setEditingGuest(null)} 
                className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-natural-sidebar hover:bg-natural-border rounded-full text-natural-muted hover:text-natural-ink transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-12 relative">
                <div className="w-20 h-20 bg-natural-olive/10 text-natural-olive rounded-[2rem] flex items-center justify-center mb-8">
                  <UserPlus className="w-10 h-10" />
                </div>
                <h3 className="text-4xl font-serif font-black text-natural-olive italic">Guest Info</h3>
                <p className="text-natural-muted text-[10px] mt-2 uppercase tracking-[0.4em] font-black opacity-60">Update guest details</p>
                
                <div className="absolute top-0 right-0 hidden sm:block">
                  <div className="text-[10px] font-black text-natural-muted/20 uppercase tracking-[0.5em] rotate-90 origin-right translate-y-12 translate-x-4 select-none">
                    Wedding Planner
                  </div>
                </div>
              </div>
              
              <form className="space-y-10" onSubmit={(e) => {
                e.preventDefault();
                setEditingGuest(null);
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-black text-natural-muted tracking-[0.3em] ml-2">Guest Identity</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={editingGuest.name} 
                        onChange={(e) => setEditingGuest({...editingGuest, name: e.target.value})}
                        className="w-full bg-natural-sidebar/30 border border-natural-border/30 px-6 py-4 rounded-2xl text-base font-serif italic outline-none focus:bg-white focus:border-natural-olive transition-all h-14"
                        onBlur={() => updateGuest(editingGuest.id, { name: editingGuest.name })}
                        placeholder="e.g. Johnathan Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end mb-1 px-2">
                      <label className="text-[10px] uppercase font-black text-natural-muted tracking-[0.3em]">Circle / Category</label>
                      <button
                        type="button"
                        onClick={handleSuggestCategory}
                        disabled={isSuggesting}
                        className="text-[10px] font-black uppercase tracking-widest text-natural-olive flex items-center gap-2 hover:opacity-70 transition-opacity disabled:opacity-50"
                      >
                        {isSuggesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        AI Hint
                      </button>
                    </div>
                    <div className="relative">
                      <select 
                         value={editingGuest.category} 
                         onChange={(e) => {
                           const cat = e.target.value;
                           setEditingGuest({...editingGuest, category: cat});
                           updateGuest(editingGuest.id, { category: cat });
                           setAiSuggestion(null);
                         }}
                         className="w-full bg-natural-sidebar/30 border border-natural-border/30 px-6 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest outline-none cursor-pointer hover:border-natural-olive transition-all h-14 appearance-none"
                      >
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted pointer-events-none" />
                      
                      <AnimatePresence>
                        {aiSuggestion && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute z-20 left-0 right-0 top-full mt-4 bg-white border border-natural-olive/20 shadow-2xl rounded-[2.5rem] p-8 space-y-6"
                          >
                            <div className="flex items-start justify-between gap-6">
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4" />
                                  </div>
                                  <p className="text-[11px] font-black text-natural-ink uppercase tracking-[0.2em]">Our AI Suggests</p>
                                </div>
                                <div>
                                  <h4 className="text-2xl font-serif font-black text-natural-ink italic">{aiSuggestion.category}</h4>
                                  <p className="text-xs text-natural-muted mt-3 leading-relaxed font-medium italic opacity-70">
                                    "{aiSuggestion.reasoning}"
                                  </p>
                                </div>
                              </div>
                              <button 
                                type="button"
                                onClick={() => setAiSuggestion(null)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-natural-sidebar rounded-full transition-colors"
                              >
                                <X className="w-4 h-4 text-natural-muted" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={applyAiCategory}
                              className="w-full bg-natural-olive text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-natural-ink transition-all shadow-xl shadow-natural-olive/20"
                            >
                              Adopt this suggestion
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-black text-natural-muted tracking-[0.3em] ml-2">Contact Link</label>
                    <input 
                      type="text" 
                      value={editingGuest.phone || ''} 
                      onChange={(e) => setEditingGuest({...editingGuest, phone: e.target.value})}
                      className="w-full bg-natural-sidebar/30 border border-natural-border/30 px-6 py-4 rounded-2xl text-sm font-bold tracking-widest outline-none focus:bg-white focus:border-natural-olive transition-all h-14"
                      onBlur={() => updateGuest(editingGuest.id, { phone: editingGuest.phone })}
                      placeholder="WhatsApp / Phone number"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-black text-natural-muted tracking-[0.3em] ml-2">RSVP / Status</label>
                    <div className="relative">
                      <select 
                         value={editingGuest.status} 
                         onChange={(e) => {
                           const status = e.target.value as InvitationStatus;
                           setEditingGuest({...editingGuest, status});
                           updateGuest(editingGuest.id, { status });
                         }}
                         className="w-full bg-natural-sidebar/30 border border-natural-border/30 px-6 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest outline-none cursor-pointer hover:border-natural-olive transition-all h-14 appearance-none"
                      >
                        {Object.values(InvitationStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-black text-natural-muted tracking-[0.3em] ml-2">Private Memoirs / Notes</label>
                  <textarea 
                    value={editingGuest.notes || ''} 
                    onChange={(e) => setEditingGuest({...editingGuest, notes: e.target.value})}
                    className="w-full bg-natural-sidebar/30 border border-natural-border/30 px-6 py-6 rounded-3xl text-sm font-medium leading-relaxed outline-none focus:bg-white focus:border-natural-olive transition-all h-40 resize-none italic"
                    onBlur={() => updateGuest(editingGuest.id, { notes: editingGuest.notes })}
                    placeholder="Dietary details, special mentions, or role in the celebration..."
                  />
                </div>

                <div className="pt-6">
                  <button 
                    type="button"
                    onClick={() => setEditingGuest(null)}
                    className="w-full bg-natural-ink text-white py-6 rounded-[2rem] text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-natural-olive transition-all transform hover:-translate-y-1"
                  >
                    Soulfully Saved
                  </button>
                  <p className="text-center text-[9px] uppercase tracking-widest font-bold text-natural-muted mt-6 opacity-40">
                    Changes take effect immediately across all devices
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
