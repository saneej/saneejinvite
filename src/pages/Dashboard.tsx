import React from 'react';
import { useGuests } from '../context/GuestContext';
import { InvitationStatus } from '../types';
import { CheckCircle2, Send, HelpCircle, Users, UserPlus, Tags } from 'lucide-react';
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
    { label: 'Total Guests', value: totalGuests, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Invited', value: invitedCount, icon: Send, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { label: 'Confirmed', value: confirmedCount, icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Not Invited', value: notInvitedCount, icon: HelpCircle, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  ];

  const categoryData = categories.map(cat => ({
    name: cat.name,
    count: guests.filter(g => g.category === cat.name).length
  })).filter(d => d.count > 0);

  const statusData = [
    { name: 'Invited', value: invitedCount, color: '#9333ea' },
    { name: 'Confirmed', value: confirmedCount, color: '#16a34a' },
    { name: 'Not Invited', value: notInvitedCount, color: '#ea580c' },
    { name: 'Not Coming', value: guests.filter(g => g.status === InvitationStatus.NOT_COMING).length, color: '#dc2626' },
  ].filter(d => d.value > 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
      <header className="pt-4 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-3xl font-serif font-bold text-natural-ink">
                {settings.brideName} & {settings.groomName}'s Celebration
              </h2>
              <p className="text-natural-muted text-[10px] uppercase tracking-[0.2em] font-medium mt-1">Reflecting on your journey together</p>
            </div>
            <ConnectionStatus />
          </div>
          <div className="bg-natural-olive/10 border border-natural-olive/20 rounded-2xl p-4 flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-natural-olive tracking-widest leading-none">Wedding Day</p>
              <p className="text-sm font-serif font-bold text-natural-ink mt-1">
                {isValidDate 
                  ? weddingDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : 'Date not set'}
              </p>
            </div>
            <div className="h-10 w-[1px] bg-natural-olive/20" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-serif font-bold text-natural-olive leading-none">{daysRemaining > 0 ? daysRemaining : 0}</span>
              <span className="text-[8px] uppercase font-bold text-natural-olive/60 tracking-tighter">Days Left</span>
            </div>
          </div>
        </div>

        {/* Progress Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-natural-border/60 shadow-sm space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[9px] font-bold text-natural-muted uppercase tracking-widest">Invitation Sent</p>
                <h4 className="text-xl font-serif font-bold text-natural-ink mt-1">{invitedCount} / {totalGuests}</h4>
              </div>
              <span className="text-xs font-bold text-natural-olive bg-natural-sidebar px-2 py-1 rounded-lg">{invitationRate}%</span>
            </div>
            <div className="h-2 bg-natural-sidebar rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${invitationRate}%` }}
                className="h-full bg-natural-olive/40"
              />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-natural-border/60 shadow-sm space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[9px] font-bold text-natural-muted uppercase tracking-widest">Confirmed RSVPs</p>
                <h4 className="text-xl font-serif font-bold text-natural-ink mt-1">{confirmedCount} / {totalGuests}</h4>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{confirmationRate}%</span>
            </div>
            <div className="h-2 bg-natural-sidebar rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${confirmationRate}%` }}
                className="h-full bg-emerald-500/40"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl border border-natural-border/60 shadow-sm hover:border-natural-olive transition-all cursor-default"
          >
            <div className={`p-2 rounded-lg w-fit ${stat.bgColor} ${stat.color} mb-4`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-[9px] font-bold text-natural-muted uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-serif font-bold text-natural-ink mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button 
          onClick={() => onViewChange('add')}
          className="flex items-center gap-3 p-4 bg-natural-olive text-white rounded-2xl hover:bg-natural-ink transition-all shadow-sm hover:shadow-md group"
        >
          <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
            <UserPlus className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Add Guest</span>
        </button>
        <button 
          onClick={() => onViewChange('guests')}
          className="flex items-center gap-3 p-4 bg-white border border-natural-border text-natural-olive rounded-2xl hover:border-natural-olive transition-all shadow-sm group"
        >
          <div className="bg-natural-sidebar p-2 rounded-xl group-hover:scale-110 transition-transform">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-natural-ink">View All</span>
        </button>
        <button 
          onClick={() => onViewChange('categories')}
          className="flex items-center gap-3 p-4 bg-white border border-natural-border text-natural-olive rounded-2xl hover:border-natural-olive transition-all shadow-sm group"
        >
          <div className="bg-natural-sidebar p-2 rounded-xl group-hover:scale-110 transition-transform">
            <Tags className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-natural-ink">Categories</span>
        </button>
        <button 
          onClick={() => onViewChange('invite')}
          className="flex items-center gap-3 p-4 bg-white border border-natural-border text-emerald-600 rounded-2xl hover:border-emerald-600 transition-all shadow-sm group"
        >
          <div className="bg-emerald-50 p-2 rounded-xl group-hover:scale-110 transition-transform">
            <Send className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-natural-ink">Invite Station</span>
        </button>
      </section>

      {/* Quick Action: Pending Invitations */}
      {pendingGuests.length > 0 && (
        <section className="bg-white p-6 rounded-2xl border border-natural-border/60 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-serif font-bold text-natural-ink">Quick Invite</h3>
              <p className="text-[10px] text-natural-muted uppercase tracking-widest">Recently added, not yet invited</p>
            </div>
            <button 
              onClick={() => onViewChange('invite')}
              className="text-[10px] font-bold uppercase underline tracking-widest text-natural-olive hover:text-natural-ink transition-colors"
            >
              Open Invite Station
            </button>
          </div>
          <div className="space-y-3">
            {pendingGuests.map((guest) => (
              <div key={guest.id} className="flex items-center justify-between p-3 rounded-xl bg-natural-sidebar/30 border border-natural-border/40">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-natural-ink truncate">{guest.name}</h4>
                  <p className="text-[9px] uppercase tracking-wider text-natural-muted font-medium">{guest.category}</p>
                </div>
                <button
                  onClick={() => updateGuest(guest.id, { status: InvitationStatus.INVITED })}
                  className="bg-natural-olive text-white px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-natural-ink transition-colors flex items-center gap-2"
                >
                  <Send className="w-3 h-3" />
                  Mark Invited
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <div className="bg-white p-8 rounded-2xl border border-natural-border/60 shadow-sm">
          <div className="mb-8">
            <h3 className="text-lg font-serif font-bold text-natural-ink">By Category</h3>
            <p className="text-[10px] text-natural-muted uppercase tracking-widest">Grouping your loved ones</p>
          </div>
          
          <div className="h-64 w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} tick={{fill: '#8e8e7a', fontWeight: 'bold'}} />
                  <Tooltip 
                    cursor={{fill: '#fcfaf8'}}
                    contentStyle={{borderRadius: '12px', border: '1px solid #e5e5d5', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '10px'}}
                  />
                  <Bar dataKey="count" fill="#5a5a40" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-natural-muted italic text-xs bg-natural-sidebar/20 rounded-xl border border-dashed border-natural-border">
                No guest data recorded.
              </div>
            )}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white p-8 rounded-2xl border border-natural-border/60 shadow-sm">
          <div className="mb-8">
            <h3 className="text-lg font-serif font-bold text-natural-ink">Invitation Flow</h3>
            <p className="text-[10px] text-natural-muted uppercase tracking-widest">Progression overview</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="h-56 w-full sm:w-1/2 flex items-center justify-center">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #e5e5d5', fontSize: '10px'}} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-natural-muted italic text-xs bg-natural-sidebar/20 rounded-xl border border-dashed border-natural-border">
                  No statuses.
                </div>
              )}
            </div>
            
            <div className="w-full sm:w-1/2 space-y-2">
              {statusData.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-natural-sidebar/30 border border-natural-border/40">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-natural-muted">{s.name}</span>
                  </div>
                  <span className="text-sm font-serif font-bold text-natural-ink">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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
                        for(let reg of regs) reg.unregister();
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
    </div>
  );
}
