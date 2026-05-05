import React, { useState } from 'react';
import { useGuests } from '../context/GuestContext';
import { Tags, Plus, Pencil, Trash2, Check, X, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory, guests } = useGuests();
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim());
    setNewCatName('');
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

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-24 md:pb-0 color-overlap min-h-screen">
      <div className="absolute top-1/3 -left-20 w-80 h-80 bg-natural-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <header className="relative pt-4">
        <h2 className="text-4xl font-serif font-bold text-natural-olive mb-2">Guest Categories</h2>
        <div className="flex items-center gap-3">
          <Heart className="w-3 h-3 text-natural-accent fill-natural-accent" />
          <p className="text-natural-muted font-sans text-[10px] uppercase tracking-[0.2em] font-black">Group your loved ones with care</p>
        </div>
      </header>

      {/* Add Category Form */}
      <motion.form 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleAdd} 
        className="flex flex-col sm:flex-row gap-4 p-4 glass-card border-none shadow-xl"
      >
        <div className="relative flex-1 group">
          <Tags className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted transition-colors group-focus-within:text-natural-olive" />
          <input
            type="text"
            placeholder="New grouping name (e.g. Work Colleagues)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="input-natural pl-14"
          />
        </div>
        <button
          type="submit"
          disabled={!newCatName.trim()}
          className="btn-primary px-10 py-4 shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5 font-bold" />
          <span>Add Group</span>
        </button>
      </motion.form>

      {/* Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimatePresence mode="popLayout">
          {categories.map((cat, idx) => {
            const guestCount = guests.filter(g => g.category === cat.name).length;
            
            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                key={cat.id}
                className="group relative"
              >
                 {/* Overlapping back element */}
                 <div className="absolute inset-0 bg-natural-olive/5 rounded-[2rem] translate-x-3 translate-y-3 -z-10 transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
                 
                 <div className="glass-card p-8 border-none shadow-lg hover:shadow-xl transition-all h-full flex flex-col justify-between">
                  <div className="flex items-center gap-6 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-natural-sidebar text-natural-olive flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                      <Tags className="w-6 h-6 outline-none" />
                    </div>
                    
                    {editingId === cat.id ? (
                      <input
                        autoFocus
                        type="text"
                        className="flex-1 input-natural py-2 text-xl font-serif"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      />
                    ) : (
                      <div className="space-y-1">
                        <h4 className="text-2xl font-serif font-bold text-natural-ink group-hover:text-natural-olive transition-colors">{cat.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-natural-accent/20 text-[9px] text-natural-olive font-black uppercase tracking-widest rounded-lg">
                            {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-natural-border/30">
                    {editingId === cat.id ? (
                      <>
                        <button onClick={saveEdit} className="p-3 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors shadow-sm">
                          <Check className="w-6 h-6" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-3 text-natural-muted hover:bg-natural-sidebar rounded-xl transition-colors">
                          <X className="w-6 h-6" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => startEdit(cat.id, cat.name)}
                          className="p-3 text-natural-muted hover:text-natural-olive hover:bg-natural-sidebar rounded-xl transition-all shadow-sm active:scale-95"
                          title="Edit Group"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`Delete group "${cat.name}"? Guests in this group won't be deleted.`)) {
                              deleteCategory(cat.id);
                            }
                          }}
                          className="p-3 text-natural-muted hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-sm active:scale-95"
                          title="Delete Group"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {categories.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 glass-card border-dashed border-2 m-4 text-natural-muted font-serif italic text-xl"
        >
          No grouping categories yet. Time to organize!
        </motion.div>
      )}
    </div>
  );
}
