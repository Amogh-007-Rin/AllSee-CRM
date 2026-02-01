import React from 'react';
import { motion } from 'framer-motion';
import { Ban, Smartphone, MapPin, Clock, ChevronRight, Trash2 } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  serialNumber: string;
  status: string;
  expiryDate: string;
  location: string;
  organization: {
    name: string;
  };
  graceTokenExpiry?: string | null;
  activeRenewalRequest?: boolean;
}

interface DeviceTableProps {
  devices: Device[];
  loading: boolean;
  user: any;
  onRenew: (device: Device) => void;
  onRemove: (device: Device) => void;
  selected: string[];
  onSelect: (ids: string[]) => void;
}

const DeviceTable: React.FC<DeviceTableProps> = ({ 
  devices, 
  loading, 
  user, 
  onRenew,
  onRemove,
  selected, 
  onSelect 
}) => {

  const getStatusBadge = (status: string, graceExpiry?: string | null) => {
    if (graceExpiry && new Date(graceExpiry) > new Date()) {
       return (
         <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
           <span className="relative flex h-2 w-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
           </span>
           <span className="text-xs font-semibold tracking-wide uppercase">Grace Period</span>
         </div>
       );
    }

    switch (status) {
      case 'ACTIVE':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold tracking-wide uppercase">Active</span>
          </div>
        );
      case 'EXPIRING_SOON':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-xs font-semibold tracking-wide uppercase">Expiring</span>
          </div>
        );
      case 'EXPIRED':
      case 'SUSPENDED':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
            <Ban className="h-3 w-3" />
            <span className="text-xs font-semibold tracking-wide uppercase">Suspended</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400">
            <span className="text-xs font-semibold tracking-wide uppercase">{status}</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
        <div className="p-8 text-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            Loading fleet data...
        </div>
    );
  }

  if (devices.length === 0) {
    return (
        <div className="p-12 text-center border border-slate-800 rounded-xl bg-slate-900/40 text-slate-400">
            <Smartphone className="h-12 w-12 mx-auto mb-4 text-slate-600" />
            <p className="text-lg">No devices found in the network.</p>
        </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop View */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm shadow-xl">
        <table className="min-w-full divide-y divide-slate-800/50">
          <thead className="bg-slate-900/80">
            <tr>
              {user?.orgType === 'PARENT' && (
                <th className="px-6 py-4 text-left">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0"
                    onChange={(e) => {
                        if (e.target.checked) onSelect(devices.map(d => d.id));
                        else onSelect([]);
                    }}
                    checked={selected.length === devices.length && devices.length > 0}
                  />
                </th>
              )}
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Device Name</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Serial / ID</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Location</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Organization</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Expiry</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {devices.map((device) => (
              <motion.tr 
                key={device.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="group hover:bg-blue-500/5 transition-colors"
              >
                {user?.orgType === 'PARENT' && (
                  <td className="px-8 py-5 whitespace-nowrap">
                     <input 
                        type="checkbox" 
                        className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0"
                        checked={selected.includes(device.id)}
                        onChange={() => {
                            if (selected.includes(device.id)) onSelect(selected.filter(id => id !== device.id));
                            else onSelect([...selected, device.id]);
                        }}
                     />
                  </td>
                )}
                <td className="px-8 py-5 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                        <Smartphone className="h-5 w-5" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">{device.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 whitespace-nowrap">
                    <div className="text-sm text-slate-400 font-mono">{device.serialNumber}</div>
                </td>
                <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center text-sm text-slate-400">
                        <MapPin className="h-4 w-4 mr-2 text-slate-600" />
                        {device.location}
                    </div>
                </td>
                <td className="px-8 py-5 whitespace-nowrap">
                    <div className="text-sm text-slate-300 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50 inline-block">
                        {device.organization.name}
                    </div>
                </td>
                <td className="px-8 py-5 whitespace-nowrap">
                  {getStatusBadge(device.status, device.graceTokenExpiry)}
                </td>
                <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center text-sm text-slate-400">
                        <Clock className="h-4 w-4 mr-2 text-slate-600" />
                        {new Date(device.expiryDate).toLocaleDateString()}
                    </div>
                </td>
                <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
                    {(device.status === 'EXPIRING_SOON' || device.status === 'ACTIVE') && (
                         device.activeRenewalRequest ? (
                            <span className="text-slate-500 italic text-xs">Processing...</span>
                         ) : (
                            <button
                                onClick={() => onRenew(device)}
                                className="group/btn relative inline-flex items-center justify-center overflow-hidden rounded-md bg-transparent px-4 py-2 font-medium text-blue-400 transition-all duration-300 hover:w-32 hover:bg-blue-500/10 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400"
                            >
                                <span className="mr-2">Renew</span>
                                <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 transition-opacity duration-500 group-hover/btn:opacity-100" />
                            </button>
                         )
                    )}
                    {(device.status === 'EXPIRED' || device.status === 'SUSPENDED') && (
                        <div className="flex items-center justify-end gap-2">
                             {!device.activeRenewalRequest && (
                                <button
                                    onClick={() => onRenew(device)}
                                    className="text-blue-400 hover:text-blue-300 transition-colors text-xs font-medium border border-blue-500/30 rounded px-2 py-1"
                                >
                                    Renew
                                </button>
                             )}
                            <button
                                onClick={() => onRemove(device)}
                                className="group/btn relative inline-flex items-center justify-center overflow-hidden rounded-md bg-red-500/10 px-3 py-1.5 font-medium text-red-400 transition-all duration-300 hover:bg-red-500/20 border border-red-500/30 hover:border-red-400"
                            >
                                <span className="mr-1">Remove Screen</span>
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {devices.map((device) => (
            <motion.div 
                key={device.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 backdrop-blur-md shadow-lg"
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                            <Smartphone className="h-5 w-5" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-slate-200 font-semibold">{device.name}</h3>
                            <p className="text-xs text-slate-500 font-mono">{device.serialNumber}</p>
                        </div>
                    </div>
                    {getStatusBadge(device.status, device.graceTokenExpiry)}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-800/30 p-2 rounded">
                        <span className="text-xs text-slate-500 block mb-1">Location</span>
                        <div className="flex items-center text-sm text-slate-300">
                            <MapPin className="h-3 w-3 mr-1" /> {device.location}
                        </div>
                    </div>
                    <div className="bg-slate-800/30 p-2 rounded">
                        <span className="text-xs text-slate-500 block mb-1">Expiry</span>
                        <div className="flex items-center text-sm text-slate-300">
                            <Clock className="h-3 w-3 mr-1" /> {new Date(device.expiryDate).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-800/50">
                    <span className="text-xs text-slate-500">{device.organization.name}</span>
                    {(device.status === 'EXPIRING_SOON' || device.status === 'ACTIVE') && !device.activeRenewalRequest && (
                        <button
                            onClick={() => onRenew(device)}
                            className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center"
                        >
                            Renew License <ChevronRight className="h-4 w-4 ml-1" />
                        </button>
                    )}
                     {(device.status === 'EXPIRED' || device.status === 'SUSPENDED') && (
                        <div className="flex items-center gap-3">
                            {!device.activeRenewalRequest && (
                                <button
                                    onClick={() => onRenew(device)}
                                    className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                                >
                                    Renew
                                </button>
                            )}
                            <button
                                onClick={() => onRemove(device)}
                                className="text-sm text-red-400 hover:text-red-300 font-medium flex items-center"
                            >
                                Remove <Trash2 className="h-3 w-3 ml-1" />
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DeviceTable;
