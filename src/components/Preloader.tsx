import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';

const quotes = [
  "Love is composed of a single soul inhabiting two bodies.",
  "The best thing to hold onto in life is each other.",
  "Where there is love there is life.",
  "A successful marriage requires falling in love many times, always with the same person.",
  "Love doesn't makes the world go 'round. Love is what makes the ride worthwhile.",
  "Two souls, one heart.",
  "To love and be loved is to feel the sun from both sides.",
  "Every love story is beautiful, but ours is my favorite.",
];

export function Preloader() {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-natural-sidebar text-natural-ink overflow-hidden p-6 relative">
      {/* Decorative Circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-natural-olive/5 rounded-full -mr-48 -mt-48 blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-natural-olive/10 rounded-full -ml-32 -mb-32 blur-3xl" />

      <div className="flex flex-col items-center gap-12 max-w-lg text-center relative z-10">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-24 h-24 bg-white rounded-[2.5rem] shadow-2xl shadow-natural-olive/20 flex items-center justify-center border border-natural-border/30"
        >
          <Heart className="w-10 h-10 text-natural-olive fill-natural-olive/20" />
        </motion.div>

        <div className="space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-serif font-black italic text-natural-olive mb-2"
          >
            WED Invitor
          </motion.h1>
          
          <div className="h-16 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={quoteIndex}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.8 }}
                className="text-sm md:text-base font-serif italic text-natural-muted leading-relaxed"
              >
                "{quotes[quoteIndex]}"
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="w-12 h-0.5 bg-natural-border/30 rounded-full relative overflow-hidden">
          <motion.div 
            animate={{ left: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 bottom-0 w-1/2 bg-natural-olive"
          />
        </div>

        <p className="text-[9px] uppercase tracking-[0.5em] font-black text-natural-muted/40 animate-pulse">
          Preparing your celebration...
        </p>
      </div>
    </div>
  );
}
