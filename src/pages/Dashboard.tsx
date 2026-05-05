import React from 'react';
import { useGuests } from '../context/GuestContext';
import { InvitationStatus } from '../types';
import { CheckCircle2, Send, HelpCircle, Users, Heart, Sparkles } from 'lucide-react';
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
  const { guests, categories, addGuest, settings } = useGuests();

  const totalGuests = guests.length;
  const invitedCount = guests.filter(g => g.status === InvitationStatus.INVITED || g.status === InvitationStatus.CONFIRMED).length;
  const confirmedCount = guests.filter(g => g.status === InvitationStatus.CONFIRMED).length;
  const notInvitedCount = guests.filter(g => g.status === InvitationStatus.NOT_INVITED).length;

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
    <div className="space-y-12 pb-20 md:pb-0 color-overlap min-h-screen">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-natural-accent/10 rounded-full blur-[100px] -z-10 animate-pulse pointer-events-none" />
      
      <header className="relative pt-6">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           className="relative inline-block"
        >
          <div className="absolute -top-6 -left-6 w-16 h-16 bg-natural-accent/40 rounded-full blur-xl floating-accent" />
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-natural-olive relative z-10 leading-tight">
            Planning {settings.brideName} & {settings.groomName}'s Day
          </h2>
          <div className="mt-4 flex items-center gap-3">
            <span className="h-[1px] w-12 bg-natural-muted/30" />
            <p className="text-natural-muted font-sans text-xs uppercase tracking-[0.3em] font-bold">The Celebration Overview</p>
          </div>
        </motion.div>
      </header>

      {/* Hero Stats Section with Overlapping Visuals */}
      <section className="relative">
        <div className="absolute inset-0 bg-natural-olive rounded-[3rem] translate-x-2 translate-y-2 opacity-5 pointer-events-none" />
        <div className="relative glass-card p-4 md:p-10 border-none shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
            
            <div className="lg:col-span-2 space-y-6">
              <div className="w-16 h-16 bg-natural-olive text-white rounded-2xl flex items-center justify-center shadow-inner floating-accent">
                <Heart className="w-8 h-8 fill-current" />
              </div>
              <h3 className="text-2xl font-serif font-bold">Quick Invitation Entry</h3>
              <p className="text-natural-muted text-sm leading-relaxed">
                Add family, friends, or colleagues to your guest list in seconds. Our smart manager keeps everything organized by category.
              </p>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const name = formData.get('name') as string;
                  const cat = formData.get('category') as string;
                  if (name && cat) {
                    addGuest({ name, category: cat, status: InvitationStatus.NOT_INVITED });
                    (e.target as HTMLFormElement).reset();
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input 
                    name="name"
                    required
                    placeholder="Guest Name"
                    className="input-natural !bg-white/50"
                  />
                  <select 
                    name="category"
                    className="input-natural !bg-white/50 appearance-none cursor-pointer"
                  >
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn-primary w-full group overflow-hidden relative">
                  <span className="relative z-10">Add Guest</span>
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <Sparkles className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="lg:col-span-3 grid grid-cols-2 gap-4 md:gap-6">
              {stats.map((stat, idx) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  key={stat.label}
                  className="p-6 rounded-[2rem] bg-white shadow-inner border border-natural-border/30 hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  <div className={`p-3 rounded-2xl w-fit ${stat.bgColor} ${stat.color} mb-4`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] font-bold text-natural-muted uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <h3 className="text-4xl font-serif font-bold text-natural-olive">{stat.value}</h3>
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* Visual Data Representation */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Category Analytics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-natural-olive/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-serif font-bold">Category Distribution</h3>
              <p className="text-natural-muted text-xs uppercase tracking-widest mt-1">Guests by group</p>
            </div>
          </div>
          
          <div className="h-72 w-full mt-4">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#8e8e7a', fontWeight: 'bold'}} />
                  <Tooltip 
                    cursor={{fill: '#fcfaf8', radius: 10}}
                    contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontFamily: 'Inter', padding: '16px'}}
                  />
                  <Bar dataKey="count" fill="#5a5a40" radius={[12, 12, 4, 4]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-natural-muted italic text-sm bg-natural-sidebar/30 rounded-3xl border border-dashed border-natural-border">
                Your guest list is currently empty.
              </div>
            )}
          </div>
        </motion.div>

        {/* Status Breakdown */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-10 relative"
        >
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-natural-accent/20 rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-xl font-serif font-bold mb-2">Invitation Flow</h3>
          <p className="text-natural-muted text-xs uppercase tracking-widest mb-10">Overall progress</p>
          
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="h-64 w-full md:w-1/2 flex items-center justify-center relative">
              {statusData.length > 0 ? (
                <>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <p className="text-[10px] uppercase tracking-widest text-natural-muted font-bold">Invited</p>
                     <h4 className="text-4xl font-serif font-bold text-natural-olive">{invitedCount}</h4>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        innerRadius={75}
                        outerRadius={95}
                        paddingAngle={12}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-natural-muted italic text-sm bg-natural-sidebar/30 rounded-3xl border border-dashed border-natural-border">
                  No statuses recorded yet.
                </div>
              )}
            </div>
            
            <div className="w-full md:w-1/2 space-y-4">
              {statusData.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-natural-sidebar/40 border border-natural-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs font-bold uppercase tracking-widest text-natural-ink">{s.name}</span>
                  </div>
                  <span className="text-lg font-serif font-bold text-natural-olive">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
