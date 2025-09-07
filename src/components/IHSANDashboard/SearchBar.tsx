import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch?.('');
  };

  return (
    <motion.form
      onSubmit={handleSearch}
      className={`relative transition-all duration-300 ${
        isFocused ? 'scale-105' : 'scale-100'
      }`}
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search for content, lessons, or tools..."
          className="w-full bg-gray-800 text-white rounded-lg pl-10 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-700 transition-colors"
        />
        {query && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        )}
      </div>
    </motion.form>
  );
};
