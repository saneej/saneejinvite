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
    <div className="max-w-6xl mx-auto space-y-10 pb-24 md:pb-0 color-overlap min-h-screen">
      <div className="absolute top-0 right-0 w-96 h-96 bg-natural-accent/10 rounded-full blur-[100px] pointer-events-none" />
      
      <header className="relative pt-4">
        <h2 className="text-4xl font-serif font-bold text-natural-olive mb-2">Collection Settings</h2>
        <div className="flex items-center gap-3">
          <Heart className="w-3 h-3 text-natural-accent fill-natural-accent" />
          <p className="text-natural-muted font-sans text-[10px] uppercase tracking-[0.2em] font-black">Customize your wedding universe</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Form Settings */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit} 
            className="glass-card p-8 md:p-12 relative overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-natural-accent/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-natural-muted tracking-widest ml-1">Bride's Name</label>
                <input 
                  type="text" 
                  value={formData.brideName} 
                  onChange={(e) => setFormData({...formData, brideName: e.target.value})}
                  className="input-natural !bg-white/50"
                  placeholder="e.g. Emma"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-natural-muted tracking-widest ml-1">Groom's Name</label>
                <input 
                  type="text" 
                  value={formData.groomName} 
                  onChange={(e) => setFormData({...formData, groomName: e.target.value})}
                  className="input-natural !bg-white/50"
                  placeholder="e.g. James"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-natural-muted tracking-widest ml-1">Wedding Date</label>
                <input 
                  type="date" 
                  value={formData.weddingDate} 
                  onChange={(e) => setFormData({...formData, weddingDate: e.target.value})}
                  className="input-natural !bg-white/50 cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-natural-muted tracking-widest ml-1">Venue Location</label>
                <input 
                  type="text" 
                  value={formData.venue} 
                  onChange={(e) => setFormData({...formData, venue: e.target.value})}
                  className="input-natural !bg-white/50"
                  placeholder="The Grand Hall"
                />
              </div>
            </div>

            <div className="space-y-2 mb-12">
              <label className="text-[10px] uppercase font-bold text-natural-muted tracking-widest px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>WhatsApp Template</span>
                <span className="text-[9px] opacity-40 font-medium">Use markers: [Name], [Date], [Venue]</span>
              </label>
              <textarea 
                value={formData.whatsappTemplate} 
                onChange={(e) => setFormData({...formData, whatsappTemplate: e.target.value})}
                className="input-natural !bg-white/50 h-44 resize-none leading-relaxed py-6"
                placeholder="Write your invitation message here..."
              />
            </div>

            <button 
              type="submit"
              className="btn-primary w-full group relative overflow-hidden py-6"
            >
              <Save className="w-5 h-5 relative z-10" />
              <span className="relative z-10">{isSaved ? 'Wedding Data Secured' : 'Update Wedding Profile'}</span>
              <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              {isSaved && <Sparkles className="w-4 h-4 text-natural-accent animate-pulse relative z-10" />}
            </button>
          </motion.form>
        </div>

        {/* Right Column: Exports & Support */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-8 border-none shadow-xl flex flex-col gap-6 relative"
          >
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-natural-olive/5 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-xl font-serif font-bold text-natural-olive mb-2">Export Hub</h3>
            <p className="text-xs text-natural-muted leading-relaxed font-medium">Take your guest list with you. Our formats are widely accepted by professional caterers and printing services.</p>
            
            <div className="space-y-4 pt-4">
              <button 
                onClick={exportToCSV}
                disabled={guests.length === 0}
                className="w-full flex items-center gap-5 p-5 bg-natural-sidebar rounded-2xl border border-natural-border/40 hover:border-natural-olive/50 hover:bg-white hover:shadow-lg transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-natural-olive shadow-sm border border-natural-border/30 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-natural-ink">Planning Master</p>
                  <p className="text-[10px] uppercase tracking-widest text-natural-muted font-black opacity-60">Excel / CSV export</p>
                </div>
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
                className="w-full flex items-center gap-5 p-5 bg-natural-sidebar rounded-2xl border border-natural-border/40 hover:border-natural-olive/50 hover:bg-white hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-natural-olive shadow-sm border border-natural-border/30 group-hover:scale-110 transition-transform">
                  <FileJson className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-natural-ink">System Backup</p>
                  <p className="text-[10px] uppercase tracking-widest text-natural-muted font-black opacity-60">JSON data file</p>
                </div>
              </button>
            </div>
          </motion.div>

          {/* Decorative Callout */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="p-10 rounded-[3rem] bg-natural-olive text-white shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute -top-10 -right-10 opacity-10 floating-accent group-hover:opacity-20 transition-opacity">
               <Heart className="w-40 h-40 fill-current" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6">
                <Download className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-2xl font-bold mb-4">Print Ready?</h4>
              <p className="text-sm text-white/70 leading-relaxed font-medium">
                Our export files are optimized for professional card services and mail-merge tools. Perfect for thank you notes.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
