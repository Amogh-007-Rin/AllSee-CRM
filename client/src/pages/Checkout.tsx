import React, { useState, useEffect } from 'react';
import { jsPDF } from "jspdf";
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Wallet, CheckCircle, Smartphone, ArrowRight, Download, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Define types for the location state
interface Device {
  id: string;
  name: string;
  serialNumber: string;
  organization?: {
    name: string;
  };
}

interface CheckoutState {
  devices: Device[];
}

const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = location.state as CheckoutState;

  // State
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'google'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [cardName, setCardName] = useState('');
  
  // Initialize with selected devices or empty array
  const selectedDevices = state?.devices || [];
  const costPerDevice = 200;
  const subtotal = selectedDevices.length * costPerDevice;
  const tax = subtotal * 0.2; // 20% VAT assumption or 0 based on requirements (User didn't specify tax, but "Total Due" implies calculation. I'll stick to simple subtotal = total for now as per prompt "Subtotal calculation... Total Due")
  const total = subtotal; // Keeping it simple as per prompt

  useEffect(() => {
    // Pre-fill name for Reseller
    if (user?.orgType === 'RESELLER' || user?.orgType === 'PARTNER') {
      setCardName('Global Signs Partners');
    }
  }, [user]);

  useEffect(() => {
    if (!state?.devices || state.devices.length === 0) {
      // Redirect back if no devices selected (optional safety)
      // navigate('/');
    }
  }, [state, navigate]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate network delay
    setTimeout(async () => {
      try {
        const deviceIds = selectedDevices.map(d => d.id);
        // Using the endpoint specified in the prompt
        await api.post('/devices/bulk-renew', { deviceIds, years: 1 });
        setPaymentStatus('success');
      } catch (error) {
        console.error('Payment failed', error);
        setPaymentStatus('error');
      } finally {
        setIsProcessing(false);
      }
    }, 3000);
  };

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
          <p className="text-slate-400 mb-8">
            Licenses for {selectedDevices.length} devices have been updated to {new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString()}.
          </p>

          <div className="space-y-3">
            <button 
              onClick={() => {
                const doc = new jsPDF();
                doc.text("Invoice", 20, 20);
                doc.text(`Organization: ${user?.organizationName || selectedDevices[0]?.organization?.name || 'Organization'}`, 20, 30);
                doc.text(`Devices: ${selectedDevices.length}`, 20, 40);
                doc.text(`Total: £${total.toLocaleString()}`, 20, 50);
                doc.save("invoice.pdf");
              }}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Invoice
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              Return to Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      {/* Processing Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
          >
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <h3 className="text-xl font-semibold text-white">Secure Payment Processing...</h3>
            <p className="text-slate-400 mt-2">Please do not close this window.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white mb-4 flex items-center gap-2 text-sm">
             ← Back
          </button>
          <h1 className="text-3xl font-bold text-white">Checkout & Payment</h1>
          <p className="text-slate-400 mt-1">Complete your renewal to ensure uninterrupted service.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Payment Methods */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-white mb-6">Payment Method</h2>
              
              {/* Tab Switcher */}
              <div className="flex p-1 bg-slate-950 rounded-xl mb-8 border border-slate-800">
                {(['card', 'paypal', 'google'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      paymentMethod === method 
                        ? 'bg-slate-800 text-white shadow-lg' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {method === 'card' && <CreditCard className="h-4 w-4" />}
                    {method === 'paypal' && <span className="italic font-serif font-bold">Pay<span className="text-blue-400">Pal</span></span>}
                    {method === 'google' && <Wallet className="h-4 w-4" />}
                    <span className="capitalize">{method === 'google' ? 'Google Pay' : method === 'card' ? 'Credit Card' : ''}</span>
                  </button>
                ))}
              </div>

              {/* Credit Card Form */}
              <AnimatePresence mode="wait">
                {paymentMethod === 'card' && (
                  <motion.form 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-5"
                    onSubmit={handlePay}
                  >
                    <div>
                      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Card Number</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="0000 0000 0000 0000" 
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          required
                          pattern=".{10,}"
                        />
                        <CreditCard className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-600 h-5 w-5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Expiry Date</label>
                        <input 
                          type="text" 
                          placeholder="MM/YY" 
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">CVC</label>
                        <input 
                          type="text" 
                          placeholder="123" 
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Cardholder Name</label>
                      <input 
                        type="text" 
                        placeholder="John Doe" 
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        required
                      />
                    </div>

                    {paymentStatus === 'error' && (
                      <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        <AlertCircle className="h-4 w-4" />
                        Payment failed. Please try again.
                      </div>
                    )}

                    <button 
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Pay £{total.toLocaleString()}
                    </button>
                  </motion.form>
                )}
                
                {paymentMethod !== 'card' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <p className="text-slate-400 mb-4">Redirecting to {paymentMethod === 'paypal' ? 'PayPal' : 'Google Pay'}...</p>
                    <button 
                      onClick={handlePay}
                      className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                    >
                      Continue with {paymentMethod === 'paypal' ? 'PayPal' : 'Google Pay'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl sticky top-8">
              <h2 className="text-xl font-semibold text-white mb-6">Order Summary</h2>
              
              <div className="mb-6 pb-6 border-b border-slate-800">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Invoice To</span>
                <p className="text-lg font-medium text-white mt-1">
                  {user?.organizationName || selectedDevices[0]?.organization?.name || 'Organization'}
                </p>
              </div>

              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">
                  Selected Devices ({selectedDevices.length})
                </span>
                {selectedDevices.length > 0 ? (
                  selectedDevices.map((device, idx) => (
                    <div key={idx} className="flex justify-between items-start text-sm">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-800 p-2 rounded-lg">
                          <Smartphone className="h-4 w-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-slate-200 font-medium">{device.name}</p>
                          <p className="text-slate-500 text-xs">{device.serialNumber}</p>
                        </div>
                      </div>
                      <span className="text-slate-300">£{costPerDevice}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic text-sm">No devices selected.</p>
                )}
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-800">
                <div className="flex justify-between text-slate-400 text-sm">
                  <span>Subtotal</span>
                  <span>£{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-sm">
                  <span>VAT (0%)</span>
                  <span>£0</span>
                </div>
                <div className="flex justify-between items-center pt-4">
                  <span className="text-lg font-bold text-white">Total Due</span>
                  <span className="text-2xl font-bold text-blue-400">£{total.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6 bg-slate-950/50 rounded-lg p-3 border border-slate-800/50 flex gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your payment is secured with 256-bit SSL encryption. We do not store your credit card details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
