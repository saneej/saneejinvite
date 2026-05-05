import React, { useState } from 'react';
import { useGuests } from '../context/GuestContext';
import { InvitationStatus, Guest } from '../types';
import { Search, Sparkles, Send, CheckCircle2, MessageCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generatePersonalizedInvitation } from '../services/aiService';
import { cn } from '../lib/utils';

export default function Invite() {
  const { guests, settings, updateGuest } = useGuests();
  const [searchTerm, setSearchTerm] = useState('');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [personalizedMessages, setPersonalizedMessages] = useState<Record<string, string>>({});
  
  const uninvitedGuests = guests.filter(g => 
    g.status === InvitationStatus.NOT_INVITED &&
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

  const getWhatsAppLink = (guest: Guest, type: 'greeting' | 'invitation' | 'ai') => {
    if (!guest.phone) return '#';
    let template = '';
    
    if (type === 'greeting') template = settings.greetingMessage;
    else if (type === 'invitation') template = settings.whatsappTemplate;
    else if (type === 'ai') template = personalizedMessages[guest.id] || '';
    
    if (!template) return '#';

    const message = template
      .replace('[Name]', guest.name)
      .replace('[Date]', settings.weddingDate || '')
      .replace('[Venue]', settings.venue || '');
    
    const cleanPhone = guest.phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-natural-border/50 pb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-natural-olive">Invitation Station</h1>
          <p className="text-natural-muted text-sm mt-1 italic tracking-wide">Personalize and send your elegant invitations.</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted group-focus-within:text-natural-olive transition-colors" />
          <input 
            type="text"
            placeholder="Search uninvited guests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-natural-border/50 rounded-xl text-sm outline-none focus:border-natural-olive transition-all min-w-[280px] shadow-sm"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {uninvitedGuests.length > 0 ? (
            uninvitedGuests.map((guest) => (
              <motion.div
                key={guest.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white border border-natural-border/40 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-serif font-bold text-natural-ink">{guest.name}</h3>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">{guest.category} • {guest.phone || 'No phone'}</p>
                      </div>
                      <button
                        onClick={() => handlePersonalize(guest)}
                        disabled={generatingId === guest.id || !guest.phone}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                          personalizedMessages[guest.id] 
                            ? "bg-natural-olive/10 text-natural-olive border border-natural-olive/20"
                            : "bg-natural-sidebar text-natural-muted hover:text-natural-olive hover:bg-natural-sidebar/80"
                        )}
                      >
                        {generatingId === guest.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        {personalizedMessages[guest.id] ? "Regenerate AI Message" : "AI Personalize Message"}
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Message Selection */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Standard greeting */}
                        <div className="space-y-2">
                          <p className="text-[8px] uppercase font-bold text-natural-olive/60 ml-1 tracking-wider">Step 1: Greeting</p>
                          <div className="bg-natural-sidebar/20 p-3 rounded-xl border border-natural-border/20 text-[10px] text-natural-ink italic leading-relaxed min-h-[60px] flex items-center justify-center text-center">
                            {settings.greetingMessage.replace('[Name]', guest.name)}
                          </div>
                          {guest.phone && (
                            <a
                              href={getWhatsAppLink(guest, 'greeting')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-natural-border/50 text-[9px] font-bold uppercase tracking-widest text-natural-olive hover:bg-natural-olive hover:text-white transition-all rounded-lg"
                            >
                              <Send className="w-3 h-3" />
                              Send Greeting
                            </a>
                          )}
                        </div>

                        {/* Invitation (Standard or AI) */}
                        <div className="space-y-2">
                          <p className="text-[8px] uppercase font-bold text-emerald-600/60 ml-1 tracking-wider">Step 2: Invitation</p>
                          <div className={cn(
                            "p-3 rounded-xl border text-[10px] leading-relaxed min-h-[60px] flex items-center justify-center text-center",
                            personalizedMessages[guest.id]
                              ? "bg-emerald-50 border-emerald-100 text-emerald-900 font-serif"
                              : "bg-natural-sidebar/20 border-natural-border/20 text-natural-ink italic"
                          )}>
                            {personalizedMessages[guest.id] || settings.whatsappTemplate.replace('[Name]', guest.name).replace('[Date]', settings.weddingDate).replace('[Venue]', settings.venue)}
                          </div>
                          {guest.phone && (
                            <a
                              href={getWhatsAppLink(guest, personalizedMessages[guest.id] ? 'ai' : 'invitation')}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => updateGuest(guest.id, { status: InvitationStatus.INVITED })}
                              className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all rounded-lg shadow-sm"
                            >
                              <MessageCircle className="w-3 h-3" />
                              Send {personalizedMessages[guest.id] ? 'AI' : 'Standard'} Invite
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-natural-border/60">
              <div className="w-16 h-16 bg-natural-sidebar rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-natural-olive opacity-40" />
              </div>
              <h3 className="text-lg font-serif font-bold text-natural-ink">All Guests Invited</h3>
              <p className="text-natural-muted text-sm px-10 mt-2">Everyone on your list has been sent an invitation. Good job!</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
