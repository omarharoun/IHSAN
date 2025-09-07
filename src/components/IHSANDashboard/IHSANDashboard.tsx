import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Video, 
  BookOpen, 
  Briefcase, 
  Wrench, 
  User,
  Bell,
  Search,
  Plus
} from 'lucide-react';

// Import IHSAN components (we'll create these)
import { DashboardTile } from './DashboardTile';
import { FeedVideoCard } from './FeedVideoCard';
import { NotificationBadge } from './NotificationBadge';
import { QuickCapture } from './QuickCapture';
import { SearchBar } from './SearchBar';

interface IHSANDashboardProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const IHSANDashboard: React.FC<IHSANDashboardProps> = ({ activeTab, onTabChange }) => {
  const [notifications] = useState(3);

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'feed', label: 'Feed', icon: Video },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'work', label: 'Work', icon: Briefcase },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-white">Welcome to IHSAN</h1>
              <NotificationBadge count={notifications} />
            </div>
            
            <SearchBar />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DashboardTile
                title="Quick Capture"
                description="Capture ideas instantly"
                icon={Plus}
                color="blue"
                onClick={() => {}}
              />
              <DashboardTile
                title="Learning Hub"
                description="Continue your learning journey"
                icon={BookOpen}
                color="green"
                onClick={() => onTabChange('learn')}
              />
              <DashboardTile
                title="Work Dashboard"
                description="Manage your projects"
                icon={Briefcase}
                color="purple"
                onClick={() => onTabChange('work')}
              />
            </div>
          </div>
        );
      
      case 'feed':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Feed</h1>
            <div className="space-y-4">
              <FeedVideoCard
                title="Introduction to React Hooks"
                author="Tech Tutorials"
                duration="12:34"
                thumbnail="https://via.placeholder.com/400x225/1f2937/ffffff?text=React+Hooks"
                views="1.2K"
                likes="89"
              />
              <FeedVideoCard
                title="Advanced TypeScript Patterns"
                author="Code Masters"
                duration="18:45"
                thumbnail="https://via.placeholder.com/400x225/1f2937/ffffff?text=TypeScript"
                views="856"
                likes="67"
              />
            </div>
          </div>
        );
      
      case 'learn':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Learning Hub</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DashboardTile
                title="Web Development"
                description="Master modern web technologies"
                icon={BookOpen}
                color="blue"
                onClick={() => {}}
              />
              <DashboardTile
                title="Mobile Development"
                description="Build amazing mobile apps"
                icon={BookOpen}
                color="green"
                onClick={() => {}}
              />
              <DashboardTile
                title="Data Science"
                description="Explore data and AI"
                icon={BookOpen}
                color="purple"
                onClick={() => {}}
              />
            </div>
          </div>
        );
      
      case 'work':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Work Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DashboardTile
                title="Current Projects"
                description="3 active projects"
                icon={Briefcase}
                color="blue"
                onClick={() => {}}
              />
              <DashboardTile
                title="Team Collaboration"
                description="Work with your team"
                icon={Briefcase}
                color="green"
                onClick={() => {}}
              />
              <DashboardTile
                title="Analytics"
                description="Track your progress"
                icon={Briefcase}
                color="purple"
                onClick={() => {}}
              />
            </div>
          </div>
        );
      
      case 'tools':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Tools & Utilities</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DashboardTile
                title="Code Generator"
                description="Generate code snippets"
                icon={Wrench}
                color="blue"
                onClick={() => {}}
              />
              <DashboardTile
                title="API Tester"
                description="Test your APIs"
                icon={Wrench}
                color="green"
                onClick={() => {}}
              />
              <DashboardTile
                title="Database Manager"
                description="Manage your databases"
                icon={Wrench}
                color="purple"
                onClick={() => {}}
              />
            </div>
          </div>
        );
      
      case 'profile':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Profile</h1>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">User Name</h2>
                  <p className="text-gray-400">user@example.com</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Tab Navigation */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>
      </div>
    </div>
  );
};
