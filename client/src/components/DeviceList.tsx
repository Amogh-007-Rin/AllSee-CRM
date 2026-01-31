import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  serialNumber: string;
  status: string;
  expiryDate: string;
  graceTokenExpiry?: string | null;
  location: string;
  organization: {
    name: string;
  };
}

const DeviceList: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);

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
    try {
      await api.post(`/devices/${targetId}/grace-token`);
      fetchDevices();
      alert('Grace token issued');
    } catch (error) {
      console.error('Grace token failed', error);
      alert('Grace token failed');
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
      </div>

      <div className="flex justify-between items-center mb-4">
        {user?.orgType === 'PARENT' && (
          <div className="flex gap-2">
            <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={handleBulkRenew}>Bulk Renew</button>
            <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={handleCoTerm}>Co-Term</button>
            <button className="px-3 py-2 bg-yellow-600 text-white rounded" onClick={() => handleIssueGrace()}>Issue Grace (selected)</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3"><input type="checkbox" checked={selected.length === devices.length && devices.length > 0} onChange={(e) => {
                if (e.target.checked) setSelected(devices.map(d => d.id)); else setSelected([]);
              }} /></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center">Loading...</td></tr>
            ) : filteredDevices.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center">No devices found</td></tr>
            ) : (
              filteredDevices.map((device) => (
                <tr key={device.id}>
                  <td className="px-4 py-4"><input type="checkbox" checked={selected.includes(device.id)} onChange={() => toggleSelect(device.id)} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{device.name}
                    {device.graceTokenExpiry && (
                      <div className="text-xs text-orange-600">Grace until {new Date(device.graceTokenExpiry).toLocaleDateString()}</div>
                    )}
                  </td>
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(device.expiryDate).toLocaleDateString()}
                    <div className="mt-2">
                      {user?.orgType === 'CHILD' && device.status !== 'ACTIVE' && (
                        <button className="px-2 py-1 bg-blue-500 text-white rounded text-xs" onClick={() => handleRequestRenewal(device.id, device.name)}>Request Renewal</button>
                      )}

                      {user?.orgType === 'PARENT' && (
                        <div className="flex gap-2">
                          <button className="px-2 py-1 bg-green-500 text-white rounded text-xs" onClick={() => handleIssueGrace(device.id)}>Issue Grace</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeviceList;
