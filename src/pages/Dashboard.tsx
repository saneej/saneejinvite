import React from 'react';
import { useGuests } from '../context/GuestContext';
import { InvitationStatus } from '../types';
import { CheckCircle2, Send, HelpCircle, Users } from 'lucide-react';
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

export function Dashboard() {
  const { guests, categories, settings, updateGuest } = useGuests();

  const totalGuests = guests.length;
  const invitedCount = guests.filter(g => g.status === InvitationStatus.INVITED || g.status === InvitationStatus.CONFIRMED).length;
  const confirmedCount = guests.filter(g => g.status === InvitationStatus.CONFIRMED).length;
  const notInvitedCount = guests.filter(g => g.status === InvitationStatus.NOT_INVITED).length;

  const pendingGuests = guests
    .filter(g => g.status === InvitationStatus.NOT_INVITED)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

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
      <header className="pt-4 border-b border-natural-border/50 pb-8">
        <h2 className="text-3xl font-serif font-bold text-natural-ink">
          {settings.brideName} & {settings.groomName}'s Celebration
        </h2>
        <p className="text-natural-muted text-[10px] uppercase tracking-[0.2em] font-medium mt-1">Reflecting on your journey together</p>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            className="bg-white p-6 rounded-2xl border border-natural-border/60 shadow-sm hover:border-natural-olive transition-all"
          >
            <div className={`p-2 rounded-lg w-fit ${stat.bgColor} ${stat.color} mb-4`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-[9px] font-bold text-natural-muted uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-serif font-bold text-natural-ink mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </section>

      {/* Quick Action: Pending Invitations */}
      {pendingGuests.length > 0 && (
        <section className="bg-white p-6 rounded-2xl border border-natural-border/60 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-serif font-bold text-natural-ink">Quick Invite</h3>
              <p className="text-[10px] text-natural-muted uppercase tracking-widest">Recently added, not yet invited</p>
            </div>
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
    </div>
  );
}
