import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Home, 
  Brain, 
  MessageCircle, 
  User, 
  LogOut, 
  Flame, 
  Sun, 
  Moon,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useProfile } from '../../hooks/useProfile';

interface MobileNavigationProps {
  activeApp: 'mindflow' | 'ihsan';
  onAppChange: (app: 'mindflow' | 'ihsan') => void;
  onOpenChat: () => void;
}

export function MobileNavigation({ activeApp, onAppChange, onOpenChat }: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { profile, loading } = useProfile(user?.id);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.mobile-nav')) {
        setIsMenuOpen(false);
        setIsProfileOpen(false);
      }
    };

    if (isMenuOpen || isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen, isProfileOpen]);

  const handleAppChange = (app: 'mindflow' | 'ihsan') => {
    onAppChange(app);
    setIsMenuOpen(false);
  };

  const handleSignOut = () => {
    signOut();
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-black/50 backdrop-blur-md border-b border-gray-800 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3">
          {/* App Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              {activeApp === 'mindflow' ? (
                <Brain className="w-5 h-5 text-white" />
              ) : (
                <Home className="w-5 h-5 text-white" />
              )}
            </div>
            <h1 className="text-mobile-lg font-bold text-white">
              {activeApp === 'mindflow' ? 'MindFlow' : 'IHSAN'}
            </h1>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            {/* Streak Counter */}
            <div className="flex items-center space-x-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full px-3 py-1.5">
              <Flame className="w-4 h-4 text-white" />
              <span className="text-white font-bold text-sm">
                {loading ? '...' : (profile?.streak || 0)}
              </span>
            </div>

            {/* Chat Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenChat}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </motion.button>

            {/* Menu Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMenuOpen(true)}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="mobile-nav absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-gray-900 border-l border-gray-800 shadow-2xl"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white">Menu</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </motion.button>
              </div>

              {/* Menu Content */}
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto">
                  {/* App Switcher */}
                  <div className="p-6 border-b border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                      Applications
                    </h3>
                    <div className="space-y-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAppChange('mindflow')}
                        className={`w-full flex items-center space-x-3 p-4 rounded-xl transition-colors ${
                          activeApp === 'mindflow'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <Brain className="w-5 h-5" />
                        <span className="font-medium">MindFlow</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAppChange('ihsan')}
                        className={`w-full flex items-center space-x-3 p-4 rounded-xl transition-colors ${
                          activeApp === 'ihsan'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <Home className="w-5 h-5" />
                        <span className="font-medium">IHSAN</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="p-6 border-b border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                      Quick Actions
                    </h3>
                    <div className="space-y-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onOpenChat}
                        className="w-full flex items-center space-x-3 p-4 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-xl transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span className="font-medium">AI Chat</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="p-6">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                      Settings
                    </h3>
                    <div className="space-y-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between p-4 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-xl transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {theme === 'dark' ? (
                            <Sun className="w-5 h-5" />
                          ) : (
                            <Moon className="w-5 h-5" />
                          )}
                          <span className="font-medium">Theme</span>
                        </div>
                        <span className="text-sm text-gray-400 capitalize">{theme}</span>
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* User Profile Section */}
                <div className="p-6 border-t border-gray-800">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {user?.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="text-gray-400 text-sm truncate">{user?.email}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
                    >
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                        isProfileOpen ? 'rotate-180' : ''
                      }`} />
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSignOut}
                          className="w-full flex items-center space-x-3 p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
                        >
                          <LogOut className="w-5 h-5" />
                          <span className="font-medium">Sign Out</span>
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}