import React, { useState } from 'react';
import { Sparkles, Copy, Check, MessageSquare, Send, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateInvitationMessage } from '../services/aiService';
import { Guest, WeddingSettings } from '../types';
import { cn } from '../lib/utils';

interface AIAssistantProps {
  guest: Guest;
  settings: WeddingSettings;
  onClose: () => void;
  onUseMessage: (message: string) => void;
}

export function AIInvitationAssistant({ guest, settings, onClose, onUseMessage }: AIAssistantProps) {
  const [tone, setTone] = useState<'formal' | 'casual' | 'poetic' | 'short'>('casual');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setIsGenerating(true);
    try {
      const msg = await generateInvitationMessage({
        brideName: settings.brideName,
        groomName: settings.groomName,
        weddingDate: settings.weddingDate || 'TBD',
        weddingLocation: settings.venue || 'TBD',
        guestName: guest.name,
        category: guest.category,
        tone: tone
      });
      setGeneratedMessage(msg);
    } catch (err) {
      alert("Failed to generate message. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-natural-ink/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-natural-olive p-8 text-white">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-serif font-bold">AI Invitation Helper</h3>
          </div>
          <p className="text-white/70 text-[10px] uppercase tracking-widest font-bold">Crafting the perfect message for {guest.name}</p>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto">
          {/* Tone Selector */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-natural-muted tracking-widest ml-1">Message Tone</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['formal', 'casual', 'poetic', 'short'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                    tone === t 
                      ? "bg-natural-olive text-white border-natural-olive shadow-md" 
                      : "bg-natural-sidebar/50 text-natural-muted border-natural-border/30 hover:bg-natural-sidebar"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {!generatedMessage && !isGenerating ? (
            <div className="py-12 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-natural-olive/10 rounded-full flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-natural-olive opacity-40" />
              </div>
              <div>
                <p className="text-natural-ink font-serif font-medium">Ready to create magic?</p>
                <p className="text-natural-muted text-xs">AI will draft a personalized message based on your wedding details.</p>
              </div>
              <button
                onClick={generate}
                className="inline-flex items-center gap-2 px-8 py-4 bg-natural-olive text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-natural-ink transition-all shadow-lg group"
              >
                <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                Generate Draft
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] uppercase font-bold text-natural-muted tracking-widest">AI Drafted Message</label>
                  <button 
                    onClick={generate}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 text-[9px] font-bold text-natural-olive uppercase tracking-tight hover:underline disabled:opacity-50"
                  >
                    <RefreshCw className={cn("w-3 h-3", isGenerating && "animate-spin")} />
                    Regenerate
                  </button>
                </div>
                
                <div className="relative group">
                  {isGenerating ? (
                    <div className="w-full bg-natural-sidebar/30 border border-natural-border/50 p-6 rounded-2xl h-48 flex items-center justify-center">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-natural-olive rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-natural-olive rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-natural-olive rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full bg-natural-sidebar/30 border border-natural-border/50 p-6 rounded-2xl text-[13px] leading-relaxed text-natural-ink font-medium min-h-[12rem] whitespace-pre-wrap">
                      {generatedMessage}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={copyToClipboard}
                  disabled={!generatedMessage || isGenerating}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border border-natural-border rounded-xl text-[10px] font-bold uppercase tracking-widest text-natural-ink hover:bg-natural-sidebar transition-all disabled:opacity-50"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Text'}
                </button>
                <button
                  onClick={() => onUseMessage(generatedMessage)}
                  disabled={!generatedMessage || isGenerating}
                  className="flex-[1.5] flex items-center justify-center gap-2 px-6 py-4 bg-natural-olive text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-natural-ink transition-all shadow-lg disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Apply This Message
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-natural-sidebar/20 border-t border-natural-border/30">
          <p className="text-[9px] text-natural-muted text-center italic">
            AI suggestions are based on your wedding settings and guest information.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
