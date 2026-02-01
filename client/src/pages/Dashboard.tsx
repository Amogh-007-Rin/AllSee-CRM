import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import TiltStatsCard from '../components/TiltStatsCard';
import api from '../services/api';
import { CheckCircle, AlertTriangle, XCircle, TrendingUp, Activity, Zap, Lock } from 'lucide-react';
import { Routes, Route } from 'react-router-dom';
import DeviceList from '../components/DeviceList';
import RequestManager from '../components/RequestManager';
import ResellerDashboard from './ResellerDashboard';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const ConsolidationWidget: React.FC = () => {
  const [aligned, setAligned] = useState(false);
  const [progress, setProgress] = useState(35);

  const handleAlign = () => {
    setAligned(true);
    setProgress(100);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Lock className="h-24 w-24 text-blue-500" />
        </div>
        
        <h3 className="text-slate-100 font-bold text-lg mb-1">Fleet Consolidation</h3>
        <p className="text-slate-500 text-xs mb-6">Align renewal dates to simplify billing.</p>
        
        <div className="mb-2 flex justify-between text-xs font-mono text-blue-400">
            <span>ALIGNMENT</span>
            <span>{progress}%</span>
        </div>
        
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-6">
            <motion.div 
                className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                initial={{ width: "35%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            />
        </div>
        
        <button 
            onClick={handleAlign}
            disabled={aligned}
            className="w-full py-3 rounded-xl bg-blue-600/10 border border-blue-500/50 text-blue-400 font-medium hover:bg-blue-600 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group/btn"
        >
            {aligned ? (
                <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Optimized</span>
                </>
            ) : (
                <>
                    <Zap className="h-4 w-4 group-hover/btn:fill-current" />
                    <span>Align Renewals</span>
                </>
            )}
        </button>
    </div>
  );
};

const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data.summary);
        // Animate count up for "Cost Saved" simulation
        let start = 0;
        const end = 12450; 
        const duration = 2000;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out quart
            const ease = 1 - Math.pow(1 - progress, 4);
            
            setCount(Math.floor(start + (end - start) * ease));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);

      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Command Center</h2>
            <p className="text-slate-500 mt-1">Real-time fleet monitoring and diagnostics.</p>
          </div>
          <div className="hidden md:flex gap-3">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                  SYSTEM OPTIMAL
              </span>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <TiltStatsCard
          title="Total Fleet"
          value={stats?.active || 0}
          icon={Activity}
          color="blue"
          description="Active units monitored"
        >
             <div className="mt-4 h-8 flex items-end gap-1 opacity-50">
                {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                    <div key={i} className="flex-1 bg-blue-400 rounded-t-sm" style={{ height: `${h}%` }} />
                ))}
             </div>
        </TiltStatsCard>

        <TiltStatsCard
          title="At Risk"
          value={stats?.warning || 0}
          icon={AlertTriangle}
          color="amber"
          description="Requires attention"
        />

        <TiltStatsCard
          title="Critical"
          value={stats?.expired || 0}
          icon={XCircle}
          color="red"
          description="Service suspended"
        >
            {stats?.expired > 0 && (
                <div className="mt-2 text-xs text-red-400 font-mono animate-pulse">
                    ! ACTION REQUIRED
                </div>
            )}
        </TiltStatsCard>

        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 flex flex-col justify-between backdrop-blur-sm">
            <div>
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Cost Saved</h3>
                <div className="mt-2 text-3xl font-bold text-emerald-400 font-mono">
                    ${count.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 mt-1">Year to date optimization</p>
            </div>
            <div className="mt-4">
                 <div className="flex items-center text-emerald-500 text-sm">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>+12.5%</span>
                 </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
             {/* Placeholder for Main Chart or Map - Could be added here */}
             <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-1 min-h-[300px] flex items-center justify-center text-slate-600 font-mono text-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                <div className="z-10 text-center">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>SYSTEM DIAGNOSTICS VISUALIZATION</p>
                    <p className="text-xs opacity-50 mt-2">No critical anomalies detected in the last 24h.</p>
                </div>
             </div>
          </div>
          <div className="lg:col-span-1">
             <ConsolidationWidget />
             
             <div className="mt-6 p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
                <h3 className="text-slate-100 font-bold mb-4">Recent Alerts</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 items-start p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                            <div className="h-2 w-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
                            <div>
                                <p className="text-sm text-slate-300">Firmware update pending for Region-{i}</p>
                                <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
          </div>
      </div>
      
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <Routes>
        <Route path="/" element={user?.orgType === 'RESELLER' ? <ResellerDashboard /> : <DashboardHome />} />
        <Route path="/devices" element={<DeviceList />} />
        <Route path="/requests" element={<RequestManager />} />
      </Routes>
    </Layout>
  );
};

export default Dashboard;
