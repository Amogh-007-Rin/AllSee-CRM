import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Smartphone, FileText, Bell, LogOut, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import Logo from '../assets/allsee-logo-colour.svg';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Devices', path: '/dashboard/devices', icon: Smartphone },
    { name: 'Requests', path: '/dashboard/requests', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 h-20 px-6 flex items-center justify-between bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 shadow-lg">
        {/* Logo Section */}
        <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center gap-3 group">
                <div className="h-10 w-10 bg-slate-800/50 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/10 border border-slate-700/50 group-hover:border-blue-500/50 transition-colors p-1.5">
                    <img src={Logo} alt="AllSee CRM" className="h-full w-full object-contain" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-slate-100 tracking-tight group-hover:text-blue-400 transition-colors">AllSee CRM</h1>
                    <p className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold">
                        {user?.orgType === 'PARENT' ? 'Global Command' : 'Regional Node'}
                    </p>
                </div>
            </Link>
        </div>

        {/* Center Navigation - Cylindrical Bubble Switch */}
        <nav className="hidden md:flex items-center p-1.5 bg-slate-950/50 rounded-full border border-slate-800/50 relative">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                            "relative px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center z-10",
                            isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="navBubble"
                                className="absolute inset-0 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                style={{ zIndex: -1 }}
                            />
                        )}
                        <Icon className={cn("h-4 w-4 mr-2", isActive ? "text-white" : "text-slate-500")} />
                        {item.name}
                    </Link>
                );
            })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-6">
             {/* Notification Bell */}
             <div className="relative group cursor-pointer">
                <motion.div
                    whileHover={{ rotate: [0, -10, 10, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                >
                    <Bell className="h-5 w-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                </motion.div>
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse ring-4 ring-slate-900" />
            </div>

            <div className="h-8 w-px bg-slate-800 mx-2" />

            {/* User Profile */}
            <div className="flex items-center gap-3">
                 <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium text-slate-200">{user?.name || 'Admin User'}</div>
                    <div className="text-xs text-slate-500">{user?.role || 'HQ Admin'}</div>
                 </div>
                 <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:border-blue-500 transition-colors cursor-pointer group">
                    <User className="h-5 w-5 text-slate-400 group-hover:text-blue-400" />
                 </div>
                 <button
                    onClick={logout}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                    title="Sign Out"
                 >
                    <LogOut className="h-5 w-5" />
                 </button>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-x-hidden w-full max-w-[95%] mx-auto">
         {children}
      </main>

      {/* Mobile Bottom Nav (Keep for mobile) */}
      <div className="md:hidden fixed bottom-0 w-full bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 flex justify-around p-4 z-40 pb-6">
         {navItems.map((item) => {
             const Icon = item.icon;
             const isActive = location.pathname === item.path;
             return (
                 <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                        "flex flex-col items-center",
                        isActive ? "text-blue-400" : "text-slate-500"
                    )}
                 >
                     {isActive && (
                         <motion.div
                            layoutId="mobileNavBubble"
                            className="absolute -top-4 w-8 h-1 bg-blue-500 rounded-b-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                         />
                     )}
                     <Icon className={cn("h-6 w-6 mb-1", isActive && "drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]")} />
                     <span className="text-[10px]">{item.name}</span>
                 </Link>
             )
         })}
      </div>
    </div>
  );
};

export default Layout;
