import React, { useState } from 'react';
import { useGuests } from '../context/GuestContext';
import { Download, FileJson, FileSpreadsheet, Bot, Info, Copy, Check, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export function Settings() {
  const { settings, updateSettings, guests, user } = useGuests();
  const [formData, setFormData] = useState(settings);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const webhookUrl = `${window.location.origin}/api/telegram-webhook?ownerId=${user?.uid || ''}`;

  const copyToClipboard = () => {
    if (!webhookUrl || !user) return;
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

              <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex gap-4">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-3">
                  <p className="text-[12px] text-blue-900 leading-relaxed font-medium">
                    To enable Telegram integration and add guests on the go:
                  </p>
                  <ul className="text-[11px] text-blue-800/80 space-y-2 list-decimal list-inside">
                    <li>Open <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-700 font-bold underline decoration-blue-300 underline-offset-2">@BotFather</a> on Telegram.</li>
                    <li>Send <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-700 font-mono">/newbot</code> and follow instructions to get your <strong>API Token</strong>.</li>
                    <li>Paste that token into the <strong>Bot Token</strong> field below and click <strong>Save All Changes</strong>.</li>
                    <li>Click <strong>Activate Webhook</strong> below.</li>
                    <li>Finally, click the <strong>Open Chat</strong> link and send <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-700 font-mono">/start</code> to initialize.</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">Bot Token</label>
                  <button 
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="text-[9px] font-bold text-blue-600 uppercase tracking-tighter hover:underline"
                  >
                    {showToken ? 'Hide' : 'Show Sensitive Token'}
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type={showToken ? "text" : "password"} 
                    value={formData.telegramBotToken || ''} 
                    onChange={(e) => setFormData({...formData, telegramBotToken: e.target.value})}
                    placeholder="e.g. 123456789:ABCdefGHIjkl..."
                    className="w-full bg-natural-sidebar/30 border border-natural-border/50 px-4 py-3 rounded-xl text-xs outline-none focus:border-natural-olive transition-all pr-12"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                    <Bot className={cn("w-4 h-4 transition-colors", formData.telegramBotToken ? "text-blue-500" : "text-natural-border")} />
                  </div>
                </div>
                <p className="text-[9px] text-natural-muted italic">This token grants access to your bot. Keep it secret.</p>
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
                <div className="pt-2 space-y-3">
                  <button 
                    type="button"
                    onClick={async () => {
                      try {
                        // First, save the current form data to ensure the server sees the latest token
                        await updateSettings(formData);
                        
                        if (!user) throw new Error('Not authenticated');
                        const idToken = await user.getIdToken();
                        const res = await fetch('/api/setup-bot', {
                          method: 'POST',
                          headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`
                          },
                          body: JSON.stringify({ ownerId: user.uid })
                        });
                        
                        if (!res.ok) {
                          const errorBody = await res.text();
                          throw new Error(`HTTP ${res.status}: ${errorBody}`);
                        }

                        const data = await res.json();
                        if (data.success) {
                          if (data.botUsername) setBotUsername(data.botUsername);
                          if (data.alreadySet) {
                            alert('✅ Webhook is already correctly set up and active!');
                          } else {
                            alert('✅ Bot linked successfully! Click the link below to start chatting.');
                          }
                        } else {
                          const errorMsg = data.result?.description || data.error || 'Unknown error';
                          if (errorMsg.includes('Too Many Requests')) {
                            alert('⚠️ Telegram Rate Limit: Please wait a minute before trying to reactivate again.');
                          } else {
                            alert('❌ Link failed: ' + errorMsg);
                          }
                        }
                      } catch (err) {
                        console.error('Setup Bot Error:', err);
                        alert(`❌ Error connecting to server: ${err instanceof Error ? err.message : 'Unknown network error'}`);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md"
                  >
                    Activate Webhook Now
                  </button>

                  {botUsername && (
                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col items-center gap-3">
                      <p className="text-[11px] text-emerald-800 font-bold">Step 5: Start your bot</p>
                      <a 
                        href={`https://t.me/${botUsername}?start=linked`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Open @{botUsername}
                      </a>
                      <p className="text-[9px] text-emerald-600 italic">Click the link then press START in Telegram</p>
                    </div>
                  )}
                  {!settings.telegramBotToken && (
                    <p className="text-[9px] text-blue-600 mt-2 font-medium">
                      Note: You must click "Save All Changes" for the bot to start responding.
                    </p>
                  )}
                  <div className="mt-4 pt-4 border-t border-natural-border/30">
                    <a 
                      href="/api/logs" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[9px] text-natural-muted hover:text-natural-ink underline flex items-center gap-1"
                    >
                      View Server Debug Logs (Check for Linking Status)
                    </a>
                  </div>
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
