import React from 'react';
import { useGuests } from '../context/GuestContext';
import { InvitationStatus } from '../types';
import { CheckCircle2, Send, HelpCircle, Users, UserPlus, Tags, Flower, Check, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { View } from '../types';

import { ConnectionStatus } from '../components/ConnectionStatus';

export function Dashboard({ onViewChange }: { onViewChange: (view: View) => void }) {
  const { guests, categories, settings, updateGuest, user, addGuest } = useGuests();

  const [guestSearch, setGuestSearch] = React.useState('');
  const [guestFilterTab, setGuestFilterTab] = React.useState<'all' | 'not_invited' | 'invited'>('all');

  const handleToggleInvited = async (guestId: string, currentStatus: InvitationStatus) => {
    const isCurrentlyInvited = currentStatus === InvitationStatus.INVITED || currentStatus === InvitationStatus.CONFIRMED;
    const newStatus = isCurrentlyInvited ? InvitationStatus.NOT_INVITED : InvitationStatus.INVITED;
    await updateGuest(guestId, { status: newStatus });
  };

  const filteredGuests = guests
    .filter(g => {
      const matchesSearch = g.name.toLowerCase().includes(guestSearch.toLowerCase()) || 
                            (g.phone && g.phone.includes(guestSearch)) ||
                            g.category.toLowerCase().includes(guestSearch.toLowerCase());
      if (!matchesSearch) return false;

      if (guestFilterTab === 'not_invited') {
        return g.status === InvitationStatus.NOT_INVITED;
      }
      if (guestFilterTab === 'invited') {
        return g.status === InvitationStatus.INVITED || g.status === InvitationStatus.CONFIRMED;
      }
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const handleSeedData = async () => {
    if (!user || categories.length === 0) return;
    const sampleGuests = [
      { name: "Sample: John Doe", category: categories[0].name, phone: "1234567890", status: InvitationStatus.CONFIRMED },
      { name: "Sample: Jane Smith", category: categories[0].name, phone: "0987654321", status: InvitationStatus.NOT_INVITED },
      { name: "Sample: Alex Johnson", category: categories[categories.length - 1].name, phone: "5551234567", status: InvitationStatus.INVITED }
    ];
    
    for (const g of sampleGuests) {
      await addGuest(g.name, g.category, g.phone);
    }
    alert("Sample data added! If you don't see it in a few seconds, there may be a connection issue.");
  };

  const totalGuests = guests.length;
  const invitedCount = guests.filter(g => g.status === InvitationStatus.INVITED || g.status === InvitationStatus.CONFIRMED).length;
  const confirmedCount = guests.filter(g => g.status === InvitationStatus.CONFIRMED).length;
  const notInvitedCount = guests.filter(g => g.status === InvitationStatus.NOT_INVITED).length;

  const pendingGuests = guests
    .filter(g => g.status === InvitationStatus.NOT_INVITED)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  const weddingDate = settings.weddingDate ? new Date(settings.weddingDate) : new Date();
  const isValidDate = !isNaN(weddingDate.getTime());
  const today = new Date();
  const diffTime = weddingDate.getTime() - today.getTime();
  const daysRemaining = isValidDate ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;

  const confirmationRate = totalGuests > 0 ? Math.round((confirmedCount / totalGuests) * 100) : 0;
  const invitationRate = totalGuests > 0 ? Math.round((invitedCount / totalGuests) * 100) : 0;

  const stats = [
    { label: 'Total Guests', value: totalGuests, icon: Users, color: 'text-natural-olive', bgColor: 'bg-natural-sidebar' },
    { label: 'Invited', value: invitedCount, icon: Send, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    { label: 'Confirmed', value: confirmedCount, icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { label: 'Not Invited', value: notInvitedCount, icon: HelpCircle, color: 'text-slate-500', bgColor: 'bg-slate-50' },
  ];

  const categoryData = categories.map(cat => ({
    name: cat.name,
    count: guests.filter(g => g.category === cat.name).length
  })).filter(d => d.count > 0);

  const statusData = [
    { name: 'Invited', value: invitedCount, color: '#6366f1' },
    { name: 'Confirmed', value: confirmedCount, color: '#10b981' },
    { name: 'Not Invited', value: notInvitedCount, color: '#94a3b8' },
    { name: 'Not Coming', value: guests.filter(g => g.status === InvitationStatus.NOT_COMING).length, color: '#f43f5e' },
  ].filter(d => d.value > 0);

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
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", duration: 0.5 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto space-y-12 pb-24 px-4"
    >
      <motion.header variants={itemVariants} className="pt-8 space-y-12 text-center">
        <div className="flex flex-col items-center justify-center gap-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-4 bg-natural-olive/5 px-6 py-2 rounded-full border border-natural-olive/10 mb-2">
               <span className="text-[10px] uppercase tracking-[0.5em] font-black text-natural-muted">💌 Wedding RSVP & Guest Planner 💌</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-serif font-black text-natural-ink italic leading-tight">
              {settings.brideName} <span className="text-natural-olive">&</span> {settings.groomName}
            </h2>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-16 bg-natural-olive/20" />
              <p className="text-natural-muted text-[11px] uppercase tracking-[0.5em] font-black opacity-40">The Grand Celebration</p>
              <div className="h-px w-16 bg-natural-olive/20" />
            </div>
          </div>
          
          <div className="relative group w-full max-w-sm">
            <div className="absolute inset-x-0 -bottom-10 h-40 bg-natural-olive/10 rounded-full blur-[100px] opacity-20 pointer-events-none" />
            <div className="relative bg-white border-2 border-natural-border/30 rounded-[3rem] p-10 flex flex-col items-center gap-6 shadow-2xl transition-all duration-700 hover:border-natural-olive/30 hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-2xl bg-natural-sidebar flex items-center justify-center text-natural-olive mb-2">
                <Flower className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-4">
                <p className="text-[11px] uppercase font-black text-natural-muted tracking-[0.4em]">Save the Date 📅</p>
                <p className="text-2xl font-serif font-black text-natural-ink italic">
                  {isValidDate 
                    ? weddingDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : 'Awaiting Date'}
                </p>
                <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-natural-border/20">
                  <div className="text-center">
                    <p className="text-3xl font-serif font-black text-natural-olive italic leading-none">{daysRemaining > 0 ? daysRemaining : 0}</p>
                    <p className="text-[9px] uppercase font-black text-natural-muted tracking-widest mt-2">⏳ Days to go</p>
                  </div>
                  <div className="h-8 w-px bg-natural-border/30" />
                  <div className="text-center">
                    <p className="text-3xl font-serif font-bold text-natural-ink italic leading-none">{totalGuests}</p>
                    <p className="text-[9px] uppercase font-black text-natural-muted tracking-widest mt-2">👥 Total Guests</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-natural-border/60 shadow-sm space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-natural-olive/5 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
            <div className="flex justify-between items-end relative z-10">
              <div>
                <p className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em]">Sent Invitations ✉️</p>
                <h4 className="text-3xl font-serif font-bold text-natural-ink mt-2 italic">{invitedCount} <span className="text-sm font-sans font-normal text-natural-muted/50 not-italic">/ {totalGuests} guests</span></h4>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-natural-olive bg-natural-olive/5 px-3 py-1 rounded-full">{invitationRate}% Sent</span>
              </div>
            </div>
            <div className="h-2 bg-natural-sidebar/50 rounded-full overflow-hidden relative z-10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${invitationRate}%` }}
                className="h-full bg-natural-olive/40 rounded-full"
              />
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-[2.5rem] border border-natural-border/60 shadow-sm space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
            <div className="flex justify-between items-end relative z-10">
              <div>
                <p className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em]">Confirmed Guests 🎉</p>
                <h4 className="text-3xl font-serif font-bold text-natural-ink mt-2 italic">{confirmedCount} <span className="text-sm font-sans font-normal text-natural-muted/50 not-italic">/ {totalGuests} guests</span></h4>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{confirmationRate}% Confirmed</span>
              </div>
            </div>
            <div className="h-2 bg-natural-sidebar/50 rounded-full overflow-hidden relative z-10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${confirmationRate}%` }}
                className="h-full bg-emerald-500/30 rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Stats Grid */}
      <motion.section variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            whileHover={{ y: -8, scale: 1.02 }}
            className="bg-white p-8 rounded-[2rem] border border-natural-border/60 shadow-sm hover:shadow-xl hover:border-natural-olive/20 transition-all duration-300 relative overflow-hidden"
          >
            <div className={`p-3 rounded-2xl w-fit ${stat.bgColor} ${stat.color} mb-6 shadow-inner`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-natural-muted uppercase tracking-[0.2em]">{stat.label}</p>
            <h3 className="text-4xl font-serif font-bold text-natural-ink mt-2 italic">{stat.value}</h3>
          </motion.div>
        ))}
      </motion.section>

      {/* Quick Actions */}
      <motion.section variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => onViewChange('add')}
          className="flex items-center gap-3 p-4 bg-natural-olive text-white rounded-2xl hover:bg-natural-ink transition-all shadow-sm hover:shadow-md group"
        >
          <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
            <UserPlus className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Add Guest</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => onViewChange('guests')}
          className="flex items-center gap-3 p-4 bg-white border border-natural-border text-natural-olive rounded-2xl hover:border-natural-olive transition-all shadow-sm group"
        >
          <div className="bg-natural-sidebar p-2 rounded-xl group-hover:scale-110 transition-transform">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-natural-ink">View All</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => onViewChange('categories')}
          className="flex items-center gap-3 p-4 bg-white border border-natural-border text-natural-olive rounded-2xl hover:border-natural-olive transition-all shadow-sm group"
        >
          <div className="bg-natural-sidebar p-2 rounded-xl group-hover:scale-110 transition-transform">
            <Tags className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-natural-ink">Categories</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => onViewChange('invite')}
          className="flex items-center gap-3 p-4 bg-white border border-natural-border text-emerald-600 rounded-2xl hover:border-emerald-600 transition-all shadow-sm group"
        >
          <div className="bg-emerald-50 p-2 rounded-xl group-hover:scale-110 transition-transform">
            <Send className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-natural-ink">Invite Station</span>
        </motion.button>
      </motion.section>

      {/* Comprehensive Quick Invitation Tracker Checklist */}
      <motion.section variants={itemVariants} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-natural-border/60 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-serif font-bold text-natural-ink flex items-center gap-2">📋 Invitation Checklist</h3>
            <p className="text-[10px] text-natural-muted uppercase tracking-widest font-black mt-1">Tap the circle to mark any guest as invited instantly!</p>
          </div>
          <button 
            onClick={() => onViewChange('checklist')}
            className="text-[10px] font-bold uppercase underline tracking-widest text-natural-olive hover:text-natural-ink transition-colors self-start md:self-auto"
          >
            Open Fullscreen Checklist ➔
          </button>
        </div>

        {/* Search and Tab Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="🔍 Search guests by name or category..."
              value={guestSearch}
              onChange={(e) => setGuestSearch(e.target.value)}
              className="w-full bg-natural-sidebar/40 border border-natural-border/30 pl-11 pr-4 py-3 rounded-2xl text-xs outline-none focus:ring-4 focus:ring-natural-olive/5 focus:bg-white focus:border-natural-olive transition-all text-natural-ink"
            />
          </div>
          
          <div className="flex bg-natural-sidebar/40 p-1 rounded-2xl border border-natural-border/20 self-start sm:self-auto">
            <button
              onClick={() => setGuestFilterTab('all')}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                guestFilterTab === 'all' 
                  ? 'bg-white text-natural-ink shadow-sm' 
                  : 'text-natural-muted hover:text-natural-ink'
              }`}
            >
              All ({guests.length})
            </button>
            <button
              onClick={() => setGuestFilterTab('not_invited')}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                guestFilterTab === 'not_invited' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-natural-muted hover:text-natural-ink'
              }`}
            >
              Pending ({guests.filter(g => g.status === InvitationStatus.NOT_INVITED).length})
            </button>
            <button
              onClick={() => setGuestFilterTab('invited')}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                guestFilterTab === 'invited' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-natural-muted hover:text-natural-ink'
              }`}
            >
              Invited ({guests.filter(g => g.status === InvitationStatus.INVITED || g.status === InvitationStatus.CONFIRMED).length})
            </button>
          </div>
        </div>

        {/* Scrollable Guest Checklist Grid */}
        <div className="max-h-96 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
          {filteredGuests.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredGuests.map((guest) => {
                const isInvited = guest.status === InvitationStatus.INVITED || guest.status === InvitationStatus.CONFIRMED;
                return (
                  <div 
                    key={guest.id} 
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                      isInvited 
                        ? 'bg-emerald-50/10 border-emerald-100/55 hover:bg-emerald-50/20' 
                        : 'bg-natural-sidebar/20 border-natural-border/30 hover:bg-white hover:border-natural-olive/20 hover:shadow-sm'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-sm font-bold truncate ${isInvited ? 'text-slate-700' : 'text-natural-ink'}`}>
                          {guest.name}
                        </h4>
                        <span className="shrink-0 text-[8px] font-black uppercase tracking-wider text-natural-muted/70 bg-white/80 border border-slate-100 px-1.5 py-0.5 rounded">
                          {guest.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-natural-muted mt-0.5 truncate">
                        {guest.phone ? `📞 ${guest.phone}` : 'No phone number'}
                      </p>
                    </div>

                    {/* Simple Round Checkbox / Satisfying circular click toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleInvited(guest.id, guest.status)}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0 ${
                        isInvited 
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10 hover:bg-emerald-600 hover:border-emerald-600 scale-105' 
                          : 'border-slate-300 bg-slate-50 text-transparent hover:border-emerald-500 hover:text-emerald-500 hover:bg-white'
                      }`}
                      title={isInvited ? "Mark as Not Invited" : "Mark as Invited"}
                    >
                      <Check className={`w-5 h-5 stroke-[4.5px] transition-transform duration-200 ${isInvited ? 'scale-110' : 'scale-0 hover:scale-100 hover:text-slate-400'}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-natural-muted italic text-xs bg-natural-sidebar/10 rounded-2xl border border-dashed border-natural-border/60">
              {guests.length === 0 
                ? "Add some guests to get started! Click 'Add Guest' above 🚀" 
                : "No guests found matching your filter or search criteria."}
            </div>
          )}
        </div>
      </motion.section>

      {/* Analytics Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-natural-border/60 shadow-sm relative overflow-hidden group">
          <div>
            <h3 className="text-2xl font-serif font-bold text-natural-ink italic">Guest Groups</h3>
            <p className="text-[10px] text-natural-muted uppercase tracking-[0.3em] font-bold mt-2 opacity-60">Guests by category</p>
          </div>
          
          <div className="h-72 w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <XAxis 
                    dataKey="name" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{fill: '#8e8e7a', fontWeight: '600'}}
                    dy={12}
                  />
                  <Tooltip 
                    cursor={{fill: '#fcfaf8', radius: 8}}
                    contentStyle={{
                      borderRadius: '20px', 
                      border: '1px solid #e8e2d9', 
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', 
                      fontSize: '11px',
                      padding: '12px 16px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#c5a059" 
                    radius={[10, 10, 2, 2]} 
                    barSize={24}
                    animationBegin={500}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-natural-muted italic text-sm bg-natural-sidebar/10 rounded-[2rem] border border-dashed border-natural-border/60">
                Awaiting guest entry...
              </div>
            )}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-natural-border/60 shadow-sm relative overflow-hidden">
          <div>
            <h3 className="text-2xl font-serif font-bold text-natural-ink italic">RSVP Progress</h3>
            <p className="text-[10px] text-natural-muted uppercase tracking-[0.3em] font-bold mt-2 opacity-60">Track your wedding responses</p>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="h-64 w-full lg:w-1/2 flex items-center justify-center relative">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-[8px] uppercase font-bold text-natural-muted tracking-widest">RSVPs</p>
                  <p className="text-xl font-serif font-bold text-natural-ink">{confirmedCount}</p>
                </div>
              </div>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={10}
                      dataKey="value"
                      stroke="none"
                      animationBegin={800}
                      animationDuration={1500}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        borderRadius: '20px', 
                        border: '1px solid #e8e2d9', 
                        fontSize: '11px',
                        padding: '12px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-natural-muted italic text-sm bg-natural-sidebar/10 rounded-[2rem] border border-dashed border-natural-border/60">
                  No statuses yet.
                </div>
              )}
            </div>
            
            <div className="w-full lg:w-1/2 space-y-3">
              {statusData.map((s, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + idx * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-natural-sidebar/30 border border-natural-border/20 group hover:border-natural-olive/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full ring-4 ring-white shadow-sm" style={{ backgroundColor: s.color }} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-natural-muted group-hover:text-natural-ink transition-colors">{s.name}</span>
                  </div>
                  <span className="text-lg font-serif font-bold text-natural-ink italic">{s.value}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      {/* Activity and Breakdown SECTION ENDS */}
      
      {totalGuests === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl border border-natural-border/60 shadow-sm flex flex-col items-center text-center space-y-6"
        >
          <div className="bg-natural-sidebar/50 p-4 rounded-full">
            <Users className="w-8 h-8 text-natural-muted" />
          </div>
          <div className="max-w-md">
            <h3 className="text-xl font-serif font-bold text-natural-ink mb-2">No guest data found</h3>
            <p className="text-sm text-natural-muted leading-relaxed">
              We couldn't find any guests associated with your account. This could be because your list is empty, 
              or there's a connection delay.
            </p>
          </div>
          
          <div className="pt-4 flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button 
              onClick={() => onViewChange('add')}
              className="px-8 py-3 bg-natural-olive text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-natural-ink transition-all"
            >
              Add First Guest
            </button>
            <button 
              onClick={handleSeedData}
              className="px-8 py-3 bg-white border border-natural-border text-natural-ink rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-natural-sidebar transition-all"
            >
              Seed Sample Data
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-natural-border/50 w-full text-left">
            <h4 className="text-[10px] uppercase font-bold tracking-widest text-natural-muted mb-4">Diagnostics</h4>
            <div className="bg-natural-sidebar/30 rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-ellipsis">
                <span className="text-natural-muted">UID:</span> {user?.uid || 'Not logged in'}
              </p>
              <p className="text-[10px] font-mono">
                <span className="text-natural-muted">Path:</span> users/{user?.uid || '...'}/guests
              </p>
              <div className="text-[10px] font-mono flex items-center gap-2">
                <span className="text-natural-muted">Status:</span> 
                <div className="flex-1 h-px bg-natural-border/20 mx-2" />
                <ConnectionStatus />
              </div>
              <div className="pt-2 flex gap-2">
                <button 
                  onClick={() => {
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then(regs => {
                        for(const reg of regs) reg.unregister();
                        window.location.reload();
                      });
                    } else {
                      window.location.reload();
                    }
                  }}
                  className="text-[9px] font-bold text-natural-olive underline"
                >
                  Clear Cache & Reload
                </button>
                <span className="text-natural-border/30">|</span>
                <button 
                  onClick={() => window.location.reload()}
                  className="text-[9px] font-bold text-natural-olive underline"
                >
                  Hard Refresh
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
