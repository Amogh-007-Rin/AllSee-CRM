import React, { useEffect, useState } from 'react';
import api from '../services/api';
import DeviceList from '../components/DeviceList';
import { Users, Monitor, AlertTriangle, FileText, ArrowLeft, Download, Send } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ClientStats {
  id: string;
  name: string;
  totalScreens: number;
  atRisk: number;
}

interface Device {
  id: string;
  name: string;
  serialNumber: string;
  expiryDate: string;
}

interface Request {
  id: string;
  createdAt: string;
  notes: string;
  deviceIds: string[];
  requesterOrg: { name: string };
  requesterOrgId: string;
}

const ResellerDashboard: React.FC = () => {
  const [clients, setClients] = useState<ClientStats[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [prefillData, setPrefillData] = useState<{ clientId: string; deviceIds: string[]; requestId?: string } | null>(null);

  useEffect(() => {
    fetchClients();
    fetchRequests();
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

  const fetchRequests = async () => {
    try {
      const response = await api.get('/requests/reseller');
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch requests', error);
    }
  };

  const handleProcessRequest = (req: Request) => {
    setPrefillData({
      clientId: req.requesterOrgId,
      deviceIds: req.deviceIds || [],
      requestId: req.id
    });
    setShowQuoteModal(true);
  };

  const handleCloseModal = () => {
    setShowQuoteModal(false);
    setPrefillData(null);
  };

  const handleQuoteSent = () => {
    fetchRequests();
    handleCloseModal();
  };

  if (loading) return <div className="p-6">Loading...</div>;

  if (selectedClientId) {
    const clientName = clients.find(c => c.id === selectedClientId)?.name || 'Client';
    return (
      <div className="p-6">
        <button 
          onClick={() => setSelectedClientId(null)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Overview
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Managing: {clientName}</h2>
        <DeviceList clientId={selectedClientId} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reseller Portal</h1>
        <button 
          onClick={() => setShowQuoteModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <FileText className="h-4 w-4 mr-2" /> Generate Renewal Quote
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Incoming Requests</h3>
        </div>
        {requests.length === 0 ? (
          <div className="p-6 text-gray-500 text-center">No pending requests</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((req) => (
                <tr key={req.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.requesterOrg.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{req.notes}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleProcessRequest(req)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Process Quote
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Managed Clients</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Screens</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Screens at Risk</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500">
                    <Monitor className="h-4 w-4 mr-1 text-gray-400" />
                    {client.totalScreens}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {client.atRisk > 0 ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      <AlertTriangle className="h-3 w-3 mr-1 self-center" /> {client.atRisk} at risk
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      All Good
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => setSelectedClientId(client.id)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Manage Client
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showQuoteModal && (
        <QuoteGeneratorModal 
          clients={clients} 
          onClose={handleCloseModal} 
          onSuccess={handleQuoteSent}
          initialClientId={prefillData?.clientId}
          initialDeviceIds={prefillData?.deviceIds}
          requestId={prefillData?.requestId}
        />
      )}
    </div>
  );
};

const QuoteGeneratorModal: React.FC<{ 
  clients: ClientStats[], 
  onClose: () => void,
  onSuccess?: () => void,
  initialClientId?: string,
  initialDeviceIds?: string[],
  requestId?: string
}> = ({ clients, onClose, onSuccess, initialClientId, initialDeviceIds, requestId }) => {
  const [step, setStep] = useState(initialClientId ? 2 : 1);
  const [selectedClient, setSelectedClient] = useState(initialClientId || '');
  const [clientDevices, setClientDevices] = useState<Device[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>(initialDeviceIds || []);
  const [margin, setMargin] = useState(20);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    if (selectedClient) {
      api.get(`/dashboard/devices?clientId=${selectedClient}`).then(res => {
        setClientDevices(res.data);
      });
    } else {
      setClientDevices([]);
    }
  }, [selectedClient]);

  const handleGenerate = () => {
    if (selectedDevices.length === 0) return alert('Select at least one device');
    setShowInvoice(true);
  };

  const toggleDevice = (id: string) => {
    setSelectedDevices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-preview');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2 }); // Scale for better resolution
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('renewal-quote.pdf');
    } catch (error) {
      console.error('PDF generation failed', error);
      alert('Failed to generate PDF');
    }
  };

  const handleSendQuote = async () => {
    if (!requestId) return;

    const element = document.getElementById('invoice-preview');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Get base64 string without prefix
      const pdfBase64 = pdf.output('datauristring');

      await api.post(`/requests/${requestId}/respond`, {
        pdfData: pdfBase64,
        message: 'Here is your renewal quote.'
      });

      alert('Quote sent to Client!');
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to send quote', error);
      const errorMessage = error.response?.data?.message || 'Failed to send quote';
      alert(errorMessage);
    }
  };

  if (showInvoice) {
    const clientName = clients.find(c => c.id === selectedClient)?.name;
    const devices = clientDevices.filter(d => selectedDevices.includes(d.id));
    const basePrice = 100; // Mock base price per device
    const totalBase = devices.length * basePrice;
    const totalWithMargin = totalBase * (1 + margin / 100);

    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-500">
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div id="invoice-preview" className="border p-8 mb-6">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">INVOICE</h1>
                <p className="text-sm text-gray-500">Global Signs Partners Ltd</p>
                <p className="text-sm text-gray-500">123 Partner Way, London</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                <p className="text-sm text-gray-500">Bill To: {clientName}</p>
              </div>
            </div>

            <table className="min-w-full divide-y divide-gray-200 mb-8">
              <thead>
                <tr>
                  <th className="text-left py-2">Description</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {devices.map(d => (
                  <tr key={d.id}>
                    <td className="py-2">Renewal for {d.name} (S/N: {d.serialNumber})</td>
                    <td className="text-right py-2">£{(basePrice * (1 + margin / 100)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td className="py-4 font-bold">Total</td>
                  <td className="py-4 font-bold text-right">£{totalWithMargin.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            
            <p className="text-sm text-gray-500 italic">Thank you for your business.</p>
          </div>

          <div className="flex justify-end space-x-4">
            <button onClick={() => setShowInvoice(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Back to Edit
            </button>
            <button onClick={handleDownloadPDF} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center">
              <Download className="h-4 w-4 mr-2" /> Download PDF
            </button>
            {requestId && (
              <button onClick={handleSendQuote} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center">
                <Send className="h-4 w-4 mr-2" /> Send to Client
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Quote</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Client</label>
            <select 
              value={selectedClient} 
              onChange={(e) => setSelectedClient(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">Select a client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {selectedClient && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Devices</label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                  {clientDevices.map(device => (
                    <div key={device.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedDevices.includes(device.id)}
                        onChange={() => toggleDevice(device.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-900">{device.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Margin (%)</label>
                <input
                  type="number"
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button 
            onClick={handleGenerate}
            disabled={!selectedClient || selectedDevices.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResellerDashboard;