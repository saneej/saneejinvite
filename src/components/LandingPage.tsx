import { motion, AnimatePresence } from 'motion/react';
import { 
  Flower, 
  Sparkles, 
  MessageCircle, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  LogIn, 
  ChevronLeft, 
  ChevronRight, 
  Bot,
  Share2,
  Calendar
} from 'lucide-react';
import { useState, useEffect } from 'react';

const features = [
  {
    title: "AI Invitation Assistant",
    description: "Write the perfect message with our AI that understands your wedding's unique tone and cultural nuances.",
    icon: <Bot className="w-6 h-6" />,
    color: "bg-indigo-50",
    textColor: "text-indigo-600",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "WhatsApp Seamless Sync",
    description: "Send personalized invitations directly to your guests' WhatsApp with a single tap. No more copy-pasting.",
    icon: <MessageCircle className="w-6 h-6" />,
    color: "bg-emerald-50",
    textColor: "text-emerald-600",
    image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Real-time RSVP Manager",
    description: "Track responses as they happen. Categorize guests into family, friends, and sides to manage logistics easily.",
    icon: <Users className="w-6 h-6" />,
    color: "bg-slate-100",
    textColor: "text-slate-900",
    image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Collaborative Help",
    description: "Invite family members or friends as helpers. Manage the guest list together in real-time.",
    icon: <Share2 className="w-6 h-6" />,
    color: "bg-amber-50",
    textColor: "text-amber-700",
    image: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&q=80&w=800"
  }
];

