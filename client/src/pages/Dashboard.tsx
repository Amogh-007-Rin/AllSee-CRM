import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import StatsCard from '../components/StatsCard';
import api from '../services/api';
import { CheckCircle, AlertTriangle, XCircle, Ban } from 'lucide-react';
import { Routes, Route } from 'react-router-dom';
import DeviceList from '../components/DeviceList';
import RequestManager from '../components/RequestManager';

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
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/devices" element={<DeviceList />} />
        <Route path="/requests" element={<RequestManager />} />
      </Routes>
    </Layout>
  );
};

export default Dashboard;
