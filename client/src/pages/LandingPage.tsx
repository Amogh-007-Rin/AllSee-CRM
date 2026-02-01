import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation, useInView, animate, useMotionValue, useTransform, useSpring, useAnimationFrame } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle, Bell, Shield, ArrowRight, Play, Clock, TrendingUp } from 'lucide-react';
import AllSeeLogo from '../assets/allsee-logo-colour.svg';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-x-hidden font-sans">
      <Navbar />
      <HeroSection />
      <FeatureShowcase />
      <CostSavior />
      <CoTermingVisualizer />
      <Footer />
    </div>
  );
};

const Navbar = () => {
  return (
    <nav className="absolute top-0 left-0 w-full z-50 px-6 py-6">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src={AllSeeLogo} alt="Allsee Technologies" className="h-16 w-auto" />
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <Link to="/login">
            <button className="text-gray-300 hover:text-white font-medium transition-colors">
              Log In
            </button>
          </Link>
          <Link to="/login">
            <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40">
              Sign Up
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-slate-900 to-black overflow-hidden px-6">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      
      <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
        {/* Text Content */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6">
            Never Let Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
              Screens Go Dark.
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-lg">
            The enterprise-grade license management platform that ensures 100% uptime for your digital signage fleet. Zero downtime. Zero headaches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/login">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-full font-bold text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full font-bold text-lg flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              Watch Demo <Play className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>

        {/* Cylindrical Carousel Animation */}
        <CylindricalCarousel />
      </div>
    </section>
  );
};

const CylindricalCarousel = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(window.innerWidth / 2);
  const autoRotate = useMotionValue(0);
  
  // Infinite rotation loop
  useAnimationFrame((t, delta) => {
    const rotationSpeed = 10; // degrees per second
    autoRotate.set(autoRotate.get() + (rotationSpeed * delta) / 1000);
  });

  // Map mouse position to a rotation offset (-180 to 180 degrees)
  // This allows the user to "spin" or "look around" relative to the auto-rotation
  const mouseOffset = useTransform(mouseX, [0, window.innerWidth], [180, -180]);
  
  // Combine auto-rotation and mouse interaction
  const combinedRotation = useTransform([autoRotate, mouseOffset], ([auto, mouse]) => auto + mouse);
  const smoothRotation = useSpring(combinedRotation, { stiffness: 30, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX);
  };

  const screens = [
    { src: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop", title: "NIKE AIR", subtitle: "Just Do It" },
    { src: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=600&auto=format&fit=crop", title: "COCA-COLA", subtitle: "Taste the Feeling" },
    { src: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop", title: "BURGER KING", subtitle: "Flame Grilled" },
    { src: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=600&auto=format&fit=crop", title: "IPHONE 15", subtitle: "Titanium. So Strong." },
    { src: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=600&auto=format&fit=crop", title: "TESLA MODEL S", subtitle: "Plaid Mode" },
    { src: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=600&auto=format&fit=crop", title: "SPOTIFY", subtitle: "Listening is Everything" },
  ];

  const radius = 380; // Increased radius for larger screens
  const angleStep = 360 / screens.length;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[800px] flex items-center justify-center perspective-1000 cursor-move"
      onMouseMove={handleMouseMove}
      style={{ perspective: '1500px' }}
    >
      <motion.div
        className="relative w-[260px] h-[420px]"
        style={{ 
          transformStyle: 'preserve-3d',
          rotateY: smoothRotation 
        }}
      >
        {screens.map((screen, index) => (
          <div
            key={index}
            className="absolute top-0 left-0 w-full h-full bg-slate-800 border-2 border-blue-500/30 rounded-2xl overflow-hidden shadow-2xl backface-hidden"
            style={{
              transform: `rotateY(${index * angleStep}deg) translateZ(${radius}px)`,
            }}
          >
             <div className="relative w-full h-full group">
                <img src={screen.src} alt={screen.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-6">
                  <div className="text-cyan-400 text-xs font-bold tracking-widest mb-1">{screen.subtitle}</div>
                  <div className="text-white text-2xl font-bold leading-tight">{screen.title}</div>
                </div>
                {/* Status Dot */}
                <div className="absolute top-4 right-4 w-3 h-3 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e] animate-pulse"></div>
             </div>
          </div>
        ))}
      </motion.div>
      
      {/* Decorative Floor Glow */}
      <div className="absolute bottom-10 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
    </div>
  );
};

const FeatureShowcase = () => {
  return (
    <section className="py-24 bg-slate-900 relative">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Visual Fleet Management</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Stop guessing. Start knowing. Our traffic-light system gives you instant clarity on your fleet's health.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            color="green" 
            icon={<CheckCircle className="w-12 h-12 text-green-400 mb-4" />}
            title="Active & Healthy"
            description="Your devices are fully licensed and compliant. No action needed."
          />
          <FeatureCard 
            color="amber" 
            icon={<Bell className="w-12 h-12 text-amber-400 mb-4 animate-bounce" />}
            title="Proactive Alerts"
            description="Get notified 60 days before expiry. Automated renewal workflows trigger instantly."
          />
          <FeatureCard 
            color="red" 
            icon={<Shield className="w-12 h-12 text-red-500 mb-4" />}
            title="Instant Recovery"
            description="Expired license? One-click reactivation brings your screens back to life in seconds."
          />
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ color, icon, title, description }: { color: string, icon: React.ReactNode, title: string, description: string }) => {
  const bgColors = {
    green: 'bg-green-900/10 border-green-500/30 hover:border-green-500',
    amber: 'bg-amber-900/10 border-amber-500/30 hover:border-amber-500',
    red: 'bg-red-900/10 border-red-500/30 hover:border-red-500'
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.05, rotate: 1 }}
      className={`p-8 rounded-2xl border ${bgColors[color as keyof typeof bgColors]} transition-all duration-300 backdrop-blur-sm cursor-pointer group`}
    >
      <div className="group-hover:scale-110 transition-transform duration-300 origin-left">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </motion.div>
  );
};

const CostSavior = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 to-black">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">Stop Wasting <span className="text-blue-500">Admin Hours</span></h2>
            <p className="text-gray-400 text-lg mb-8">
              Manual license tracking is a full-time job you don't need. Automate renewals, consolidate invoices, and reclaim your team's productivity.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="w-12 h-1 bg-gray-700 rounded overflow-hidden">
                <div className="w-3/4 h-full bg-blue-500"></div>
              </div>
              <span>Based on data from 500+ Enterprise Clients</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <CounterCard value={15000} prefix="£" label="Average Revenue Saved per Year" delay={0.2} />
            <CounterCard value={500} suffix="+" label="Admin Hours Saved" delay={0.4} />
          </div>
        </div>
      </div>
    </section>
  );
};

const CounterCard = ({ value, prefix = '', suffix = '', label, delay }: { value: number, prefix?: string, suffix?: string, label: string, delay: number }) => {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const controls = animate(0, value, {
        duration: 2.5,
        onUpdate: (latest) => setCount(Math.floor(latest)),
        ease: "easeOut"
      });
      return controls.stop;
    }
  }, [isInView, value]);

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay }}
      className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700 text-center"
    >
      <div className="text-4xl md:text-5xl font-bold text-white mb-2 font-mono">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-gray-400 font-medium">{label}</div>
    </motion.div>
  );
};

