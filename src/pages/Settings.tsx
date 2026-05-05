import React, { useState } from 'react';
import { useGuests } from '../context/GuestContext';
import { Save, Download, FileJson, FileSpreadsheet, Heart, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export function Settings() {
  const { settings, updateSettings, guests } = useGuests();
  const [formData, setFormData] = useState(settings);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const exportToCSV = () => {
    if (guests.length === 0) return;
    
    const headers = ['Name', 'Phone', 'Category', 'Status', 'Notes', 'Created At'];
    const rows = guests.map(g => [
      g.name,
      g.phone || '',
      g.category,
      g.status,
      (g.notes || '').replace(/,/g, ' '),
      new Date(g.createdAt).toLocaleDateString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `wedding_guests_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
      <header className="pt-4 border-b border-natural-border/50 pb-8">
        <h2 className="text-3xl font-serif font-bold text-natural-ink">Settings</h2>
        <p className="text-natural-muted text-[10px] uppercase tracking-[0.2em] font-medium mt-1">Personalizing your celebration hub</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit} 
            className="bg-white p-8 rounded-2xl border border-natural-border/60 shadow-sm space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">Bride's Name</label>
                <input 
                  type="text" 
                  value={formData.brideName} 
                  onChange={(e) => setFormData({...formData, brideName: e.target.value})}
                  className="w-full bg-natural-sidebar/30 border border-natural-border/50 px-4 py-3 rounded-xl text-sm outline-none focus:border-natural-olive transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">Groom's Name</label>
                <input 
                  type="text" 
                  value={formData.groomName} 
                  onChange={(e) => setFormData({...formData, groomName: e.target.value})}
                  className="w-full bg-natural-sidebar/30 border border-natural-border/50 px-4 py-3 rounded-xl text-sm outline-none focus:border-natural-olive transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">Wedding Date</label>
                <input 
                  type="date" 
                  value={formData.weddingDate} 
                  onChange={(e) => setFormData({...formData, weddingDate: e.target.value})}
                  className="w-full bg-natural-sidebar/30 border border-natural-border/50 px-4 py-3 rounded-xl text-sm outline-none focus:border-natural-olive transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">Venue</label>
                <input 
                  type="text" 
                  value={formData.venue} 
                  onChange={(e) => setFormData({...formData, venue: e.target.value})}
                  className="w-full bg-natural-sidebar/30 border border-natural-border/50 px-4 py-3 rounded-xl text-sm outline-none focus:border-natural-olive transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted flex justify-between">
                <span>WhatsApp Template</span>
                <span className="opacity-50 lowercase tracking-normal">Markers: [Name], [Date], [Venue]</span>
              </label>
              <textarea 
                value={formData.whatsappTemplate} 
                onChange={(e) => setFormData({...formData, whatsappTemplate: e.target.value})}
                className="w-full bg-natural-sidebar/30 border border-natural-border/50 px-4 py-4 rounded-xl text-sm outline-none focus:border-natural-olive transition-all h-32 resize-none"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-natural-olive text-white py-4 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-natural-ink transition-colors shadow-sm"
            >
              {isSaved ? 'Settings Saved' : 'Save Profile Changes'}
            </button>
          </motion.form>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-natural-border/60 shadow-sm">
            <h3 className="text-lg font-serif font-bold text-natural-ink mb-4">Data Management</h3>
            <div className="space-y-3">
              <button 
                onClick={exportToCSV}
                disabled={guests.length === 0}
                className="w-full flex items-center justify-between p-4 bg-natural-sidebar/30 border border-natural-border/50 rounded-xl hover:bg-natural-sidebar transition-colors disabled:opacity-40"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-natural-ink">Export CSV</span>
                </div>
                <Download className="w-3 h-3 text-natural-muted" />
              </button>

              <button 
                onClick={() => {
                  const json = JSON.stringify(guests, null, 2);
                  const blob = new Blob([json], { type: 'application/json' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = 'wedding_data_backup.json';
                  link.click();
                }}
                className="w-full flex items-center justify-between p-4 bg-natural-sidebar/30 border border-natural-border/50 rounded-xl hover:bg-natural-sidebar transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileJson className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-natural-ink">Backup JSON</span>
                </div>
                <Download className="w-3 h-3 text-natural-muted" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
