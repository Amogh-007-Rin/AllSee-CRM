import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import AllSeeLogo from '../assets/allsee-logo-colour.svg';

const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@hq.com');
  const [password, setPassword] = useState('password123');
  const [scenario, setScenario] = useState<'direct' | 'reseller' | 'partner'>('direct');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleScenarioChange = (newScenario: 'direct' | 'reseller' | 'partner') => {
    setScenario(newScenario);
    if (newScenario === 'direct') {
      setEmail('admin@hq.com');
    } else if (newScenario === 'reseller') {
      setEmail('reseller_client@demo.com');
    } else {
      setEmail('partner@globalsigns.com');
    }
    setPassword('password123');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      login(token, user); 
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-900 overflow-hidden font-sans">
      {/* Left Panel - Network Connectivity Visualization */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-slate-900 to-blue-950 items-end p-12 overflow-hidden">
        {/* Animated Background Dots */}
        <div className="absolute inset-0 opacity-30">
           {[...Array(20)].map((_, i) => (
             <motion.div
               key={i}
               className="absolute w-1 h-1 bg-blue-400 rounded-full"
               initial={{ 
                 x: Math.random() * window.innerWidth / 2, 
                 y: Math.random() * window.innerHeight 
               }}
               animate={{ 
                 x: [Math.random() * 500, Math.random() * 500, Math.random() * 500],
                 y: [Math.random() * 800, Math.random() * 800, Math.random() * 800],
                 opacity: [0.2, 0.8, 0.2]
               }}
               transition={{ 
                 duration: 10 + Math.random() * 10, 
                 repeat: Infinity,
                 ease: "linear" 
               }}
             />
           ))}
        </div>
        
        {/* Network Lines Overlay (Simulated) */}
        <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
          <motion.path 
             d="M100,100 Q400,300 700,100 T1000,500"
             fill="none"
             stroke="url(#gradient)"
             strokeWidth="2"
             initial={{ pathLength: 0 }}
             animate={{ pathLength: 1 }}
             transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-3 mb-6 text-blue-400">
             <Activity className="w-6 h-6 animate-pulse" />
             <span className="font-mono text-sm tracking-widest uppercase">System Operational</span>
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight mb-4">
            Control Your <br/>
            Entire Fleet. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Zero Downtime.
            </span>
          </h1>
          <p className="text-gray-400 max-w-md text-lg">
            Join thousands of enterprises monitoring their digital signage with AllSee's real-time proactive maintenance platform.
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10"
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
             <img src={AllSeeLogo} alt="AllSee Logo" className="h-16 w-auto brightness-0 invert" />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-400 text-sm">Select your portal access level to continue</p>
          </div>

          {/* Persona Switcher (Segmented Control) */}
          <div className="bg-gray-800/50 p-1 rounded-xl flex mb-8 relative">
            {['direct', 'reseller', 'partner', 'child'].map((s) => (
              <button
                key={s}
                onClick={() => handleScenarioChange(s as any)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg relative z-10 transition-colors ${
                  scenario === s ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {scenario === s && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 capitalize">
                  {s === 'direct' ? 'Organisation' : s === 'reseller' ? 'Reseller-client' : s === 'partner' ? 'Reseller' : 'manager-COrg'}
                </span>
              </button>
            ))}
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
              <span>Access Dashboard</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Don't have an account? <a href="#" className="text-blue-400 hover:text-blue-300 font-medium">Contact Sales</a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
