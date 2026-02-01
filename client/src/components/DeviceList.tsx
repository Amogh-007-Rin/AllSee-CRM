import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, Map as MapIcon, List, X } from 'lucide-react';
import DeviceMap from './DeviceMap';
import DeviceTable from './DeviceTable';

interface Device {
  id: string;
  name: string;
  serialNumber: string;
  status: string;
  expiryDate: string;
  graceTokenExpiry?: string | null;
  location: string;
  latitude?: number;
  longitude?: number;
  organization: {
    name: string;
  };
  activeRenewalRequest?: boolean;
}

const DeviceList: React.FC<{ clientId?: string }> = ({ clientId }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const { user } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    fetchDevices();
  }, [clientId]);

  const fetchDevices = async () => {
    try {
      const url = clientId ? `/dashboard/devices?clientId=${clientId}` : '/dashboard/devices';
      const response = await api.get(url);
      setDevices(response.data);
    } catch (error) {
      console.error('Failed to fetch devices', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDevices = devices.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.organization.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMapRenew = (device: Device) => {
    if (user?.orgType === 'CHILD') {
      handleRequestRenewal(device.id, device.name);
    } else if (user?.orgType === 'PARENT' || user?.orgType === 'RESELLER') {
      if (user.billingMode === 'RESELLER_ONLY' && user.orgType === 'PARENT') {
        handleRequestQuote([device.id]);
      } else {
        const years = Number(window.prompt(`Renew ${device.name} for how many years?`, '1')) || 1;
        api.post('/devices/bulk-renew', { deviceIds: [device.id], years })
           .then(() => {
             alert('Device renewed successfully');
             fetchDevices();
           })
           .catch((err) => {
             console.error('Renew failed', err);
             alert('Renew failed');
           });
      }
    }
  };

  const handleBulkRenew = async () => {
    if (selected.length === 0) return;
    
    if (user?.billingMode === 'RESELLER_ONLY') {
      handleRequestQuote(selected);
      return;
    }

    const years = Number(window.prompt(`Renew ${selected.length} devices for how many years?`, '1')) || 1;
    try {
      await api.post('/devices/bulk-renew', { deviceIds: selected, years });
      alert('Bulk renewal successful');
      fetchDevices();
      setSelected([]);
    } catch (error) {
      console.error('Bulk renew failed', error);
      alert('Bulk renew failed');
    }
  };

  const handleIssueGrace = async (id?: string) => {
    const targetId = id || (selected.length === 1 ? selected[0] : undefined);
    if (!targetId) { alert('Select a single device or pass an id'); return; }

    // Client-side validation
    const device = devices.find(d => d.id === targetId);
    if (device && device.status !== 'EXPIRED') {
      alert('Grace period can only be issued to EXPIRED devices.');
      return;
    }

    try {
      await api.post(`/devices/${targetId}/grace-token`);
      fetchDevices();
      alert('Grace token issued');
    } catch (error: any) {
      console.error('Grace token failed', error);
      alert(error.response?.data?.message || 'Grace token failed');
    }
  };

  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [targetRenewal, setTargetRenewal] = useState<{id: string, name: string} | null>(null);

  // Quote Request State
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteNotes, setQuoteNotes] = useState('');
  const [targetQuoteDevices, setTargetQuoteDevices] = useState<string[]>([]);

  const handleRequestRenewal = (id: string, name: string) => {
    setTargetRenewal({ id, name });
    setRenewalModalOpen(true);
  };

  const handleRequestQuote = (deviceIds: string[]) => {
    setTargetQuoteDevices(deviceIds);
    setQuoteModalOpen(true);
  };

  const confirmQuoteRequest = async () => {
    try {
      await api.post('/requests', { 
        notes: `Quote Request: ${quoteNotes}`, 
        deviceIds: targetQuoteDevices,
        type: 'QUOTE' 
      });
      alert('Quote Request sent to Account Manager.');
      setQuoteModalOpen(false);
      setQuoteNotes('');
      setTargetQuoteDevices([]);
      fetchDevices();
    } catch (error) {
      console.error('Quote Request failed', error);
      alert('Quote Request failed');
    }
  };

  const submitRenewalRequest = async (notes: string) => {
    if (!targetRenewal) return;
    try {
      await api.post('/requests', { 
        deviceIds: [targetRenewal.id], 
        notes,
        type: 'RENEWAL' 
      });
      alert('Renewal request sent');
      setRenewalModalOpen(false);
      setTargetRenewal(null);
      fetchDevices();
    } catch (error) {
      console.error('Failed to request renewal', error);
      alert('Failed to send request');
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Device Fleet</h2>
            <p className="text-slate-500 text-sm mt-1">Manage and monitor all connected endpoints.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          {/* View Toggles */}
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:text-slate-300'}`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-md transition-all ${viewMode === 'map' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:text-slate-300'}`}
              title="Map View"
            >
              <MapIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
            <input
              type="text"
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full md:w-64 text-slate-200 placeholder-slate-600 text-sm"
            />
          </div>

          {/* Action Buttons */}
          {user?.orgType === 'PARENT' && selected.length > 0 && (
            <div className="flex gap-2">
               <button
                  onClick={handleBulkRenew}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                >
                  Renew Selected ({selected.length})
                </button>
                <button
                  onClick={() => handleIssueGrace()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-purple-500/20"
                >
                  Issue Grace
                </button>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
            <DeviceMap 
              devices={filteredDevices} 
              searchLocation={searchTerm} 
              user={user}
              onRenew={handleMapRenew}
            />
        </div>
      ) : (
        <DeviceTable 
            devices={filteredDevices}
            loading={loading}
            user={user}
            onRenew={handleMapRenew}
            selected={selected}
            onSelect={setSelected}
            onRemove={(device) => {
                if (window.confirm(`Are you sure you want to remove ${device.name}? This action cannot be undone.`)) {
                    api.delete(`/devices/${device.id}`)
                       .then(() => {
                           // Refresh list
                           fetchDevices();
                           // Remove from selected if needed
                           if (selected.includes(device.id)) {
                               setSelected(selected.filter(id => id !== device.id));
                           }
                       })
                       .catch(err => {
                           console.error("Failed to delete device", err);
                           alert("Failed to remove device");
                       });
                }
            }}
        />
      )}

      {/* Renewal Modal */}
      {renewalModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
             <div className="flex justify-between items-start mb-4">
               <h3 className="text-lg font-bold text-slate-100">Request Renewal</h3>
               <button onClick={() => setRenewalModalOpen(false)} className="text-slate-400 hover:text-white">
                 <X className="h-5 w-5" />
               </button>
            </div>
            <p className="mb-4 text-slate-400 text-sm">
              Requesting renewal for: <span className="font-semibold text-white">{targetRenewal?.name}</span>
            </p>
            <textarea
              className="w-full border border-slate-700 bg-slate-950 rounded-lg p-3 mb-4 text-slate-200 focus:outline-none focus:border-blue-500 text-sm"
              placeholder="Add notes for the admin (optional)..."
              id="renewalNotes"
              rows={3}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setRenewalModalOpen(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => submitRenewalRequest((document.getElementById('renewalNotes') as HTMLTextAreaElement).value)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 text-sm font-medium"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quote Modal */}
      {quoteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-start mb-4">
               <h3 className="text-lg font-bold text-slate-100">Request Quote</h3>
               <button onClick={() => setQuoteModalOpen(false)} className="text-slate-400 hover:text-white">
                 <X className="h-5 w-5" />
               </button>
            </div>
            <p className="mb-4 text-slate-400 text-sm">
              Requesting quote for {targetQuoteDevices.length} devices.
            </p>
            <textarea
              className="w-full border border-slate-700 bg-slate-950 rounded-lg p-3 mb-4 text-slate-200 focus:outline-none focus:border-blue-500 text-sm"
              placeholder="Additional notes..."
              value={quoteNotes}
              onChange={(e) => setQuoteNotes(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setQuoteModalOpen(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmQuoteRequest}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 text-sm font-medium"
              >
                Send Quote Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceList;