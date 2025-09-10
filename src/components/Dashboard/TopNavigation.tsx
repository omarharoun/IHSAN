import { motion } from 'framer-motion';
import { User, LogOut, MessageCircle, Flame, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useProfile } from '../../hooks/useProfile';

interface TopNavigationProps {
  onOpenChat: () => void;
}

export function TopNavigation({ onOpenChat }: TopNavigationProps) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { profile, loading } = useProfile(user?.id);

  function showBanner(message: string) {
    const banner = document.createElement('div');
    banner.textContent = message;
    banner.style.position = 'fixed';
    banner.style.top = '0';
    banner.style.left = '0';
    banner.style.width = '100%';
    banner.style.backgroundColor = '#4caf50';
    banner.style.color = '#fff';
    banner.style.textAlign = 'center';
    banner.style.padding = '10px';
    banner.style.zIndex = '1000';
    banner.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)';
    document.body.appendChild(banner);

    setTimeout(() => {
      banner.remove();
    }, 5000);
  }

  function handleMenuExit() {
    showBanner('You have exited the menu.');
  }

  return (
    <nav className="hidden lg:flex items-center justify-between p-6 bg-black/50 backdrop-blur-md border-b border-gray-800">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-white">Learning Hub</h1>
      </div>

      <div className="flex items-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenChat}
          className="p-3 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
        >
          <MessageCircle className="w-5 h-5 text-white" />
        </motion.button>

        <div className="flex items-center space-x-4">
          {/* Streak Counter */}
          <div className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full px-4 py-2">
            <Flame className="w-4 h-4 text-white" />
            <span className="text-white font-bold text-sm">
              {loading ? '...' : (profile?.streak || 0)}
            </span>
          </div>

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-3 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-blue-400" />
            )}
          </motion.button>

          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="hidden md:block">
            <p className="text-white font-medium">{user?.user_metadata?.full_name || 'User'}</p>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              signOut();
              handleMenuExit();
            }}
            className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
          >
            <LogOut className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>
    </nav>
  );
}