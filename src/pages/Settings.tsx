import React, { useState } from 'react';
import { useGuests } from '../context/GuestContext';
import { 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  Upload, 
  AlertTriangle, 
  Users, 
  UserPlus, 
  Trash2, 
  Mail,
  Check,
  ChevronDown
} from 'lucide-react';
import { motion } from 'motion/react';

export function Settings() {
  const { 
    settings, 
    updateSettings, 
    guests, 
    categories, 
    restoreBackup,
    collaborators,
    addCollaborator,
    removeCollaborator 
  } = useGuests();
  const [formData, setFormData] = useState(settings);
  const [collabEmail, setCollabEmail] = useState('');
  const [collabName, setCollabName] = useState('');
  const [collabRole, setCollabRole] = useState('Family');
  // ... rest of state
  const [isSaved, setIsSaved] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const handleBackup = () => {
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        guests,
        categories,
        settings
      }
    };
    
    const json = JSON.stringify(backupData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `wedding_full_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("Are you sure you want to restore data from this backup? This will add guests/categories and update your settings.")) {
      e.target.value = '';
      return;
    }

    setIsRestoring(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const backupData = JSON.parse(content);
          
          if (!backupData.data) {
            // Check if it's an old guest-only backup
            if (Array.isArray(backupData)) {
              await restoreBackup({ data: { guests: backupData } });
            } else {
              throw new Error("Invalid backup file format");
            }
          } else {
            await restoreBackup(backupData);
          }
          
          alert("Backup restored successfully!");
          window.location.reload();
        } catch (err) {
          console.error("Restore error:", err);
          alert("Failed to restore backup. Please ensure the file is a valid JSON backup.");
        } finally {
          setIsRestoring(false);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      console.error(err);
      setIsRestoring(false);
    }
  };

  const handleAddCollab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabEmail || !collabName) return;
    await addCollaborator(collabEmail, collabName, collabRole);
    setCollabEmail('');
    setCollabName('');
    alert(`Invitation sent to ${collabEmail} (Note: They must sign in with this email)`);
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
      className="max-w-6xl mx-auto space-y-8 pb-24 px-4"
    >
      <motion.header variants={itemVariants} className="pt-4 border-b border-natural-border/50 pb-8">
        <h2 className="text-3xl font-serif font-bold text-natural-ink">Settings</h2>
        <p className="text-natural-muted text-[10px] uppercase tracking-[0.2em] font-medium mt-1">Update your wedding info</p>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.form 
            variants={itemVariants}
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
                  <span>AI Message Tone</span>
                  <span className="opacity-50 lowercase tracking-normal">e.g. Respectful, friendly, formal</span>
                </label>
                <textarea 
                  value={formData.invitationTone} 
                  onChange={(e) => setFormData({...formData, invitationTone: e.target.value})}
                  placeholder="e.g. Kind and respectful"
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
          </motion.form>

          {/* Collaborators Management */}
          <motion.div
            variants={itemVariants}
            className="bg-white p-8 rounded-2xl border border-natural-border/60 shadow-sm space-y-8"
          >
            <div className="flex items-center gap-3">
              <div className="bg-natural-sidebar p-2 rounded-xl">
                <Users className="w-5 h-5 text-natural-olive" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-natural-ink">Helpers</h3>
                <p className="text-[9px] text-natural-muted uppercase font-bold tracking-widest">Add family members to help you</p>
              </div>
            </div>

            <form onSubmit={handleAddCollab} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-natural-sidebar/20 p-6 rounded-2xl border border-natural-border/30">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-natural-muted">Name</label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-natural-muted" />
                  <input 
                    type="text"
                    required
                    value={collabName}
                    onChange={(e) => setCollabName(e.target.value)}
                    placeholder="e.g. Dad"
                    className="w-full bg-white border border-natural-border/40 pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none focus:border-natural-olive"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-natural-muted">Gmail Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-natural-muted" />
                  <input 
                    type="email"
                    required
                    value={collabEmail}
                    onChange={(e) => setCollabEmail(e.target.value)}
                    placeholder="gmail@example.com"
                    className="w-full bg-white border border-natural-border/40 pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none focus:border-natural-olive"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-natural-muted">Role</label>
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <select
                      value={collabRole}
                      onChange={(e) => setCollabRole(e.target.value)}
                      className="custom-select w-full h-11 pr-10 appearance-none text-[10px] uppercase font-black tracking-widest"
                    >
                      <option value="Family">Family</option>
                      <option value="Editor">Editor</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-natural-olive pointer-events-none group-hover:translate-y-[-40%] transition-transform" />
                  </div>
                  <button 
                    type="submit"
                    className="bg-natural-olive text-white px-6 rounded-xl hover:bg-natural-ink transition-colors font-bold text-[10px] uppercase tracking-widest"
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-3">
              <h4 className="text-[10px] uppercase font-bold text-natural-muted px-1">Current Helpers</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {collaborators.length === 0 ? (
                  <p className="text-[11px] text-natural-muted font-medium py-8 text-center bg-natural-sidebar/10 rounded-xl border border-dashed border-natural-border/40 col-span-2">
                    No helpers added yet.
                  </p>
                ) : (
                  collaborators.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-white border border-natural-border/40 rounded-xl shadow-sm group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-natural-sidebar flex items-center justify-center text-natural-olive font-serif font-bold text-xs uppercase">
                          {c.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-natural-ink">{c.name}</p>
                          <p className="text-[9px] text-natural-muted">{c.email} • {c.role}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          if (confirm(`Remove ${c.name}?`)) removeCollaborator(c.id);
                        }}
                        className="p-1.5 opacity-0 group-hover:opacity-100 text-natural-muted hover:text-rose-500 transition-all hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="space-y-6">
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
                onClick={handleBackup}
                className="w-full flex items-center justify-between p-4 bg-natural-sidebar/30 border border-natural-border/50 rounded-xl hover:bg-natural-sidebar transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileJson className="w-4 h-4 text-blue-600" />
                  <div className="text-left">
                    <span className="text-xs font-bold text-natural-ink block">Full Backup (JSON)</span>
                    <span className="text-[9px] text-natural-muted uppercase">Guests, Categories & Settings</span>
                  </div>
                </div>
                <Download className="w-3 h-3 text-natural-muted" />
              </button>

              <div className="relative">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleRestore}
                  accept=".json"
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRestoring}
                  className="w-full flex items-center justify-between p-4 bg-natural-sidebar/30 border border-natural-border/50 rounded-xl hover:bg-natural-sidebar transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <Upload className="w-4 h-4 text-amber-600" />
                    <div className="text-left">
                      <span className="text-xs font-bold text-natural-ink block">
                        {isRestoring ? 'Restoring...' : 'Restore Backup'}
                      </span>
                      <span className="text-[9px] text-natural-muted uppercase">Upload saved JSON file</span>
                    </div>
                  </div>
                  <Check className="w-3 h-3 text-natural-muted opacity-0" />
                </button>
              </div>

              <div className="p-4 bg-natural-sidebar/20 rounded-xl border border-natural-border/30 flex gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-[10px] text-natural-muted leading-relaxed">
                  Restoring will <span className="font-bold text-natural-ink">merge</span> guests and categories. New items will be added, but existing ones won't be deleted. Settings will be <span className="font-bold text-natural-ink">overwritten</span>.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
