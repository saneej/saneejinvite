import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flower, Calendar, MapPin, Users, Mail, Sparkles, ArrowRight, ChevronRight, CheckCircle2, Info } from 'lucide-react';
import { useGuests } from '../context/GuestContext';
import { View } from '../types';
import { cn } from '../lib/utils';

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { updateSettings, addCollaborator } = useGuests();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    brideName: '',
    groomName: '',
    weddingDate: '',
    venue: '',
    collabEmail: '',
    collabName: ''
  });

  const handleNext = () => setStep(s => s + 1);
  
  const handleFinish = async () => {
    await updateSettings({
      brideName: formData.brideName,
      groomName: formData.groomName,
      weddingDate: formData.weddingDate,
      venue: formData.venue,
      whatsappTemplate: `Hello [Name]! We would love to have you at our wedding of ${formData.brideName} & ${formData.groomName} on [Date] at [Venue]. Please let us know if you can join us!`,
      greetingMessage: "Assalamu alaikum [Name]!",
      invitationTone: "Warm and traditional."
    });

    if (formData.collabEmail && formData.collabName) {
      await addCollaborator(formData.collabEmail, formData.collabName, 'Family');
    }

    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-natural-sidebar/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-natural-border/30 overflow-hidden"
      >
        <div className="h-2 bg-natural-sidebar/30">
          <motion.div 
            className="h-full bg-natural-olive"
            initial={{ width: '0%' }}
            animate={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <div className="p-8 md:p-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 text-center"
              >
                <div className="w-20 h-20 bg-natural-sidebar rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Flower className="w-10 h-10 text-natural-olive" />
                </div>
                <div>
                  <h2 className="text-3xl font-serif font-bold text-natural-ink italic">Congratulations!</h2>
                  <p className="text-natural-muted mt-3 text-sm leading-relaxed max-w-xs mx-auto">
                    Let's set up your beautiful celebration. WED Invitor will help you manage guests, track invitations, and involve your family.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-left pt-6">
                  <div className="flex items-start gap-3 p-3 bg-natural-sidebar/20 rounded-xl">
                    <Users className="w-4 h-4 text-natural-olive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-natural-ink">Collaborate</p>
                      <p className="text-[9px] text-natural-muted">Invite family to help</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-natural-sidebar/20 rounded-xl">
                     <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-natural-ink">AI Assisted</p>
                      <p className="text-[9px] text-natural-muted">Generate perfect invites</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleNext}
                  className="w-full bg-natural-olive text-white py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-natural-ink transition-all shadow-md group mt-8"
                >
                  Start Setting Up
                  <ChevronRight className="w-4 h-4 inline-block ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-2xl font-serif font-bold text-natural-ink">The Happy Couple</h3>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-natural-muted mt-1 italic">Who are we celebrating?</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">Bride's Name</label>
                    <input 
                      type="text"
                      required
                      value={formData.brideName}
                      onChange={(e) => setFormData({...formData, brideName: e.target.value})}
                      placeholder="e.g. Ayesha"
                      className="w-full bg-natural-sidebar/20 border border-natural-border/30 px-4 py-4 rounded-xl text-sm outline-none focus:border-natural-olive transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">Groom's Name</label>
                    <input 
                      type="text"
                      required
                      value={formData.groomName}
                      onChange={(e) => setFormData({...formData, groomName: e.target.value})}
                      placeholder="e.g. Sameer"
                      className="w-full bg-natural-sidebar/20 border border-natural-border/30 px-4 py-4 rounded-xl text-sm outline-none focus:border-natural-olive transition-all"
                    />
                  </div>
                </div>

                <button 
                  disabled={!formData.brideName || !formData.groomName}
                  onClick={handleNext}
                  className="w-full bg-natural-olive text-white py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-natural-ink transition-all shadow-md disabled:opacity-50"
                >
                  Continuere
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-2xl font-serif font-bold text-natural-ink">Venue & Date</h3>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-natural-muted mt-1 italic">When and where?</p>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      Wedding Date
                    </label>
                    <input 
                      type="date"
                      required
                      value={formData.weddingDate}
                      onChange={(e) => setFormData({...formData, weddingDate: e.target.value})}
                      className="w-full bg-natural-sidebar/20 border border-natural-border/30 px-4 py-4 rounded-xl text-sm outline-none focus:border-natural-olive transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      Venue Location
                    </label>
                    <input 
                      type="text"
                      required
                      value={formData.venue}
                      onChange={(e) => setFormData({...formData, venue: e.target.value})}
                      placeholder="e.g. Grand Ballroom, City Hotel"
                      className="w-full bg-natural-sidebar/20 border border-natural-border/30 px-4 py-4 rounded-xl text-sm outline-none focus:border-natural-olive transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep(2)}
                    className="flex-1 bg-natural-sidebar/50 text-natural-ink py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em]"
                  >
                    Back
                  </button>
                  <button 
                    disabled={!formData.weddingDate || !formData.venue}
                    onClick={handleNext}
                    className="flex-[2] bg-natural-olive text-white py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-natural-ink transition-all shadow-md disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-natural-sidebar/50 rounded-full text-[8px] font-bold uppercase tracking-widest text-natural-olive mb-2">
                    <Users className="w-3 h-3" />
                    Family Collaboration
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-natural-ink">Invite Collaborators</h3>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-natural-muted mt-1 italic">Optional: Add family members to help</p>
                </div>

                <div className="space-y-4">
                  <div className="p-6 bg-natural-sidebar/10 rounded-2xl border border-natural-border/20 space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">Collaborator Name</label>
                      <input 
                        type="text"
                        value={formData.collabName}
                        onChange={(e) => setFormData({...formData, collabName: e.target.value})}
                        placeholder="e.g. Dad"
                        className="w-full bg-white border border-natural-border/30 px-4 py-3 rounded-xl text-sm outline-none focus:border-natural-olive transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-natural-muted">Gmail Address</label>
                      <input 
                        type="email"
                        value={formData.collabEmail}
                        onChange={(e) => setFormData({...formData, collabEmail: e.target.value})}
                        placeholder="gmail@example.com"
                        className="w-full bg-white border border-natural-border/30 px-4 py-3 rounded-xl text-sm outline-none focus:border-natural-olive transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[9px] text-amber-800 leading-relaxed font-medium">
                      They can add guests, edit categories, and suggest callers. Make sure they use their Gmail account.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep(3)}
                    className="flex-1 bg-natural-sidebar/50 text-natural-ink py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em]"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleFinish}
                    className="flex-[2] bg-natural-olive text-white py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-natural-ink transition-all shadow-md group"
                  >
                    Finish Setup
                    <ArrowRight className="w-4 h-4 inline-block ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                
                <button 
                  onClick={handleFinish}
                  className="w-full text-[9px] font-bold uppercase tracking-widest text-natural-muted hover:text-natural-ink text-center pt-2"
                >
                  Skip for now
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
