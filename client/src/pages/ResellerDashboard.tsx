import React, { useEffect, useState } from 'react';
import api from '../services/api';
import DeviceList from '../components/DeviceList';
import { Users, Monitor, AlertTriangle, ArrowLeft, ShieldCheck, Activity, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface ClientStats {
  id: string;
  name: string;
  totalScreens: number;
  atRisk: number;
}

const ResellerDashboard: React.FC = () => {
  const [clients, setClients] = useState<ClientStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('/dashboard/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Failed to fetch clients', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-400 animate-pulse">Initializing Command Center...</p>
        </div>
    );
  }

  if (selectedClientId) {
    const clientName = clients.find(c => c.id === selectedClientId)?.name || 'Client';
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedClientId(null)}
          className="flex items-center text-slate-400 hover:text-blue-400 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
          Back to Command Center
        </button>
        
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center">
                <div className="h-8 w-8 rounded-lg bg-blue-600/20 flex items-center justify-center mr-3 border border-blue-500/30">
                    <Users className="h-5 w-5 text-blue-400" />
                </div>
                Managing: <span className="text-blue-400 ml-2">{clientName}</span>
            </h2>
        </div>
        
        <DeviceList clientId={selectedClientId} />
      </div>
    );
  }

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalClients = clients.length;
  const totalScreens = clients.reduce((acc, c) => acc + c.totalScreens, 0);
  const totalAtRisk = clients.reduce((acc, c) => acc + c.atRisk, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Reseller Command Center</h1>
           <p className="text-slate-500 mt-1">Monitor and manage your client fleet performance.</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600"
            />
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-colors"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="h-24 w-24 text-blue-500" />
            </div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Clients</p>
            <p className="text-4xl font-bold text-slate-100 mt-2">{totalClients}</p>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-colors"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Monitor className="h-24 w-24 text-purple-500" />
            </div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Screens</p>
            <p className="text-4xl font-bold text-slate-100 mt-2">{totalScreens}</p>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 relative overflow-hidden group hover:border-red-500/30 transition-colors"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <AlertTriangle className="h-24 w-24 text-red-500" />
            </div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">At Risk</p>
            <p className="text-4xl font-bold text-red-400 mt-2">{totalAtRisk}</p>
        </motion.div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-md rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/60">
          <h3 className="text-lg font-medium text-slate-200 flex items-center">
            <ShieldCheck className="h-5 w-5 mr-2 text-emerald-500" />
            Managed Client Portfolio
          </h3>
        </div>
        
        {filteredClients.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No clients found matching your search.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800/50">
                <thead className="bg-slate-900/80">
                    <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Client Name</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Fleet Size</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Health Status</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                    {filteredClients.map((client, index) => (
                    <motion.tr 
                        key={client.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group hover:bg-slate-800/30 transition-colors"
                    >
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 group-hover:border-blue-500/50 transition-colors">
                                <Users className="h-5 w-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                            </div>
                            <div className="ml-4">
                                <div className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{client.name}</div>
                                <div className="text-xs text-slate-500">ID: {client.id.slice(0, 8)}...</div>
                            </div>
                        </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-slate-400">
                            <Monitor className="h-4 w-4 mr-2 text-slate-600" />
                            <span className="font-mono">{client.totalScreens}</span>
                        </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        {client.atRisk > 0 ? (
                            <div className="flex items-center">
                                <span className="relative flex h-2 w-2 mr-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                <span className="text-xs font-medium text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                                    {client.atRisk} At Risk
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                    Healthy
                                </span>
                            </div>
                        )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                            onClick={() => setSelectedClientId(client.id)}
                            className="text-blue-400 hover:text-blue-300 font-medium px-3 py-1.5 hover:bg-blue-500/10 rounded-md transition-all border border-transparent hover:border-blue-500/20"
                        >
                            Manage Fleet
                        </button>
                        </td>
                    </motion.tr>
                    ))}
                </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};

export default ResellerDashboard;