import React, { useState, useEffect } from 'react';
import api from '../services/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Send, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClientStats {
  id: string;
  name: string;
}

interface Device {
  id: string;
  name: string;
  serialNumber: string;
}

interface QuoteGeneratorModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  initialClientId?: string;
  initialDeviceIds?: string[];
  requestId?: string;
}

const QuoteGeneratorModal: React.FC<QuoteGeneratorModalProps> = ({ 
  onClose, 
  onSuccess, 
  initialClientId, 
  initialDeviceIds, 
  requestId 
}) => {
  const [clients, setClients] = useState<ClientStats[]>([]);
  const [selectedClient, setSelectedClient] = useState(initialClientId || '');
  const [clientDevices, setClientDevices] = useState<Device[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>(initialDeviceIds || []);
  const [margin, setMargin] = useState(20);
  const [showInvoice, setShowInvoice] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch clients if not provided (though for this use case we mostly use initialClientId)
    const fetchClients = async () => {
        try {
            const res = await api.get('/dashboard/clients');
            setClients(res.data);
        } catch (error) {
            console.error("Failed to fetch clients", error);
        }
    };
    fetchClients();
  }, []);

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
      const canvas = await html2canvas(element, { scale: 2 });
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
    setLoading(true);

    const element = document.getElementById('invoice-preview');
    if (!element) {
        setLoading(false);
        return;
    }

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const pdfBase64 = pdf.output('datauristring');

      await api.post(`/requests/${requestId}/respond`, {
        pdfData: pdfBase64,
        message: 'Here is your renewal quote.'
      });

      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to send quote', error);
      const errorMessage = error.response?.data?.message || 'Failed to send quote';
      alert(errorMessage);
    } finally {
        setLoading(false);
    }
  };

  if (showInvoice) {
    const clientName = clients.find(c => c.id === selectedClient)?.name || 'Client';
    const devices = clientDevices.filter(d => selectedDevices.includes(d.id));
    const basePrice = 100; // Mock base price
    const totalBase = devices.length * basePrice;
    const totalWithMargin = totalBase * (1 + margin / 100);

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div 
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full p-8 border border-slate-800 relative max-h-[90vh] overflow-y-auto"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
          
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold text-slate-100">Preview Quote</h2>
             <div className="flex space-x-3">
                <button onClick={() => setShowInvoice(false)} className="px-4 py-2 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
                  Edit Details
                </button>
                <button onClick={handleDownloadPDF} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 flex items-center transition-colors">
                  <Download className="h-4 w-4 mr-2" /> Download PDF
                </button>
                {requestId && (
                  <button 
                    onClick={handleSendQuote} 
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 flex items-center transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    ) : (
                        <Send className="h-4 w-4 mr-2" />
                    )}
                    Send to Client
                  </button>
                )}
             </div>
          </div>
          
          {/* Invoice Preview - Keep White for Paper Look */}
          <div className="bg-white rounded-lg p-1 overflow-auto">
              <div id="invoice-preview" className="bg-white p-12 min-h-[600px] text-slate-900">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">INVOICE</h1>
                    <p className="text-sm text-slate-500 font-medium">Global Signs Partners Ltd</p>
                    <p className="text-sm text-slate-500">123 Partner Way, London</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Date: {new Date().toLocaleDateString()}</p>
                    <p className="text-sm text-slate-500">Bill To: <span className="font-semibold text-slate-900">{clientName}</span></p>
                  </div>
                </div>

                <table className="min-w-full mb-12">
                  <thead>
                    <tr className="border-b-2 border-slate-100">
                      <th className="text-left py-3 text-sm font-bold text-slate-900 uppercase tracking-wider">Description</th>
                      <th className="text-right py-3 text-sm font-bold text-slate-900 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {devices.map(d => (
                      <tr key={d.id}>
                        <td className="py-4 text-sm text-slate-700">Renewal for {d.name} <span className="text-slate-400">(S/N: {d.serialNumber})</span></td>
                        <td className="text-right py-4 text-sm font-mono text-slate-900">£{(basePrice * (1 + margin / 100)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-900">
                      <td className="py-4 font-bold text-lg text-slate-900">Total</td>
                      <td className="py-4 font-bold text-lg text-right font-mono text-slate-900">£{totalWithMargin.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
                
                <div className="border-t border-slate-100 pt-8">
                    <p className="text-sm text-slate-500 italic text-center">Thank you for your business. Please pay within 30 days.</p>
                </div>
              </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div 
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-800"
      >
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-100">Generate Quote</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
            </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Select Client</label>
            <select 
              value={selectedClient} 
              onChange={(e) => setSelectedClient(e.target.value)}
              disabled={!!initialClientId}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-3 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select a client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {selectedClient && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Select Devices</label>
                <div className="max-h-48 overflow-y-auto border border-slate-700 rounded-lg p-2 space-y-2 bg-slate-950/50 custom-scrollbar">
                  {clientDevices.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No devices found for this client.</p>
                  ) : (
                      clientDevices.map(device => (
                        <div key={device.id} className="flex items-center hover:bg-slate-800/50 p-2 rounded transition-colors cursor-pointer" onClick={() => toggleDevice(device.id)}>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${selectedDevices.includes(device.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-600'}`}>
                              {selectedDevices.includes(device.id) && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className="text-sm text-slate-300">{device.name}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Margin (%)</label>
                <div className="relative">
                    <input
                    type="number"
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-3 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                    <div className="absolute right-3 top-2.5 text-slate-500 text-sm">%</div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
            Cancel
          </button>
          <button 
            onClick={handleGenerate}
            disabled={!selectedClient || selectedDevices.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Preview
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuoteGeneratorModal;