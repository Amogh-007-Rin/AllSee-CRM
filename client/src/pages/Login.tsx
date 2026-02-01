import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@hq.com');
  const [password, setPassword] = useState('password123');
  const [scenario, setScenario] = useState<'direct' | 'reseller'>('direct');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleScenarioChange = (newScenario: 'direct' | 'reseller') => {
    setScenario(newScenario);
    if (newScenario === 'direct') {
      setEmail('admin@hq.com');
    } else {
      setEmail('reseller_client@demo.com');
    }
    setPassword('password123');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      login(token, user); 
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Login to AllSee CRM</h2>
        
        {/* Scenario Switcher */}
        <div className="mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Demo Scenario:</label>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="scenario"
                value="direct"
                checked={scenario === 'direct'}
                onChange={() => handleScenarioChange('direct')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Direct Customer</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="scenario"
                value="reseller"
                checked={scenario === 'reseller'}
                onChange={() => handleScenarioChange('reseller')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Verified Reseller Client</span>
            </label>
          </div>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="admin@hq.com"
                required
              />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="********"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Sign In
          </button>
        </form>
        <div className="mt-4 text-sm text-gray-600">
           <p>Demo Accounts:</p>
           <ul className="list-disc ml-5">
               <li>Parent: admin@hq.com / password123</li>
               <li>Child: manager@london.com / password123</li>
           </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
