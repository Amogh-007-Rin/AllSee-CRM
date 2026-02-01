import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Check, X, Plus, Download, FileText, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QuoteGeneratorModal from './QuoteGeneratorModal';

interface RenewalRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'QUOTED';
  createdAt: string;
  notes: string;
  responseMessage?: string;
  quotePdfData?: string;
  deviceIds?: string[];
  requesterOrgId?: string;
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
  
  // Quote Processing State
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [prefillData, setPrefillData] = useState<{ clientId: string; deviceIds: string[]; requestId?: string } | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      // Use role-based endpoint selection
      const endpoint = user?.orgType === 'RESELLER' ? '/requests/reseller' : '/requests';
      const response = await api.get(endpoint);
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

  const handleProcessRequest = (req: RenewalRequest) => {
    if (!req.requesterOrgId) {
        alert("Cannot process request: Missing Requester ID");
        return;
    }
    setPrefillData({
      clientId: req.requesterOrgId,
      deviceIds: req.deviceIds || [],
      requestId: req.id
    });
    setShowQuoteModal(true);
  };

  const handleCloseQuoteModal = () => {
    setShowQuoteModal(false);
    setPrefillData(null);
  };

  const handleQuoteSuccess = () => {
    fetchRequests();
    handleCloseQuoteModal();
  };

  const downloadQuote = async (id: string) => {
    try {
      const response = await api.get(`/requests/${id}/quote`);
      const { pdfData } = response.data;
      
      const link = document.createElement('a');
      link.href = pdfData;
      link.download = `quote-${id.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download quote error:', error);
      alert('Failed to download quote.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold tracking-wide uppercase">Approved</span>
          </div>
        );
      case 'REJECTED':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
             <X className="h-3 w-3" />
             <span className="text-xs font-semibold tracking-wide uppercase">Rejected</span>
          </div>
        );
      case 'QUOTED':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
             <FileText className="h-3 w-3" />
             <span className="text-xs font-semibold tracking-wide uppercase">Quoted</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
             <Clock className="h-3 w-3" />
             <span className="text-xs font-semibold tracking-wide uppercase">Pending</span>
          </div>
        );
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Renewal Requests</h2>
           <p className="text-slate-500 text-sm mt-1">Track and manage license renewal inquiries.</p>
        </div>
        
        <div className="flex gap-3">
             {/* Proactive Quote Generation for Resellers */}
             {user?.orgType === 'RESELLER' && (
                <button
                    onClick={() => {
                        setPrefillData(null);
                        setShowQuoteModal(true);
                    }}
                    className="flex items-center px-4 py-2 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition-all border border-slate-700 hover:border-slate-600"
                >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Quote
                </button>
             )}

            {/* New Request Button */}
            {(user?.orgType === 'CHILD' || (user?.orgType === 'PARENT' && user?.billingMode === 'RESELLER_ONLY')) && (
            <button
                onClick={() => setShowNewRequestForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 border border-blue-500/50"
            >
                <Plus className="h-4 w-4 mr-2" />
                New Request
            </button>
            )}
        </div>
      </div>

      <AnimatePresence>
        {showNewRequestForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
            >
               {/* Decorative background glow */}
               <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
               
              <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center">
                 <Plus className="h-5 w-5 mr-2 text-blue-500" />
                 Submit Renewal Request
              </h3>
              <form onSubmit={handleCreateRequest}>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">Notes</label>
                  <textarea
                    value={newRequestNotes}
                    onChange={(e) => setNewRequestNotes(e.target.value)}
                    className="w-full border border-slate-700 bg-slate-950 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600 text-sm"
                    rows={4}
                    placeholder="Reason for renewal..."
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowNewRequestForm(false)}
                    className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 text-sm font-medium"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Quote Modal */}
      <AnimatePresence>
        {showQuoteModal && (
            <QuoteGeneratorModal 
                onClose={handleCloseQuoteModal}
                onSuccess={handleQuoteSuccess}
                initialClientId={prefillData?.clientId}
                initialDeviceIds={prefillData?.deviceIds}
                requestId={prefillData?.requestId}
            />
        )}
      </AnimatePresence>

      <div className="bg-slate-900/40 backdrop-blur-md rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        <table className="min-w-full divide-y divide-slate-800/50">
          <thead className="bg-slate-900/80">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Requester</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Notes</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                   <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                      <span className="text-sm">Loading requests...</span>
                   </div>
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center mb-3 text-slate-600">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <p className="text-slate-400 font-medium">No requests found</p>
                        <p className="text-xs text-slate-600 mt-1">New renewal requests will appear here.</p>
                    </div>
                </td>
              </tr>
            ) : (
              requests.map((request, index) => (
                <motion.tr 
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="group hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-slate-600" />
                        {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">
                    {request.requesterOrg?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400 max-w-xs truncate">
                    {request.notes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {/* Parent Approval Actions (for Child Requests) */}
                    {user?.orgType === 'PARENT' && request.requesterOrg.type === 'CHILD' && request.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="p-1.5 rounded bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="p-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30 transition-colors"
                          title="Reject"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Reseller Process Actions (Generate Quote) */}
                    {/* Assuming Resellers see requests from their managed orgs */}
                    {user?.orgType === 'PARENT' && user?.billingMode !== 'RESELLER_ONLY' && request.status === 'PENDING' && request.requesterOrg.type !== 'CHILD' && (
                        // If standard parent sees other requests? Maybe not relevant.
                        null
                    )}

                    {/* Reseller Logic: If I am a reseller/parent and I see a pending request that needs a quote */}
                    {/* The logic for 'who can process quotes' depends on user role. Assuming Parent/Reseller can process. */}
                    {(user?.orgType === 'PARENT' || user?.orgType === 'RESELLER' || user?.billingMode === 'RESELLER_ONLY') && request.status === 'PENDING' && (
                        <button
                            onClick={() => handleProcessRequest(request)}
                            className="text-blue-400 hover:text-blue-300 text-xs font-medium border border-blue-500/30 px-3 py-1.5 rounded hover:bg-blue-500/10 transition-all"
                        >
                            Process Quote
                        </button>
                    )}
                    
                    {/* Quote Download Action (for Parent/Child viewing their own request) */}
                    {request.status === 'QUOTED' && (
                      <button
                        onClick={() => downloadQuote(request.id)}
                        className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                        title="Download Quote"
                      >
                        <Download className="h-4 w-4 mr-1" /> 
                        <span className="text-xs">PDF</span>
                      </button>
                    )}

                    {/* Placeholder for no actions */}
                    {request.status !== 'QUOTED' && 
                     !(user?.orgType === 'PARENT' && request.requesterOrg.type === 'CHILD' && request.status === 'PENDING') &&
                     !((user?.orgType === 'PARENT' || user?.orgType === 'RESELLER' || user?.billingMode === 'RESELLER_ONLY') && request.status === 'PENDING') && (
                       <span className="text-slate-600">-</span>
                    )}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequestManager;