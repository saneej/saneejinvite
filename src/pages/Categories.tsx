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
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4">
      <header className="pt-4 border-b border-natural-border/50 pb-8">
        <h2 className="text-3xl font-serif font-bold text-natural-ink">Guest Groupings</h2>
        <p className="text-natural-muted text-[10px] uppercase tracking-[0.2em] font-medium mt-1">Organizing your loved ones</p>
      </header>

      {/* Add Category Form */}
      <motion.form 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onSubmit={handleAdd} 
        className="flex flex-col sm:flex-row gap-3 p-4 bg-white border border-natural-border/60 rounded-xl"
      >
        <div className="relative flex-1">
          <Tags className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted font-light" />
          <input
            type="text"
            placeholder="New group name..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="w-full bg-natural-sidebar/30 border border-natural-border/50 px-10 py-2.5 rounded-lg text-xs outline-none focus:border-natural-olive transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={!newCatName.trim()}
          className="bg-natural-olive text-white px-8 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-natural-ink transition-colors disabled:opacity-50"
        >
          Add
        </button>
      </motion.form>

      {/* Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {categories.map((cat) => {
            const guestCount = guests.filter(g => g.category === cat.name).length;
            
            return (
              <motion.div
                layout
                key={cat.id}
                className="group"
              >
                <div className="bg-white p-6 rounded-xl border border-natural-border/60 hover:border-natural-olive transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      {editingId === cat.id ? (
                        <input
                          autoFocus
                          type="text"
                          className="w-full bg-natural-sidebar/30 border border-natural-border/50 px-2 py-1 rounded text-sm font-serif"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        />
                      ) : (
                        <div className="space-y-1">
                          <h4 className="text-lg font-serif font-bold text-natural-ink truncate group-hover:text-natural-olive transition-colors">{cat.name}</h4>
                          <p className="text-[9px] uppercase tracking-wider text-natural-muted font-bold">
                            {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-4 border-t border-natural-border/30">
                    {editingId === cat.id ? (
                      <>
                        <button onClick={saveEdit} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-2 text-natural-muted hover:bg-natural-sidebar rounded-lg transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => startEdit(cat.id, cat.name)}
                          className="p-2 text-natural-muted hover:text-natural-olive transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`Remove group "${cat.name}"?`)) deleteCategory(cat.id);
                          }}
                          className="p-2 text-natural-muted hover:text-rose-500 transition-colors"
                          title="Delete"
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
