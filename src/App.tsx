import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AuthForm } from './components/Auth/AuthForm';
import { Dashboard } from './components/Dashboard/Dashboard';
import { IHSANDashboard } from './components/IHSANDashboard/IHSANDashboard';
import { useAuth } from './hooks/useAuth';
import { Brain, Home } from 'lucide-react';

// Wrapper component to manage IHSAN tab state
const IHSANDashboardWrapper: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  return <IHSANDashboard activeTab={activeTab} onTabChange={setActiveTab} />;
};

function App() {
  const { user, loading } = useAuth();
  const [activeApp, setActiveApp] = useState<'mindflow' | 'ihsan'>('mindflow');

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* App Switcher */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveApp('mindflow')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeApp === 'mindflow'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <Brain className="w-5 h-5" />
              <span>MindFlow</span>
            </button>
            <button
              onClick={() => setActiveApp('ihsan')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeApp === 'ihsan'
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <Home className="w-5 h-5" />
              <span>IHSAN</span>
            </button>
          </div>
        </div>
      </div>

      {/* App Content */}
      <motion.div
        key={activeApp}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeApp === 'mindflow' ? (
          <Dashboard />
        ) : (
          <IHSANDashboardWrapper />
        )}
      </motion.div>
    </div>
  );
}

export default App;