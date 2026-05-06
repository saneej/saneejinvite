import React, { useMemo } from 'react';
import { useGuests } from '../context/GuestContext';
import { View, InvitationStatus } from '../types';
import { motion } from 'motion/react';
import { Users, CheckCircle, Clock, XCircle, ArrowLeft, Phone, MoreHorizontal, UserCheck, UserPlus } from 'lucide-react';
import { cn } from '../lib/utils';

interface CategoryDetailProps {
  categoryName: string;
  onViewChange: (view: View) => void;
}

export function CategoryDetail({ categoryName, onViewChange }: CategoryDetailProps) {
  const { guests, categories } = useGuests();
  
  const categoryGuests = useMemo(() => 
    guests.filter(g => g.category === categoryName),
    [guests, categoryName]
  );

  const stats = useMemo(() => {
    const total = categoryGuests.length;
    const invited = categoryGuests.filter(g => g.status !== InvitationStatus.NOT_INVITED).length;
    const confirmed = categoryGuests.filter(g => g.status === InvitationStatus.CONFIRMED).length;
    const declined = categoryGuests.filter(g => g.status === InvitationStatus.NOT_COMING).length;
    
    return {
      total,
      invited,
      pending: invited - confirmed - declined,
      confirmed,
      declined,
      notInvited: total - invited,
      confirmationRate: total > 0 ? Math.round((confirmed / total) * 100) : 0
    };
  }, [categoryGuests]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
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
      {/* Header */}
      <motion.div variants={itemVariants} className="pt-4 border-b border-natural-border/50 pb-8">
        <button 
          onClick={() => onViewChange('categories')}
          className="flex items-center gap-2 text-natural-muted hover:text-natural-olive transition-colors mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Categories</span>
        </button>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-serif font-black text-natural-ink italic leading-tight">
              {categoryName} <span className="text-natural-olive/30 font-sans not-italic font-light">/</span> Analysis
            </h2>
            <p className="text-natural-muted text-[10px] uppercase tracking-[0.4em] font-black opacity-60 mt-4">
              View guests in this category
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="px-6 py-4 bg-white border border-natural-border/30 rounded-3xl shadow-sm">
              <p className="text-[9px] uppercase tracking-[0.2em] text-natural-muted font-black mb-1">Confirmation Rate</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-serif font-black text-natural-olive italic">{stats.confirmationRate}%</span>
                <div className="w-24 h-2 bg-natural-sidebar rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.confirmationRate}%` }}
                    className="h-full bg-natural-olive"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Guests', value: stats.total, color: 'bg-natural-sidebar text-natural-olive', icon: Users },
          { label: 'Confirmed', value: stats.confirmed, color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle },
          { label: 'Pending RSVP', value: stats.pending, color: 'bg-amber-50 text-amber-600', icon: Clock },
          { label: 'Not Coming', value: stats.declined, color: 'bg-rose-50 text-rose-500', icon: XCircle },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-natural-border/30 shadow-sm">
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4 shadow-sm", stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-[9px] uppercase tracking-widest text-natural-muted font-black opacity-60 mb-1">{stat.label}</p>
            <p className="text-3xl font-serif font-black text-natural-ink italic">{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* List Preview */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-serif font-black text-natural-ink italic">Guest List</h3>
          <button 
             onClick={() => onViewChange('guests')}
             className="text-[9px] font-black uppercase tracking-widest text-natural-olive hover:underline underline-offset-4"
          >
            Manage All
          </button>
        </div>
        
        <div className="bg-white rounded-[3rem] border border-natural-border/30 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-natural-border/20">
                  <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-black text-natural-muted">Guest Name</th>
                  <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-black text-natural-muted">Status</th>
                  <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-black text-natural-muted">Contact</th>
                  <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-black text-natural-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-natural-border/10">
                {categoryGuests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-natural-muted font-serif italic text-lg">
                      No guests added to this category yet.
                    </td>
                  </tr>
                ) : (
                  categoryGuests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-natural-sidebar/20 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-natural-sidebar rounded-xl flex items-center justify-center text-natural-olive font-serif font-black text-lg">
                            {guest.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-black text-natural-ink">{guest.name}</p>
                            <p className="text-[10px] text-natural-muted italic">Added {new Date(guest.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border",
                          guest.status === InvitationStatus.CONFIRMED ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          guest.status === InvitationStatus.NOT_INVITED ? "bg-natural-sidebar text-natural-muted border-natural-border/30" :
                          guest.status === InvitationStatus.INVITED ? "bg-amber-50 text-amber-600 border-amber-100" :
                          "bg-rose-50 text-rose-500 border-rose-100"
                        )}>
                          {guest.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-natural-ink">
                          <Phone className="w-3.5 h-3.5 text-natural-muted opacity-40" />
                          <span className="text-xs font-medium">{guest.phone || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button className="p-2.5 bg-natural-sidebar rounded-xl text-natural-muted hover:text-natural-olive transition-all group-hover:bg-white shadow-sm hover:shadow-md">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Suggested Actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <button 
          onClick={() => onViewChange('add')}
          className="flex items-center gap-5 p-8 bg-natural-olive text-white rounded-[3rem] shadow-xl shadow-natural-olive/20 hover:scale-[1.02] transition-all group text-left"
        >
          <div className="w-16 h-16 bg-white/10 rounded-[2rem] flex items-center justify-center group-hover:rotate-12 transition-transform">
            <UserPlus className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest opacity-80">Quick Action</p>
            <h4 className="text-2xl font-serif font-black italic">Add Guests to {categoryName}</h4>
          </div>
        </button>

        <button 
          onClick={() => onViewChange('invite')}
          className="flex items-center gap-5 p-8 bg-natural-ink text-white rounded-[3rem] shadow-xl shadow-natural-ink/20 hover:scale-[1.02] transition-all group text-left"
        >
          <div className="w-16 h-16 bg-white/10 rounded-[2rem] flex items-center justify-center group-hover:-rotate-12 transition-transform text-natural-olive">
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest opacity-80">Next Step</p>
            <h4 className="text-2xl font-serif font-black italic">Send Invitations</h4>
          </div>
        </button>
      </motion.div>
    </motion.div>
  );
}
