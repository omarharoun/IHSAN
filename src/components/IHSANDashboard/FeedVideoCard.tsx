import React from 'react';
import { motion } from 'framer-motion';
import { Play, Heart, MessageCircle, Share } from 'lucide-react';

interface FeedVideoCardProps {
  title: string;
  author: string;
  duration: string;
  thumbnail: string;
  views: string;
  likes: string;
}

export const FeedVideoCard: React.FC<FeedVideoCardProps> = ({
  title,
  author,
  duration,
  thumbnail,
  views,
  likes,
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors"
    >
      <div className="relative">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="opacity-0 hover:opacity-100 transition-opacity bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-3"
          >
            <Play className="w-8 h-8 text-white" />
          </motion.button>
        </div>
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {duration}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-3">{author}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>{views} views</span>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 hover:text-red-400 transition-colors">
              <Heart className="w-4 h-4" />
              <span>{likes}</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-blue-400 transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span>Comment</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-green-400 transition-colors">
              <Share className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
