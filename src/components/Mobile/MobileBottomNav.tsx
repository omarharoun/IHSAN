import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Video, 
  BookOpen, 
  Briefcase, 
  Wrench, 
  User,
  Plus
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onQuickAction?: () => void;
}

export function MobileBottomNav({ activeTab, onTabChange, onQuickAction }: MobileBottomNavProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'feed', label: 'Feed', icon: Video },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'work', label: 'Work', icon: Briefcase },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[60px] min-w-[60px] px-2 py-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-blue-500/20 rounded-lg -z-10"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className={`text-xs font-medium mt-1 transition-colors ${
                isActive ? 'text-blue-400' : 'text-gray-400'
              }`}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
        
        {/* Quick Action Button */}
        {onQuickAction && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onQuickAction}
            className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full shadow-lg transition-all duration-200"
          >
            <Plus className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </div>
    </div>
  );
}