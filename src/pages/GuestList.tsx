import React, { useState } from 'react';
import { useGuests } from '../context/GuestContext';
import { InvitationStatus, Guest } from '../types';
import { Search, Edit2, Trash2, X, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function GuestList() {
  const { guests, categories, deleteGuest, updateGuest, settings } = useGuests();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (guest.phone && guest.phone.includes(searchTerm));
    const matchesCategory = filterCategory === 'All' || guest.category === filterCategory;
    const matchesStatus = filterStatus === 'All' || guest.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getWhatsAppLink = (guest: Guest) => {
    if (!guest.phone) return null;
    const date = settings.weddingDate;
    const venue = settings.venue;
    const message = settings.whatsappTemplate
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
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted transition-colors group-focus-within:text-natural-olive" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-natural-border px-10 py-2.5 rounded-xl text-xs outline-none focus:border-natural-olive transition-all"
            />
          </div>
          
          <div className="flex gap-2">
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-white border border-natural-border px-4 py-2.5 rounded-xl text-[10px] font-bold text-natural-olive uppercase tracking-widest outline-none cursor-pointer min-w-[140px]"
            >
              <option value="All">All Categories</option>
              {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
            </select>

            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-natural-border px-4 py-2.5 rounded-xl text-[10px] font-bold text-natural-muted uppercase tracking-widest outline-none cursor-pointer min-w-[140px]"
            >
              <option value="All">All Statuses</option>
              {Object.values(InvitationStatus).map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        </div>
      </header>

      {filteredGuests.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-96 flex flex-col items-center justify-center text-natural-muted gap-6 glass-card border-dashed border-2 m-4"
        >
          <div className="w-20 h-20 bg-natural-sidebar rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 opacity-20" />
          </div>
          <p className="font-serif italic text-xl">
            {searchTerm || filterCategory !== 'All' || filterStatus !== 'All' 
              ? 'Hmm, no one matches those criteria.' 
              : 'The list is empty. Time to start inviting!'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredGuests.map((guest) => (
              <motion.div
                layout
                key={guest.id}
                className="group"
              >
                <div className="bg-white p-4 rounded-xl border border-natural-border/30 hover:border-natural-olive/20 transition-all flex items-center gap-4">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-natural-border text-natural-olive focus:ring-0 cursor-pointer flex-shrink-0"
                    checked={guest.status !== InvitationStatus.NOT_INVITED}
                    onChange={(e) => {
                      const newStatus = e.target.checked ? InvitationStatus.INVITED : InvitationStatus.NOT_INVITED;
                      updateGuest(guest.id, { status: newStatus });
                    }}
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

                  <div className="hidden sm:block text-[11px] text-natural-muted font-light truncate max-w-[150px]">
                    {guest.phone || (guest.notes && `"${guest.notes.substring(0, 20)}..."`)}
                  </div>

                  <div className="flex items-center gap-2">
                    {guest.phone && (
                      <a
                        href={getWhatsAppLink(guest) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-natural-sidebar text-natural-olive px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-natural-olive hover:text-white transition-all flex items-center gap-1.5"
                      >
                        Invite
                      </a>
                    )}
                    
                    <button
                      onClick={() => setEditingGuest(guest)}
                      className="p-1.5 text-natural-muted hover:text-natural-olive transition-colors sm:block hidden"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    
                    <div className="relative group/more sm:hidden">
                       <button className="p-1.5 text-natural-muted"><X className="w-3.5 h-3.5 rotate-45" /></button>
                       <div className="absolute right-0 bottom-full mb-2 bg-white border border-natural-border rounded-lg shadow-xl hidden group-hover/more:block p-1">
                          <button onClick={() => setEditingGuest(guest)} className="p-2 text-natural-muted hover:text-natural-olive flex items-center gap-2 text-[10px] uppercase font-bold"><Edit2 className="w-3 h-3" /> Edit</button>
                          <button onClick={() => { if (confirm(`Remove ${guest.name}?`)) deleteGuest(guest.id); }} className="p-2 text-rose-500 hover:bg-rose-50 flex items-center gap-2 text-[10px] uppercase font-bold"><Trash2 className="w-3 h-3" /> Delete</button>
                       </div>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Remove ${guest.name}?`)) deleteGuest(guest.id);
                      }}
                      className="p-1.5 text-natural-muted hover:text-rose-500 transition-colors hidden sm:block"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

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
