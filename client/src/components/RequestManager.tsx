import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Check, X, Plus } from 'lucide-react';

interface RenewalRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  notes: string;
  requesterOrg: {
    name: string;
    type: string;
  };
}

const RequestManager: React.FC = () => {
  const [requests, setRequests] = useState<RenewalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [newRequestNotes, setNewRequestNotes] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch requests', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/requests', { notes: newRequestNotes });
      setShowNewRequestForm(false);
      setNewRequestNotes('');
      fetchRequests(); // Refresh list
    } catch (error) {
      console.error('Failed to create request', error);
      alert('Failed to create request');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/requests/${id}/approve`);
      fetchRequests();
    } catch (error) {
      console.error('Failed to approve request', error);
      alert('Failed to approve request');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/requests/${id}/reject`);
      fetchRequests();
    } catch (error) {
      console.error('Failed to reject request', error);
      alert('Failed to reject request');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Renewal Requests</h2>
        {user?.orgType === 'CHILD' && (
          <button
            onClick={() => setShowNewRequestForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </button>
        )}
      </div>

      {showNewRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Submit Renewal Request</h3>
            <form onSubmit={handleCreateRequest}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newRequestNotes}
                  onChange={(e) => setNewRequestNotes(e.target.value)}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Reason for renewal..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewRequestForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              {user?.orgType === 'PARENT' && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">No requests found</td></tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {request.requesterOrg?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {request.notes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${request.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                        request.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {request.status}
                    </span>
                  </td>
                  {user?.orgType === 'PARENT' && request.status === 'PENDING' && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="text-green-600 hover:text-green-900 mr-4"
                        title="Approve"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Reject"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </td>
                  )}
                  {user?.orgType === 'PARENT' && request.status !== 'PENDING' && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-400">
                      -
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequestManager;
