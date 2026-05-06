import React, { useState } from 'react';
import { useGuests } from '../context/GuestContext';
import { InvitationStatus, Guest, View } from '../types';
import { Search, Edit2, Trash2, X, Users, ChevronDown, Check, PlusCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function GuestList({ onViewChange }: { onViewChange: (view: View) => void }) {
  const { guests, categories, deleteGuest, updateGuest, bulkAddGuests, settings } = useGuests();
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

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4 border-b border-natural-border/50 pb-8">
        <div>
          <h2 className="text-3xl font-serif font-bold text-natural-ink">Guest List</h2>
          <p className="text-natural-muted text-[10px] uppercase tracking-[0.2em] font-medium mt-1">
            {filteredGuests.length} guests in your celebration circle
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowBulkAdd(true)}
            className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100 text-[10px] font-bold text-emerald-700 uppercase tracking-widest hover:bg-emerald-100 transition-colors h-11 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Bulk Import
          </button>
          
          {filteredGuests.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="px-4 py-2 bg-natural-sidebar/50 rounded-xl border border-natural-border/30 text-[10px] font-bold text-natural-olive uppercase tracking-widest hover:bg-natural-sidebar transition-colors h-11"
            >
              {selectedIds.length === filteredGuests.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
          <div className="relative group flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted transition-colors group-focus-within:text-natural-olive" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-natural-border px-10 py-2.5 rounded-xl text-xs outline-none focus:border-natural-olive transition-all h-11 shadow-sm"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-natural-muted hover:text-natural-olive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Quick Add Bar */}
      <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-natural-border/30 shadow-sm flex gap-3">
        <input 
          type="text"
          placeholder="Quick add: Name, Category (optional)"
          className="flex-1 bg-white border border-natural-border/50 px-4 py-2 rounded-xl text-xs outline-none focus:border-natural-olive transition-all h-10"
          onKeyDown={async (e) => {
            if (e.key === 'Enter') {
              const val = e.currentTarget.value.trim();
              if (!val) return;
              
              const parts = val.split(',').map(p => p.trim());
              const name = parts[0];
              const category = parts[1] || 'Uncategorized';
              
              await addGuest({
                name,
                category,
                status: InvitationStatus.NOT_INVITED,
                phone: '',
                notes: 'Quick added'
              });
              
              e.currentTarget.value = '';
            }
          }}
        />
        <div className="text-[9px] text-natural-muted flex items-center px-2 italic">
          Press Enter to add
        </div>
      </div>

      {/* Enhanced Filter Bar */}
      <div className="bg-white/50 backdrop-blur-sm p-6 rounded-[2rem] border border-natural-border/30 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-natural-olive flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-natural-olive" />
            Quick Filters
          </p>
          {(searchTerm || filterCategory !== 'All' || filterStatus !== 'All' || startDate || endDate) && (
            <button 
              onClick={clearFilters}
              className="text-[9px] uppercase tracking-widest font-bold text-rose-500 hover:text-rose-600 transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-widest font-bold text-natural-muted ml-1">Category</label>
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-white border border-natural-border px-4 py-2.5 rounded-xl text-[10px] font-bold text-natural-ink uppercase tracking-widest outline-none cursor-pointer hover:border-natural-olive transition-colors h-11"
            >
              <option value="All">All Categories</option>
              {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-widest font-bold text-natural-muted ml-1">Invitation Status</label>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-white border border-natural-border px-4 py-2.5 rounded-xl text-[10px] font-bold text-natural-ink uppercase tracking-widest outline-none cursor-pointer hover:border-natural-olive transition-colors h-11"
            >
              <option value="All">All Statuses</option>
              {Object.values(InvitationStatus).map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-widest font-bold text-natural-muted ml-1">Added From</label>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-natural-border px-4 py-2.5 rounded-xl text-[10px] font-bold text-natural-ink uppercase tracking-widest outline-none cursor-pointer hover:border-natural-olive transition-colors h-11"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-widest font-bold text-natural-muted ml-1">Added To</label>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-natural-border px-4 py-2.5 rounded-xl text-[10px] font-bold text-natural-ink uppercase tracking-widest outline-none cursor-pointer hover:border-natural-olive transition-colors h-11"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-2">
          <button
            onClick={() => setFilterHasPhone(!filterHasPhone)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border",
              filterHasPhone 
                ? "bg-natural-olive text-white border-natural-olive shadow-md" 
                : "bg-white text-natural-muted border-natural-border/30 hover:border-natural-olive"
            )}
          >
            <Check className={cn("w-3 h-3 transition-all", filterHasPhone ? "scale-100" : "scale-0 w-0")} />
            Has Phone Number
          </button>

          <button
            onClick={() => setFilterHasNotes(!filterHasNotes)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border",
              filterHasNotes 
                ? "bg-natural-olive text-white border-natural-olive shadow-md" 
                : "bg-white text-natural-muted border-natural-border/30 hover:border-natural-olive"
            )}
          >
            <Check className={cn("w-3 h-3 transition-all", filterHasNotes ? "scale-100" : "scale-0 w-0")} />
            Has Notes
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
            <Users className="w-8 h-8 opacity-20" />
          </div>
          <div className="max-w-xs space-y-2">
            <p className="font-serif italic text-xl text-natural-ink">
              {searchTerm || filterCategory !== 'All' || filterStatus !== 'All' 
                ? 'Hmm, no one matches those criteria.' 
                : 'Your guest list is currently empty.'}
            </p>
            <p className="text-[10px] uppercase tracking-widest leading-relaxed">
              {searchTerm || filterCategory !== 'All' || filterStatus !== 'All'
                ? 'Try adjusting your filters or search terms.'
                : 'Start by adding your first guest to begin your journey.'}
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
        <div className="space-y-3 relative">
          <AnimatePresence mode="popLayout">
            {filteredGuests.map((guest) => (
              <motion.div
                layout
                key={guest.id}
                className="group"
              >
                <div className={cn(
                  "p-4 rounded-xl border transition-all flex items-center gap-4 bg-white",
                  selectedIds.includes(guest.id) ? "border-natural-olive ring-1 ring-natural-olive/20" : "border-natural-border/30 hover:border-natural-olive/20"
                )}>
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-natural-border text-natural-olive focus:ring-0 cursor-pointer flex-shrink-0"
                    checked={selectedIds.includes(guest.id)}
                    onChange={() => toggleSelection(guest.id)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h4 className="text-sm font-serif font-bold text-natural-ink truncate">{guest.name}</h4>
                      <div className={cn("px-1.5 py-0.5 rounded text-[7px] uppercase font-bold tracking-tight whitespace-nowrap", statusColors[guest.status])}>
                        {guest.status}
                      </div>
                    </div>
                    <p className="text-[9px] uppercase tracking-wider text-natural-muted font-medium">{guest.category}</p>
                  </div>

                  <div className="hidden md:block text-[11px] text-natural-muted font-light truncate max-w-[150px]">
                    {guest.phone || (guest.notes && `"${guest.notes.substring(0, 20)}..."`)}
                  </div>

                    <div className="flex items-center gap-1">
                      {guest.phone && !deleteId && (
                          <div className="flex bg-natural-sidebar/50 rounded-lg border border-natural-border/30 overflow-hidden shadow-sm">
                            <a
                              href={getWhatsAppLink(guest, 'greeting') || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest text-natural-olive hover:bg-natural-olive hover:text-white transition-all border-r border-natural-border/20 flex flex-col items-center justify-center min-w-[50px] leading-none"
                              title="Send Greeting first"
                            >
                              <span className="opacity-60 mb-0.5">1.</span>
                              Greet
                            </a>
                            <a
                              href={getWhatsAppLink(guest, 'invitation') || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                if (guest.status === InvitationStatus.NOT_INVITED) {
                                  updateGuest(guest.id, { status: InvitationStatus.INVITED });
                                }
                              }}
                              className="px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest text-natural-olive hover:bg-natural-olive hover:text-white transition-all flex flex-col items-center justify-center min-w-[50px] leading-none"
                              title="Send Invitation"
                            >
                              <span className="opacity-60 mb-0.5">2.</span>
                              Invite
                            </a>
                          </div>
                      )}
                    </div>

                      {deleteId === guest.id ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-1">
                          <button 
                            onClick={() => {
                              deleteGuest(guest.id);
                              setDeleteId(null);
                            }}
                            className="bg-rose-500 text-white px-2.5 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest"
                          >
                            Confirm
                          </button>
                          <button 
                            onClick={() => setDeleteId(null)}
                            className="p-1.5 text-natural-muted hover:bg-natural-sidebar rounded-lg"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setDeleteId(null);
                              setEditingGuest(guest);
                            }}
                            className="p-1.5 text-natural-muted hover:text-natural-olive transition-colors sm:block hidden"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <div className="relative group/more sm:hidden">
                             <button className="p-1.5 text-natural-muted uppercase text-[9px] font-bold tracking-widest">More</button>
                             <div className="absolute right-0 bottom-full mb-2 bg-white border border-natural-border rounded-lg shadow-xl hidden group-hover/more:block p-1 min-w-[100px] z-10">
                                <button onClick={() => setEditingGuest(guest)} className="w-full text-left p-2 text-natural-muted hover:text-natural-olive flex items-center gap-2 text-[10px] uppercase font-bold"><Edit2 className="w-3 h-3" /> Edit</button>
                                <button onClick={() => setDeleteId(guest.id)} className="w-full text-left p-2 text-rose-500 hover:bg-rose-50 flex items-center gap-2 text-[10px] uppercase font-bold"><Trash2 className="w-3 h-3" /> Delete</button>
                             </div>
                          </div>
      
                          <button
                            onClick={() => setDeleteId(guest.id)}
                            className="p-1.5 text-natural-muted hover:text-rose-500 transition-colors hidden sm:block"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
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

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setShowBulkAdd(false)}
                    className="flex-1 px-6 py-4 border border-natural-border rounded-xl text-[10px] font-bold uppercase tracking-widest text-natural-muted hover:bg-natural-sidebar transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={processBulkAdd}
                    disabled={!bulkText.trim()}
                    className="flex-[2] bg-natural-olive text-white px-6 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-natural-ink transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Import {bulkText.split('\n').filter(n => n.trim()).length} Guests
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

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-[80] w-[calc(100%-2rem)] max-w-2xl"
          >
            <div className="bg-natural-ink text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10 backdrop-blur-lg">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedIds([])}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div>
                  <p className="text-xs font-bold">{selectedIds.length} Selected</p>
                  <p className="text-[9px] text-white/50 uppercase tracking-widest leading-none mt-0.5">Bulk Actions</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button 
                    onClick={() => setShowBulkMenu(!showBulkMenu)}
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
                  >
                    Update Status
                    <ChevronDown className={cn("w-3 h-3 transition-transform", showBulkMenu && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {showBulkMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: -10 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-2xl border border-natural-border overflow-hidden p-1"
                      >
                        {Object.values(InvitationStatus).map((status) => (
                          <button
                            key={status}
                            onClick={() => handleBulkStatusUpdate(status)}
                            className="w-full text-left px-3 py-2 text-[10px] uppercase tracking-widest font-bold text-natural-ink hover:bg-natural-sidebar rounded-lg transition-colors flex items-center justify-between group"
                          >
                            {status}
                            <Check className="w-3 h-3 opacity-0 group-hover:opacity-100 text-natural-olive" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button 
                  onClick={handleBulkDelete}
                  className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                  title="Delete Selected"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Edit Modal */}
      <AnimatePresence>
        {editingGuest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-natural-ink/80 backdrop-blur-md" 
              onClick={() => setEditingGuest(null)} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white/90 backdrop-blur-2xl w-full max-w-lg rounded-[3rem] p-10 relative shadow-[0_20px_100px_rgba(0,0,0,0.3)] border border-white/20"
            >
              <button 
                onClick={() => setEditingGuest(null)} 
                className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center bg-natural-sidebar rounded-2xl text-natural-muted hover:text-natural-ink hover:bg-natural-border transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-10">
                 <div className="w-16 h-16 bg-natural-olive/10 text-natural-olive rounded-2xl flex items-center justify-center mb-6">
                    <Edit2 className="w-8 h-8" />
                 </div>
                 <h3 className="text-3xl font-serif font-bold text-natural-olive">Edit Guest Profile</h3>
                 <p className="text-natural-muted text-sm mt-1 uppercase tracking-widest font-bold">Keeping your list perfect</p>
              </div>
              
              <form className="space-y-6" onSubmit={(e) => {
                e.preventDefault();
                setEditingGuest(null);
              }}>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-natural-muted tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={editingGuest.name} 
                    onChange={(e) => setEditingGuest({...editingGuest, name: e.target.value})}
                    className="input-natural"
                    onBlur={() => updateGuest(editingGuest.id, { name: editingGuest.name })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-natural-muted tracking-widest ml-1">Category</label>
                    <select 
                       value={editingGuest.category} 
                       onChange={(e) => {
                         const cat = e.target.value;
                         setEditingGuest({...editingGuest, category: cat});
                         updateGuest(editingGuest.id, { category: cat });
                       }}
                       className="input-natural appearance-none cursor-pointer"
                    >
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-natural-muted tracking-widest ml-1">Invitation Status</label>
                    <select 
                       value={editingGuest.status} 
                       onChange={(e) => {
                         const status = e.target.value as InvitationStatus;
                         setEditingGuest({...editingGuest, status});
                         updateGuest(editingGuest.id, { status });
                       }}
                       className="input-natural appearance-none cursor-pointer"
                    >
                      {Object.values(InvitationStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-natural-muted tracking-widest ml-1">Phone / WhatsApp</label>
                  <input 
                    type="text" 
                    value={editingGuest.phone || ''} 
                    onChange={(e) => setEditingGuest({...editingGuest, phone: e.target.value})}
                    className="input-natural"
                    onBlur={() => updateGuest(editingGuest.id, { phone: editingGuest.phone })}
                    placeholder="Include country code, e.g. 971..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-natural-muted tracking-widest ml-1">Personal Notes</label>
                  <textarea 
                    value={editingGuest.notes || ''} 
                    onChange={(e) => setEditingGuest({...editingGuest, notes: e.target.value})}
                    className="input-natural h-32 resize-none py-5"
                    onBlur={() => updateGuest(editingGuest.id, { notes: editingGuest.notes })}
                    placeholder="Dietary requirements, address, or special role..."
                  />
                </div>

                <button 
                  type="button"
                  onClick={() => setEditingGuest(null)}
                  className="btn-primary w-full mt-6 py-5 shadow-[0_10px_30px_rgba(90,90,64,0.3)]"
                >
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
