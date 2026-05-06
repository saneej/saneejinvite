import React, { useState } from 'react';
import { useGuests } from '../context/GuestContext';
import { InvitationStatus, Guest } from '../types';
import { Search, Sparkles, Send, CheckCircle2, MessageCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generatePersonalizedInvitation } from '../services/aiService';
import { cn } from '../lib/utils';

export default function Invite() {
  const { guests, settings, updateGuest, categories } = useGuests();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [personalizedMessages, setPersonalizedMessages] = useState<Record<string, string>>({});
  
  const filteredGuests = guests.filter(g => 
    g.status === InvitationStatus.NOT_INVITED &&
    (selectedCategory === 'All' || g.category === selectedCategory) &&
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePersonalize = async (guest: Guest) => {
    setGeneratingId(guest.id);
    try {
      const message = await generatePersonalizedInvitation(
        guest.name,
        guest.category,
        settings.invitationTone,
        settings.weddingDate,
        settings.venue
      );
      setPersonalizedMessages(prev => ({ ...prev, [guest.id]: message }));
    } catch (error) {
      console.error(error);
    } finally {
      setGeneratingId(null);
    }
  };

  const getWhatsAppLink = (guest: Guest, type: 'greeting' | 'invitation') => {
    if (!guest.phone) return '#';
    
    let message = '';
    if (type === 'greeting') {
      message = (settings.greetingMessage || '').replace('[Name]', guest.name);
    } else {
      message = personalizedMessages[guest.id] || (settings.whatsappTemplate || '')
        .replace('[Name]', guest.name)
        .replace('[Date]', settings.weddingDate)
        .replace('[Venue]', settings.venue);
    }

    const cleanPhone = guest.phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-24 px-4"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-natural-border/50 pb-8 pt-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-natural-ink italic">Send Invites</h1>
          <p className="text-natural-muted text-[10px] uppercase font-bold tracking-[0.2em] mt-1">Send messages to your guests</p>
        </div>
        
        <div className="relative group w-full md:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted group-focus-within:text-natural-olive transition-colors" />
          <input 
            type="text"
            placeholder="Search pending guests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-[300px] pl-11 pr-4 py-3 bg-natural-sidebar/50 border border-natural-border/40 rounded-2xl text-sm outline-none focus:border-natural-olive focus:bg-white transition-all shadow-sm"
          />
        </div>
      </header>

      {/* Category Filter Bar */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory('All')}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all shadow-sm",
            selectedCategory === 'All'
              ? "bg-natural-olive text-white ring-4 ring-natural-olive/10"
              : "bg-white text-natural-muted border border-natural-border/40 hover:border-natural-olive"
          )}
        >
          All ({guests.filter(g => g.status === InvitationStatus.NOT_INVITED).length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.name)}
            className={cn(
              "px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all shadow-sm",
              selectedCategory === cat.name
                ? "bg-natural-olive text-white ring-4 ring-natural-olive/10"
                : "bg-white text-natural-muted border border-natural-border/40 hover:border-natural-olive"
            )}
          >
            {cat.name} ({guests.filter(g => g.status === InvitationStatus.NOT_INVITED && g.category === cat.name).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout" initial={false}>
          {filteredGuests.length > 0 ? (
            filteredGuests.map((guest) => (
              <motion.div
                key={guest.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="bg-white border border-natural-border/60 rounded-[2rem] p-6 md:p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-natural-olive/5 rounded-bl-full pointer-events-none -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700" />
                
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-natural-sidebar rounded-2xl flex items-center justify-center text-natural-olive font-serif text-2xl font-bold border border-natural-border/40">
                        {guest.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-serif font-bold text-natural-ink">{guest.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-full bg-natural-sidebar text-natural-muted text-[8px] font-bold uppercase tracking-widest">
                            {guest.category}
                          </span>
                          <span className="text-[10px] text-natural-muted/60 font-medium tracking-wide">
                            {guest.phone || 'Phone missing'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePersonalize(guest)}
                      disabled={generatingId === guest.id || !guest.phone}
                      className={cn(
                        "flex items-center justify-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm w-full md:w-auto",
                        personalizedMessages[guest.id] 
                          ? "bg-natural-olive text-white"
                          : "bg-natural-sidebar text-natural-olive border border-natural-border/40 hover:border-natural-olive/30"
                      )}
                    >
                      {generatingId === guest.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      {personalizedMessages[guest.id] ? "Regenerate AI Message" : "Write with AI Assistant"}
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                    <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px bg-natural-border/30" />
                    
                    {/* Step 1: Greeting */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-natural-olive text-white text-[9px] font-bold">1</span>
                        <p className="text-[9px] uppercase font-bold text-natural-muted tracking-widest leading-none">Warm Greeting</p>
                      </div>
                      <div className="bg-natural-sidebar/30 p-5 rounded-2xl border border-natural-border/20 text-xs text-natural-ink/80 italic leading-relaxed min-h-[80px] flex items-center">
                        {(settings.greetingMessage || '').replace('[Name]', guest.name)}
                      </div>
                      {guest.phone && (
                        <motion.a
                          whileTap={{ scale: 0.95 }}
                          href={getWhatsAppLink(guest, 'greeting')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-natural-border/50 text-[10px] font-bold uppercase tracking-[0.2em] text-natural-olive hover:border-natural-olive transition-all rounded-2xl shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send Greeting
                        </motion.a>
                      )}
                    </div>

                    {/* Step 2: Invitation */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-[9px] font-bold">2</span>
                        <p className="text-[9px] uppercase font-bold text-emerald-600 tracking-widest leading-none">Invitation Message</p>
                      </div>
                      <div className={cn(
                        "p-5 rounded-2xl border text-xs leading-relaxed min-h-[80px] flex items-center",
                        personalizedMessages[guest.id]
                          ? "bg-emerald-50 border-emerald-100/50 text-emerald-900 font-serif"
                          : "bg-natural-sidebar/30 border-natural-border/20 text-natural-ink/80 italic"
                      )}>
                        {personalizedMessages[guest.id] || (settings.whatsappTemplate || '').replace('[Name]', guest.name).replace('[Date]', settings.weddingDate).replace('[Venue]', settings.venue)}
                      </div>
                      {guest.phone && (
                        <motion.a
                          whileTap={{ scale: 0.95 }}
                          href={getWhatsAppLink(guest, 'invitation')}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => updateGuest(guest.id, { status: InvitationStatus.INVITED })}
                          className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all rounded-2xl shadow-lg shadow-emerald-600/10"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Send Invitation
                        </motion.a>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-2 flex justify-center">
                    <button
                      onClick={() => updateGuest(guest.id, { status: InvitationStatus.INVITED })}
                      className="text-[9px] text-natural-muted/60 hover:text-natural-olive font-bold uppercase tracking-widest flex items-center gap-2 transition-colors py-2 px-4 rounded-xl hover:bg-natural-sidebar/50"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Wait, I sent it manually
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-natural-border/60"
            >
              <div className="w-20 h-20 bg-natural-sidebar rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
                <CheckCircle2 className="w-10 h-10 text-natural-olive opacity-40 shrink-0" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-natural-ink italic">
                {selectedCategory === 'All' ? 'All Done!' : `Hooray!`}
              </h3>
              <p className="text-natural-muted text-sm max-w-xs mx-auto mt-3 leading-relaxed">
                {selectedCategory === 'All' 
                  ? 'All guests have been invited. Great job!' 
                  : `All guests in "${selectedCategory}" have been invited.`}
              </p>
              <button 
                onClick={() => setSelectedCategory('All')}
                className="mt-8 text-[10px] font-bold uppercase tracking-widest text-natural-olive hover:underline underline-offset-4"
              >
                Show all categories
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
