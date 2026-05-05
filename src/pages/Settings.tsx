import React, { useState } from 'react';
import { useGuests } from '../context/GuestContext';
import { Download, FileJson, FileSpreadsheet, Bot, Info, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';

export function Settings() {
  const { settings, updateSettings, guests } = useGuests();
  const [formData, setFormData] = useState(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const webhookUrl = `${window.location.origin}/api/telegram-webhook?ownerId=${auth.currentUser?.uid || ''}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted flex justify-between">
                  <span>Greeting Message</span>
                  <span className="opacity-50 lowercase tracking-normal">Markers: [Name]</span>
                </label>
                <input 
                  type="text" 
                  value={formData.greetingMessage} 
                  onChange={(e) => setFormData({...formData, greetingMessage: e.target.value})}
                  placeholder="Assalamu alaikum [Name]!"
                  className="w-full bg-natural-sidebar/30 border border-natural-border/50 px-4 py-3 rounded-xl text-sm outline-none focus:border-natural-olive transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted flex justify-between">
                  <span>WhatsApp Invitation Template</span>
                  <span className="opacity-50 lowercase tracking-normal">Markers: [Name], [Date], [Venue]</span>
                </label>
                <textarea 
                  value={formData.whatsappTemplate} 
                  onChange={(e) => setFormData({...formData, whatsappTemplate: e.target.value})}
                  className="w-full bg-natural-sidebar/30 border border-natural-border/50 px-4 py-4 rounded-xl text-sm outline-none focus:border-natural-olive transition-all h-32 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted flex justify-between">
                  <span>AI Invitation Tone</span>
                  <span className="opacity-50 lowercase tracking-normal">Describe your desired tone for AI messages</span>
                </label>
                <textarea 
                  value={formData.invitationTone} 
                  onChange={(e) => setFormData({...formData, invitationTone: e.target.value})}
                  placeholder="e.g., Warm, respectful, traditional with elegance."
                  className="w-full bg-natural-sidebar/30 border border-natural-border/50 px-4 py-4 rounded-xl text-sm outline-none focus:border-natural-olive transition-all h-24 resize-none"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-natural-olive text-white py-4 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-natural-ink transition-colors shadow-sm"
            >
              {isSaved ? 'Settings Saved' : 'Save All Changes'}
            </button>

            {/* Telegram Bot Integration - NOW INSIDE FORM */}
            <div className="pt-8 border-t border-natural-border/50 space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-xl">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-natural-ink">Telegram Bot Integration</h3>
                  <p className="text-[9px] text-natural-muted uppercase font-bold tracking-widest">Add guests via Telegram</p>
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex gap-3">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-[11px] text-blue-900 leading-relaxed">
                    1. Create a bot using <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="font-bold underline">@BotFather</a>.<br />
                    2. Paste the <strong>Bot Token</strong> below.<br />
                    3. Click <strong>Save All Changes</strong>.<br />
                    4. Click <strong>Activate Webhook Now</strong> to link them.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">Bot Token</label>
                <input 
                  type="text" 
                  value={formData.telegramBotToken || ''} 
                  onChange={(e) => setFormData({...formData, telegramBotToken: e.target.value})}
                  placeholder="Paste your bot token (e.g. 123456:ABC...)"
                  className="w-full bg-natural-sidebar/30 border border-natural-border/50 px-4 py-3 rounded-xl text-xs outline-none focus:border-natural-olive transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">Your Webhook URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={webhookUrl}
                    className="flex-1 bg-natural-sidebar/30 border border-natural-border/50 px-4 py-3 rounded-xl text-[10px] font-mono outline-none"
                  />
                  <button 
                    type="button"
                    onClick={copyToClipboard}
                    className="px-4 bg-natural-sidebar border border-natural-border/50 rounded-xl hover:bg-natural-border/20 transition-all"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-natural-muted" />}
                  </button>
                </div>
                <p className="text-[9px] text-natural-muted italic">This URL is unique to your account.</p>
              </div>

              {formData.telegramBotToken && (
                <div className="pt-2">
                  <a 
                    href={`https://api.telegram.org/bot${formData.telegramBotToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md"
                  >
                    Activate Webhook Now
                  </a>
                  {!settings.telegramBotToken && <p className="text-[9px] text-blue-600 mt-2 font-medium">Note: You must click "Save All Changes" for the bot to start responding.</p>}
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-natural-sidebar/20 rounded-xl border border-natural-border/30">
                <div>
                  <p className="text-xs font-bold text-natural-ink">Enable Telegram Integration</p>
                  <p className="text-[9px] text-natural-muted uppercase tracking-wider">Allow bot to add guests</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newSettings = { ...formData, telegramEnabled: !formData.telegramEnabled };
                    setFormData(newSettings);
                    updateSettings(newSettings);
                  }}
                  className={cn(
                    "w-12 h-6 rounded-full p-1 transition-all",
                    formData.telegramEnabled ? "bg-natural-olive" : "bg-natural-border"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    formData.telegramEnabled ? "translate-x-6" : "translate-x-0"
                  )} />
                </button>
              </div>
            </div>
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
