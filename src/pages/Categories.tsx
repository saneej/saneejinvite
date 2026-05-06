import React, { useState } from 'react';
import { useGuests } from '../context/GuestContext';
import { db } from '../lib/firebase';
import { Tags, Pencil, Trash2, Check, X, Share2, Clipboard, ShieldCheck, Heart, ShieldAlert, ArrowRight, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { Share2 as ShareIcon } from 'lucide-react';

import { View } from '../types';

interface CategoriesProps {
  onViewChange: (view: View) => void;
  onCategorySelect: (category: string) => void;
}

export function Categories({ onViewChange, onCategorySelect }: CategoriesProps) {
  const { categories, addCategory, updateCategory, deleteCategory, guests, user } = useGuests();
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  // Sharing State
  const [sharingCat, setSharingCat] = useState<string | null>(null);
  const [shareContacts, setShareContacts] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim());
    setNewCatName('');
  };

  const handleShare = async () => {
    if (!sharingCat || !user) return;
    setSharingLoading(true);
    try {
      const category = categories.find(c => c.id === sharingCat);
      if (!category) return;

      const categoryGuests = guests.filter(g => g.category === category.name);
      const guestList = categoryGuests.map(g => ({
        name: g.name,
        phone: shareContacts ? (g.phone || '') : ''
      }));

      const shareData = {
        categoryName: category.name,
        guests: guestList,
        shareContacts,
        createdBy: user.uid,
        createdAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, 'shared_lists'), shareData);
      const url = `${window.location.origin}${window.location.pathname}?share=${docRef.id}`;
      setShareUrl(url);
    } catch (error) {
      console.error("Error sharing category:", error);
    } finally {
      setSharingLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      // Optional: Show toast or feedback
    }
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      updateCategory(editingId, editName.trim());
      setEditingId(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", duration: 0.5 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto space-y-8 pb-24 px-4"
    >
      <motion.header variants={itemVariants} className="pt-4 border-b border-natural-border/50 pb-8 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-serif font-black text-natural-ink italic">Guest Categories</h2>
          <p className="text-natural-muted text-[10px] uppercase tracking-[0.4em] font-black opacity-60 mt-2">Group your guests for easier planning</p>
        </div>
      </motion.header>

      {/* Sharing Modal */}
      <AnimatePresence>
        {sharingCat && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-natural-ink/90 backdrop-blur-sm"
              onClick={() => {
                setSharingCat(null);
                setShareUrl(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[3rem] p-10 relative shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-natural-olive/5 rounded-bl-full -mr-16 -mt-16" />
              
              <button 
                onClick={() => {
                  setSharingCat(null);
                  setShareUrl(null);
                }}
                className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center bg-natural-sidebar hover:bg-natural-border rounded-full text-natural-muted transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              {!shareUrl ? (
                <div className="space-y-8">
                  <div>
                    <div className="w-16 h-16 bg-natural-olive/10 text-natural-olive rounded-2xl flex items-center justify-center mb-6">
                      <Share2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-3xl font-serif font-black text-natural-ink italic">Share Category</h3>
                    <p className="text-sm text-natural-muted leading-relaxed mt-2 italic">
                      Send a link to share the "{categories.find(c => c.id === sharingCat)?.name}" guest list with family.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-natural-sidebar/30 rounded-[2rem] border border-natural-border/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                            shareContacts ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-600"
                          )}>
                            {shareContacts ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest font-black text-natural-ink">Privacy Shield</p>
                            <p className="text-xs text-natural-muted italic">{shareContacts ? "Warning: Contacts will be visible" : "Safe: Only names will be shared"}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShareContacts(!shareContacts)}
                          className={cn(
                            "w-14 h-8 rounded-full transition-all relative p-1",
                            shareContacts ? "bg-rose-500" : "bg-emerald-500"
                          )}
                        >
                          <motion.div 
                            animate={{ x: shareContacts ? 24 : 0 }}
                            className="w-6 h-6 bg-white rounded-full shadow-sm" 
                          />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                       <Check className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                       <p className="text-[10px] text-amber-700 leading-relaxed font-bold uppercase tracking-wider">
                         Your source list remains private. This generates a snapshot for others to import into their own WED Invitor account.
                       </p>
                    </div>

                    <button
                      onClick={handleShare}
                      disabled={sharingLoading}
                      className="w-full bg-natural-ink text-white py-6 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-natural-olive transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                    >
                      {sharingLoading ? "Crafting Link..." : "Generate Magic Link"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                      <Check className="w-10 h-10" />
                    </div>
                    <h3 className="text-3xl font-serif font-black text-natural-ink italic">Ready to Share</h3>
                    <p className="text-sm text-natural-muted px-8">Your list is live. Copy the link below and send it to your celebration circle.</p>
                  </div>

                  <div className="relative group">
                    <input 
                      type="text" 
                      readOnly 
                      value={shareUrl}
                      className="w-full bg-natural-sidebar/30 border border-natural-border/30 px-6 py-5 rounded-[2rem] text-[10px] font-mono select-all outline-none"
                    />
                    <button 
                      onClick={copyToClipboard}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-natural-olive shadow-sm border border-natural-border/30 hover:bg-natural-olive hover:text-white transition-all flex items-center gap-2"
                    >
                      <Clipboard className="w-3 h-3" />
                      Copy Link
                    </button>
                  </div>

                  <button 
                    onClick={() => {
                      setSharingCat(null);
                      setShareUrl(null);
                    }}
                    className="w-full border-2 border-natural-border/50 text-natural-muted py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-natural-sidebar transition-all"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Category Form */}
      <motion.form 
        variants={itemVariants}
        onSubmit={handleAdd} 
        className="flex flex-col sm:flex-row gap-4 p-5 bg-white border border-natural-border/40 rounded-[2.5rem] shadow-xl shadow-natural-olive/5"
      >
        <div className="relative flex-1">
          <Tags className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-natural-muted/50" />
          <input
            type="text"
            placeholder="Category Name (Family, Friends, etc)..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="w-full bg-natural-sidebar/20 border border-natural-border/30 px-14 py-5 rounded-3xl text-sm font-serif italic outline-none focus:bg-white focus:border-natural-olive transition-all h-16"
          />
        </div>
        <button
          type="submit"
          disabled={!newCatName.trim()}
          className="bg-natural-olive text-white px-10 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] hover:bg-natural-ink transition-all shadow-lg shadow-natural-olive/20 disabled:opacity-30 h-16"
        >
          Add Category
        </button>
      </motion.form>

      {/* Categories List */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {categories.map((cat) => {
            const guestCount = guests.filter(g => g.category === cat.name).length;
            
            return (
              <motion.div
                variants={itemVariants}
                layout
                key={cat.id}
                className="group relative"
              >
                <div className="bg-white rounded-[3rem] border border-natural-border/30 hover:border-natural-olive/30 hover:shadow-2xl hover:shadow-natural-olive/5 transition-all relative overflow-hidden h-full flex flex-col group/card">
                  {/* Clickable Area */}
                  <button 
                    onClick={() => {
                      onCategorySelect(cat.name);
                      onViewChange('category-detail');
                    }}
                    className="absolute inset-0 z-0 text-left cursor-pointer"
                    aria-label={`View guests in ${cat.name}`}
                  />
                  
                  {/* Subtle Pattern */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-natural-olive/5 rounded-bl-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
                  
                  <div className="p-8 pb-0 h-full flex flex-col relative z-10 pointer-events-none">
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex-1">
                        {editingId === cat.id ? (
                          <div className="relative pointer-events-auto">
                            <input
                            autoFocus
                            type="text"
                            className="w-full bg-natural-sidebar/30 border-b-2 border-natural-olive px-4 py-2 rounded text-base font-serif italic outline-none"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <h4 className="text-2xl font-serif font-black text-natural-ink italic truncate group-hover:text-natural-olive transition-colors">{cat.name}</h4>
                          <div className="flex items-center gap-2">
                            <Users className="w-3 h-3 text-natural-muted opacity-40" />
                            <p className="text-[10px] uppercase tracking-[0.2em] text-natural-muted font-black opacity-60">
                              {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-8 pb-8 pt-0 mt-auto flex items-center justify-between border-t border-natural-border/10 relative z-20">
                    <button
                      onClick={() => setSharingCat(cat.id)}
                      className="flex items-center gap-3 px-5 py-3 bg-natural-sidebar/50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-natural-olive hover:bg-natural-olive hover:text-white transition-all shadow-sm"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Share
                    </button>

                    <div className="flex items-center gap-1">
                      {editingId === cat.id ? (
                        <>
                          <button onClick={saveEdit} className="w-10 h-10 flex items-center justify-center text-emerald-600 bg-emerald-50 rounded-full transition-all">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="w-10 h-10 flex items-center justify-center text-natural-muted hover:bg-natural-sidebar rounded-full transition-all">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : deleteId === cat.id ? (
                         <button 
                            onClick={() => {
                              deleteCategory(cat.id);
                              setDeleteId(null);
                            }} 
                            className="bg-rose-500 text-white px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                          >
                            Delete
                          </button>
                      ) : (
                        <>
                          <button 
                            onClick={() => {
                              setDeleteId(null);
                              startEdit(cat.id, cat.name);
                            }}
                            className="w-10 h-10 flex items-center justify-center text-natural-muted hover:text-natural-olive hover:bg-natural-sidebar rounded-full transition-all"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setDeleteId(cat.id)}
                            className="w-10 h-10 flex items-center justify-center text-natural-muted hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {categories.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-32 rounded-[3.5rem] border-2 border-dashed border-natural-border/40 text-natural-muted font-serif italic text-2xl flex flex-col items-center gap-6"
        >
          <div className="w-20 h-20 bg-natural-sidebar/50 rounded-full flex items-center justify-center">
            <Tags className="w-8 h-8 opacity-20" />
          </div>
          No categories yet. Add one above to organize your guests.
        </motion.div>
      )}
    </motion.div>
  );
}
