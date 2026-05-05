import React, { useState } from 'react';
import { useGuests } from '../context/GuestContext';
import { InvitationStatus, Guest } from '../types';
import { Search, Phone, MessageSquare, Edit2, Trash2, X, Users, Heart } from 'lucide-react';
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
    <div className="space-y-8 pb-20 md:pb-0 color-overlap min-h-screen">
       <div className="absolute top-1/4 -right-20 w-80 h-80 bg-natural-accent/15 rounded-full blur-[100px] pointer-events-none" />

      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 relative z-10 pt-4">
        <div>
          <h2 className="text-4xl font-serif font-bold text-natural-olive mb-2">Guest List</h2>
          <p className="text-natural-muted text-xs uppercase tracking-[0.2em] font-bold flex items-center gap-2">
             <Heart className="w-3 h-3 fill-natural-accent text-natural-accent" />
             {filteredGuests.length} people planning to celebrate with you
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
          <div className="relative group md:w-80">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted transition-colors group-focus-within:text-natural-olive" />
            <input
              type="text"
              placeholder="Search guests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-natural pl-14"
            />
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-6 py-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-natural-border/50 text-[10px] font-bold text-natural-olive uppercase tracking-widest outline-none focus:ring-4 focus:ring-natural-olive/5 transition-all shadow-sm cursor-pointer min-w-[140px]"
            >
              <option value="All">All Categories</option>
              {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
            </select>

            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-6 py-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-natural-border/50 text-[10px] font-bold text-natural-muted uppercase tracking-widest outline-none focus:ring-4 focus:ring-natural-olive/5 transition-all shadow-sm cursor-pointer min-w-[140px]"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-8 p-1">
          <AnimatePresence mode="popLayout">
            {filteredGuests.map((guest, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                key={guest.id}
                className="group relative"
              >
                {/* Overlapping Background Card Effect */}
                <div className="absolute inset-0 bg-natural-olive/5 rounded-[2.5rem] translate-x-3 translate-y-3 -z-10 transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
                
                <div className="glass-card p-8 border-none shadow-xl hover:shadow-2xl transition-all h-full flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-2xl font-serif font-bold text-natural-ink group-hover:text-natural-olive transition-colors">{guest.name}</h4>
                      <span className="inline-block mt-1 px-3 py-1 bg-natural-accent/20 text-natural-olive text-[10px] font-bold uppercase tracking-widest rounded-lg">
                        {guest.category}
                      </span>
                    </div>
                    <div className={cn("px-4 py-1.5 rounded-full text-[9px] uppercase font-bold tracking-widest shadow-sm", statusColors[guest.status])}>
                      {guest.status}
                    </div>
                  </div>

                  <div className="space-y-3 flex-1">
                    {guest.phone && (
                      <div className="flex items-center gap-3 text-sm text-natural-muted font-medium bg-natural-sidebar/50 p-3 rounded-xl border border-natural-border/30">
                        <Phone className="w-4 h-4 text-natural-olive" />
                        {guest.phone}
                      </div>
                    )}

                    {guest.notes && (
                      <div className="relative p-5 bg-natural-bg/40 rounded-2xl border-l-4 border-natural-accent italic text-sm text-natural-ink/70 mt-4 leading-relaxed">
                        "{guest.notes}"
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-8 pt-6 border-t border-natural-border/30">
                    {guest.phone && (
                      <a
                        href={getWhatsAppLink(guest) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-3 bg-natural-olive text-white py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-natural-ink hover:shadow-xl transition-all shadow-md group-hover:scale-105 active:scale-95"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Send Invite
                      </a>
                    )}
                    <button
                      onClick={() => setEditingGuest(guest)}
                      className="p-4 bg-white text-natural-muted hover:text-natural-olive hover:bg-natural-sidebar rounded-2xl border border-natural-border/50 transition-all shadow-sm active:scale-95"
                      title="Edit Guest"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${guest.name} from the list?`)) {
                          deleteGuest(guest.id);
                        }
                      }}
                      className="p-4 bg-white text-natural-muted hover:text-rose-500 hover:bg-rose-50 rounded-2xl border border-natural-border/50 transition-all shadow-sm active:scale-95"
                      title="Delete Guest"
                    >
                      <Trash2 className="w-4 h-4" />
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
