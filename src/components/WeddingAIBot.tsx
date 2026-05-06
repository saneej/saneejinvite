import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User, Loader2, Minus, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { chatWithAI } from '../services/aiService';
import { useGuests } from '../context/GuestContext';
import { cn } from '../lib/utils';

export function WeddingAIBot() {
  const { guests, settings } = useGuests();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await chatWithAI({
        query: userMessage,
        guests,
        settings,
        history
      });

      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I'm having trouble connecting to my creative circuits right now. Please try again soon." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-natural-olive text-white rounded-full shadow-2xl flex items-center justify-center group"
        >
          <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0, 
              x: 0,
              height: isMinimized ? '64px' : '500px'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            className={cn(
              "fixed bottom-6 right-6 z-[101] w-[calc(100vw-3rem)] sm:w-96 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden transition-all duration-300 border border-natural-border/20",
              isMinimized && "w-64"
            )}
          >
            {/* Header */}
            <div className="bg-natural-olive p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-bold">Wedding Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-white/70 uppercase tracking-widest font-bold">Always syncing</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-natural-sidebar/10"
                >
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                      <div className="w-12 h-12 bg-natural-olive/10 rounded-full flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-natural-olive opacity-40" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-natural-ink text-sm font-serif font-medium">How can I help with your celebration?</p>
                        <p className="text-natural-muted text-[10px] leading-relaxed">
                          "Who hasn't RSVP'd yet?"<br />
                          "Help me draft a plan for UAE Friends"<br />
                          "What's the status of my guest list?"
                        </p>
                      </div>
                    </div>
                  )}

                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-3",
                        m.role === 'user' ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        m.role === 'user' ? "bg-natural-olive text-white" : "bg-white border border-natural-border/30 text-natural-ink shadow-sm"
                      )}>
                        {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={cn(
                        "max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed",
                        m.role === 'user' 
                          ? "bg-natural-olive text-white rounded-tr-none" 
                          : "bg-white border border-natural-border/20 text-natural-ink rounded-tl-none shadow-sm"
                      )}>
                        {m.text}
                      </div>
                    </motion.div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-white border border-natural-border/30 rounded-full flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-natural-ink" />
                      </div>
                      <div className="bg-white border border-natural-border/20 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center">
                        <div className="w-1.5 h-1.5 bg-natural-olive/40 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-natural-olive/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-natural-olive/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-natural-border/30 shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask me anything..."
                      className="flex-1 bg-natural-sidebar/50 border border-natural-border/30 rounded-xl px-4 py-2.5 text-xs text-natural-ink focus:outline-none focus:ring-1 focus:ring-natural-olive/50 transition-all"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isTyping}
                      className="w-10 h-10 bg-natural-olive text-white rounded-xl flex items-center justify-center hover:bg-natural-ink transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[8px] text-natural-muted text-center mt-2 uppercase tracking-widest font-bold opacity-50">
                    AI powered assistant • Private & Secure
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
