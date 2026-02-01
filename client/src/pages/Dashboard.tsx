import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import StatsCard from '../components/StatsCard';
import api from '../services/api';
import { CheckCircle, AlertTriangle, XCircle, Ban, X } from 'lucide-react';
import { Routes, Route } from 'react-router-dom';
import DeviceList from '../components/DeviceList';
import RequestManager from '../components/RequestManager';
import ResellerDashboard from './ResellerDashboard';
import { useAuth } from '../context/AuthContext';

const RiskBanner: React.FC = () => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(true);
  const [riskCount, setRiskCount] = useState(0);

  useEffect(() => {
    if (user?.orgType === 'CHILD') {
      api.get('/dashboard/stats').then(res => {
        const summary = res.data.summary;
        const count = (summary.warning || 0) + (summary.expired || 0);
        setRiskCount(count);
      }).catch(err => console.error(err));
    }
  }, [user]);

  if (!visible || riskCount === 0 || user?.orgType !== 'CHILD') return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 relative mx-6 mt-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            Action Required: <span className="font-bold">{riskCount}</span> screens are at risk of going black. 
            Please request renewal from HQ to prevent service disruption.
          </p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={() => setVisible(false)}
              className="inline-flex bg-yellow-50 rounded-md p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data.summary);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Loading stats...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Licenses"
          value={stats?.active || 0}
          icon={CheckCircle}
          className="border-l-4 border-l-green-500"
          description="Fully compliant devices"
        />
        <StatsCard
          title="Expiring Soon"
          value={stats?.warning || 0}
          icon={AlertTriangle}
          className="border-l-4 border-l-yellow-500"
          description="Expires in < 30 days"
        />
        <StatsCard
          title="Expired"
          value={stats?.expired || 0}
          icon={XCircle}
          className="border-l-4 border-l-red-500"
          description="License inactive"
        />
        <StatsCard
          title="Suspended"
          value={stats?.suspended || 0}
          icon={Ban}
          className="border-l-4 border-l-gray-500"
          description="Manually suspended"
        />
      </div>
      
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (user?.orgType === 'RESELLER') {
    return (
      <Layout>
        <ResellerDashboard />
      </Layout>
    );
  }

  return (
    <Layout>
      <RiskBanner />
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/devices" element={<DeviceList />} />
        <Route path="/requests" element={<RequestManager />} />
      </Routes>
    </Layout>
  );
};

export default Dashboard;