const CoTermingVisualizer = () => {
  return (
    <section className="py-24 bg-black overflow-hidden">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold mb-16">One Invoice. One Date. <span className="text-purple-500">Zero Headaches.</span></h2>
        
        <div className="relative max-w-4xl mx-auto h-64 flex items-center justify-center">
           {/* Incoming Lines (Invoices) */}
           <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 300" fill="none">
             {/* Left side scattering lines */}
             <motion.path 
               d="M50 50 C 200 50, 300 150, 400 150" 
               stroke="#64748b" strokeWidth="2" strokeDasharray="10 10"
               initial={{ pathLength: 0, opacity: 0 }}
               whileInView={{ pathLength: 1, opacity: 0.5 }}
               transition={{ duration: 2, repeat: Infinity }}
             />
             <motion.path 
               d="M50 150 C 200 150, 300 150, 400 150" 
               stroke="#64748b" strokeWidth="2" strokeDasharray="10 10"
               initial={{ pathLength: 0, opacity: 0 }}
               whileInView={{ pathLength: 1, opacity: 0.5 }}
               transition={{ duration: 2, delay: 0.5, repeat: Infinity }}
             />
             <motion.path 
               d="M50 250 C 200 250, 300 150, 400 150" 
               stroke="#64748b" strokeWidth="2" strokeDasharray="10 10"
               initial={{ pathLength: 0, opacity: 0 }}
               whileInView={{ pathLength: 1, opacity: 0.5 }}
               transition={{ duration: 2, delay: 1, repeat: Infinity }}
             />

             {/* Center Merger Node */}
             <circle cx="400" cy="150" r="10" fill="#3b82f6" className="animate-pulse" />

             {/* Output Line (Solid) */}
             <motion.path 
               d="M400 150 L 750 150" 
               stroke="#3b82f6" strokeWidth="4"
               initial={{ pathLength: 0 }}
               whileInView={{ pathLength: 1 }}
               transition={{ duration: 1.5, delay: 1.5 }}
             />
           </svg>

           {/* Labels */}
           <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 flex flex-col gap-12 text-xs text-gray-500">
             <div>Inv #001 (Jan)</div>
             <div>Inv #002 (Mar)</div>
             <div>Inv #003 (Sep)</div>
           </div>

           <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12">
             <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg font-bold flex items-center gap-2">
               <TrendingUp className="w-4 h-4" /> Consolidated Invoice
             </div>
           </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-slate-950 py-12 border-t border-gray-800">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">L</div>
          <span className="text-xl font-bold">LicenseGuard</span>
        </div>
        <div className="text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Powered by Allsee Technologies. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default LandingPage;
