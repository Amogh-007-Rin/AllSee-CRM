import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, Map as MapIcon, List } from 'lucide-react';
import DeviceMap from './DeviceMap';

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
}

const DeviceList: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const { user } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);

  const [locationSearch, setLocationSearch] = useState('');

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await api.get('/dashboard/devices');
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

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkRenew = async () => {
    if (selected.length === 0) { alert('Select devices first'); return; }
    const years = Number(window.prompt('Renew for how many years?', '1')) || 1;
    try {
      await api.post('/devices/bulk-renew', { deviceIds: selected, years });
      setSelected([]);
      fetchDevices();
      alert('Devices renewed');
    } catch (error) {
      console.error('Bulk renew failed', error);
      alert('Bulk renew failed');
    }
  };

  const handleCoTerm = async () => {
    if (selected.length === 0) { alert('Select devices first'); return; }
    const input = window.prompt('Enter target date (YYYY-MM-DD) or leave blank to align to end of year');
    try {
      await api.post('/devices/co-term', { deviceIds: selected, targetDate: input });
      setSelected([]);
      fetchDevices();
      alert('Devices co-termed');
    } catch (error) {
      console.error('Co-term failed', error);
      alert('Co-term failed');
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

  const handleRequestRenewal = async (id: string, name: string) => {
    try {
      await api.post('/requests', { notes: `Request for device ${name}`, deviceIds: [id] });
      alert('Request sent');
    } catch (error) {
      console.error('Request failed', error);
      alert('Request failed');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Devices</h2>
        <div className="flex space-x-4 items-center">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="List View"
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'map' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Map View"
            >
              <MapIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 w-64"
            />
          </div>
          <div className="relative">
            <MapIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search screen by location..."
              value={locationSearch}
              onChange={(e) => {
                setLocationSearch(e.target.value);
                if (e.target.value) setViewMode('map');
              }}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 w-64"
            />
          </div>
        </div>
      </div>

      {user?.orgType === 'PARENT' && viewMode === 'list' && (
        <div className="mb-4 space-x-2">
          <button onClick={handleBulkRenew} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Bulk Renew</button>
          <button onClick={handleCoTerm} className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">Co-Term</button>
          <button onClick={() => handleIssueGrace()} className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600">Issue Grace</button>
        </div>
      )}

      {viewMode === 'map' ? (
        <DeviceMap devices={filteredDevices} searchLocation={locationSearch} />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {user?.orgType === 'PARENT' && <th className="px-6 py-3 text-left"><input type="checkbox" onChange={(e) => {
                  if (e.target.checked) setSelected(filteredDevices.map(d => d.id));
                  else setSelected([]);
                }} checked={selected.length === filteredDevices.length && filteredDevices.length > 0} /></th>}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={user?.orgType === 'PARENT' ? 8 : 7} className="px-6 py-4 text-center">Loading...</td></tr>
              ) : filteredDevices.length === 0 ? (
                <tr><td colSpan={user?.orgType === 'PARENT' ? 8 : 7} className="px-6 py-4 text-center">No devices found</td></tr>
              ) : (
                filteredDevices.map((device) => (
                  <tr key={device.id} className={selected.includes(device.id) ? 'bg-blue-50' : ''}>
                    {user?.orgType === 'PARENT' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input 
                          type="checkbox" 
                          checked={selected.includes(device.id)} 
                          onChange={() => toggleSelect(device.id)}
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{device.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.serialNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.organization.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${device.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                          device.status === 'EXPIRING_SOON' ? 'bg-yellow-100 text-yellow-800' : 
                          device.status === 'EXPIRED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                        {device.status}
                      </span>
                      {device.graceTokenExpiry && new Date(device.graceTokenExpiry) > new Date() && (
                         <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                           Grace Active
                         </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(device.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {user?.orgType === 'CHILD' && (device.status === 'EXPIRING_SOON' || device.status === 'EXPIRED') && (
                        <button 
                          onClick={() => handleRequestRenewal(device.id, device.name)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Renew
                        </button>
                      )}
                      {user?.orgType === 'PARENT' && device.status === 'EXPIRED' && (
                        <button 
                          onClick={() => handleIssueGrace(device.id)}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          Grace
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DeviceList;