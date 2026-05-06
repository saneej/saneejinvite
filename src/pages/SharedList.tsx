import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { SharedList, InvitationStatus } from '../types';
import { useGuests } from '../context/GuestContext';
import { motion } from 'motion/react';
import { Heart, Users, Check, Share2, Import, ArrowRight, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

export function SharedListPage({ sharedId, onImportSuccess }: { sharedId: string, onImportSuccess: () => void }) {
  const { user, addGuest, login } = useGuests();
  const [list, setList] = useState<SharedList | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchList() {
      try {
        const docRef = doc(db, 'shared_lists', sharedId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setList({ id: docSnap.id, ...docSnap.data() } as SharedList);
        }
      } catch (error) {
        console.error("Error fetching shared list:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchList();
  }, [sharedId]);

  const handleImport = async () => {
    if (!list || !user) return;
    setImporting(true);
    try {
      for (const guest of list.guests) {
        await addGuest({
          name: guest.name,
          phone: list.shareContacts ? (guest.phone || '') : '',
          category: list.categoryName,
          status: InvitationStatus.NOT_INVITED,
          notes: `Imported from shared list: ${list.categoryName}`
        });
      }
      setSuccess(true);
      setTimeout(() => onImportSuccess(), 2000);
    } catch (error) {
      console.error("Error importing list:", error);
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-natural-sidebar">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-natural-olive/20 rounded-full" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-natural-muted">Fetching Secret List...</p>
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-natural-sidebar p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="text-4xl">🕊️</div>
          <h2 className="text-2xl font-serif font-bold text-natural-ink italic">This list has flown away</h2>
          <p className="text-sm text-natural-muted leading-relaxed">
            The link might be broken or the list has been removed by the sender.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-natural-sidebar p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-12 pb-20">
        <header className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto text-natural-olive border border-natural-border/30 mb-6"
          >
            <Share2 className="w-8 h-8" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-serif font-black text-natural-ink italic">Shared Celebration</h1>
          <p className="text-natural-muted text-[10px] uppercase tracking-[0.4em] font-black opacity-60">
            A curated list of {list.guests.length} cherished guests
          </p>
        </header>

        <section className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-natural-olive/5 border border-natural-border/20 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-natural-border/30 pb-8">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black text-natural-muted mb-1 opacity-50">Category</p>
              <h3 className="text-2xl font-serif font-bold text-natural-olive italic">{list.categoryName}</h3>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={cn(
                "px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2",
                list.shareContacts ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
              )}>
                <ShieldCheck className="w-3 h-3" />
                {list.shareContacts ? "Contacts Included" : "Names Only (Private)"}
              </div>
            </div>
          </div>

          <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
            {list.guests.map((guest, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-natural-sidebar/30 rounded-2xl border border-natural-border/10">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-natural-muted">
                    {idx + 1}
                  </div>
                  <span className="text-sm font-serif font-bold text-natural-ink">{guest.name}</span>
                </div>
                {list.shareContacts && guest.phone && (
                  <span className="text-[10px] font-mono text-natural-muted opacity-60">{guest.phone}</span>
                )}
              </div>
            ))}
          </div>

          <div className="pt-8">
            {!user ? (
              <button 
                onClick={login}
                className="w-full bg-natural-ink text-white py-6 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-natural-olive transition-all flex items-center justify-center gap-4"
              >
                Sign in to Import List
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : success ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full bg-emerald-500 text-white py-6 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4"
              >
                <Check className="w-5 h-5" />
                Imported Successfully
              </motion.div>
            ) : (
              <button 
                onClick={handleImport}
                disabled={importing}
                className="w-full bg-natural-olive text-white py-6 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-natural-ink transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {importing ? "Importing Souls..." : "Import to My WED Invitor"}
                <Import className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
            <p className="text-center text-[9px] uppercase tracking-widest font-bold text-natural-muted mt-6 opacity-40">
              * Guests will be added to your account under the "{list.categoryName}" category.
            </p>
          </div>
        </section>

        <footer className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-8 bg-natural-border/30" />
            <Heart className="w-4 h-4 text-natural-olive/30" />
            <div className="h-px w-8 bg-natural-border/30" />
          </div>
          <p className="text-[8px] uppercase tracking-[0.5em] font-black text-natural-muted/40">
            Powered by WED Invitor
          </p>
        </footer>
      </div>
    </div>
  );
}