export function LandingPage({ onLogin }: { onLogin: () => void }) {
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextFeature = () => setCurrentFeature((prev) => (prev + 1) % features.length);
  const prevFeature = () => setCurrentFeature((prev) => (prev - 1 + features.length) % features.length);

  return (
    <div className="min-h-screen bg-natural-sidebar overflow-x-hidden font-sans">
      {/* Floating Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-natural-olive/3 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30vh] h-[30vh] bg-gold-accent/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-20 flex justify-between items-center px-6 md:px-12 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-natural-olive text-white rounded-xl flex items-center justify-center shadow-lg rotate-3 group overflow-hidden transition-transform hover:rotate-0">
            <Flower className="w-5 h-5" />
          </div>
          <span className="font-serif text-2xl font-bold text-natural-olive tracking-tight">Wedding Vows</span>
        </div>
        <button 
          onClick={onLogin}
          className="flex items-center gap-2 px-6 py-3 bg-natural-olive text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-natural-ink transition-all shadow-md active:scale-95"
        >
          <LogIn className="w-3 h-3" />
          Login
        </button>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12 pt-12 md:pt-24 pb-20 max-w-7xl mx-auto text-center md:text-left flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gold-accent/5 text-gold-accent rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 border border-gold-accent/10">
              <Sparkles className="w-3 h-3" />
              AI-Powered Wedding Planning
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-natural-olive leading-[1.1] mb-6">
              Invite your guests with <span className="italic">grace</span> and <span className="relative inline-block">
                elegance
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-gold-accent/20 rounded-full" />
              </span>
            </h1>
            <p className="text-natural-muted text-lg md:text-xl max-w-2xl leading-relaxed">
              Manage your guest list, craft heartfelt AI-driven invitations, and send them directly via WhatsApp. All in one place.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center gap-4 pt-4"
          >
            <button 
              onClick={onLogin}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-natural-olive text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-xs hover:bg-natural-ink transition-all shadow-2xl active:scale-95 group"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center gap-4 text-natural-muted text-xs font-medium uppercase tracking-widest px-4">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-natural-accent flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
              Joined by 200+ couples
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex-1 w-full max-w-xl relative"
        >
          <div className="aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl border-8 border-white bg-natural-accent/20">
            <img 
              src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200" 
              alt="Beautiful Wedding" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          
          {/* Feature Badge Overlay */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-8 top-1/4 glass-card p-6 flex flex-col gap-2 max-w-[180px] shadow-2xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-900">Success</span>
            </div>
            <p className="text-[11px] font-medium text-emerald-900 leading-tight">150 Guests Invite sent via WhatsApp!</p>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-8 bottom-1/4 glass-card p-6 flex flex-col gap-3 min-w-[200px] shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-blue-900">AI Assistant</p>
                <p className="text-[11px] font-medium text-blue-800 italic">"Graceful and traditional tone set."</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Carousel Section */}
      <section className="bg-white py-24 md:py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-natural-olive mb-6">Everything you need</h2>
            <p className="text-natural-muted max-w-xl mx-auto uppercase text-xs font-bold tracking-[0.3em]">Built for the modern couple</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Carousel Control & Info */}
            <div className="space-y-12">
              <div className="relative h-[300px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentFeature}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className={`w-16 h-16 ${features[currentFeature].color} ${features[currentFeature].textColor} rounded-2xl flex items-center justify-center`}>
                      {features[currentFeature].icon}
                    </div>
                    <h3 className="text-3xl font-serif font-bold text-natural-ink italic">
                      {features[currentFeature].title}
                    </h3>
                    <p className="text-natural-muted text-lg leading-relaxed max-w-md">
                      {features[currentFeature].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={prevFeature}
                  className="w-12 h-12 border border-natural-border/60 rounded-full flex items-center justify-center hover:bg-natural-sidebar transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                  {features.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-500 ${i === currentFeature ? 'w-8 bg-natural-olive' : 'w-1.5 bg-natural-border'}`} 
                    />
                  ))}
                </div>
                <button 
                  onClick={nextFeature}
                  className="w-12 h-12 border border-natural-border/60 rounded-full flex items-center justify-center hover:bg-natural-sidebar transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Feature Illustration */}
            <div className="relative">
              <div className="absolute -inset-4 bg-natural-accent/30 rounded-[3rem] blur-2xl -z-10" />
              <div className="aspect-[16/10] bg-natural-sidebar rounded-[2.5rem] overflow-hidden shadow-xl border border-natural-border/40 relative">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentFeature}
                    src={features[currentFeature].image}
                    alt={features[currentFeature].title}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.6 }}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-natural-ink/40 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-natural-sidebar">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-natural-olive mb-16 italic">Simple steps to brilliance</h2>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-natural-border/50 -translate-y-1/2 z-0" />
            
            {[
              { 
                step: "01", 
                title: "Build your list", 
                desc: "Import or add guests one by one. Group them by relations for perfect organization.",
                icon: <Users className="w-6 h-6" />
              },
              { 
                step: "02", 
                title: "Draft with AI", 
                desc: "Let our Gemini-powered AI create heartsome invitations in the tone of your choice.",
                icon: <Bot className="w-6 h-6" />
              },
              { 
                step: "03", 
                title: "Launch & Track", 
                desc: "Send via WhatsApp and monitor RSVPs in real-time. Manage your day with confidence.",
                icon: <Calendar className="w-6 h-6" />
              }
            ].map((item, i) => (
              <div key={i} className="relative z-10 bg-natural-sidebar px-6 flex flex-col items-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl mb-8 border border-natural-border/40 relative group transition-transform hover:-translate-y-2">
                  <div className="text-natural-olive group-hover:scale-110 transition-transform">{item.icon}</div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-natural-olive text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-serif font-bold text-natural-ink mb-4 italic">{item.title}</h3>
                <p className="text-natural-muted text-sm leading-relaxed max-w-[200px]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-32 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto rounded-[4rem] bg-natural-olive text-white p-12 md:p-24 text-center relative overflow-hidden shadow-3xl"
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          </div>
          
          <div className="relative z-10 space-y-10">
            <h2 className="text-4xl md:text-6xl font-serif font-bold leading-tight">Start your journey to a <br className="hidden md:block" /> perfectly organized wedding.</h2>
            <p className="text-natural-accent font-medium text-lg opacity-80 max-w-2xl mx-auto italic">Join hundreds of happy couples who simplified their guest management with Wedding Vows.</p>
            
            <button 
              onClick={onLogin}
              className="inline-flex items-center gap-4 px-12 py-6 bg-white text-natural-olive rounded-2xl font-bold uppercase tracking-[0.3em] text-xs hover:bg-natural-accent transition-all shadow-2xl active:scale-95 group"
            >
              Get Started for Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">No credit card required • Secure Google Sign-In</p>
          </div>
        </motion.div>
      </section>

      <footer className="bg-white border-t border-natural-border/30 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-8 opacity-50 grayscale hover:grayscale-0 transition-all">
            <div className="w-8 h-8 bg-natural-olive text-white rounded-lg flex items-center justify-center rotate-3">
              <Flower className="w-4 h-4" />
            </div>
            <span className="font-serif text-xl font-bold text-natural-olive">Wedding Vows</span>
          </div>
          <p className="text-natural-muted text-[10px] font-bold uppercase tracking-widest leading-loose">
            Built with love for your special day. <br />
            © {new Date().getFullYear()} Wedding Vows. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
