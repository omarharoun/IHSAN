import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, BookOpen, Trash2, CheckCircle, Circle } from 'lucide-react';
import { LessonSeries } from '../../types';

interface SeriesCardProps {
  series: LessonSeries;
  onSelect?: (series: LessonSeries) => void; // Made optional for backward compatibility
  onDelete: (seriesId: string) => void;
}

const categoryColors = {
  technology: 'from-blue-500 to-cyan-500',
  science: 'from-green-500 to-emerald-500',
  business: 'from-purple-500 to-pink-500',
  arts: 'from-orange-500 to-red-500',
  health: 'from-teal-500 to-blue-500',
  language: 'from-indigo-500 to-purple-500',
  other: 'from-gray-500 to-gray-600',
};

export function SeriesCard({ series, onSelect, onDelete }: SeriesCardProps) {
  const navigate = useNavigate();
  const colorClass = categoryColors[series.category as keyof typeof categoryColors] || categoryColors.other;
  const progressPercentage = (series.completed_lessons / series.total_lessons) * 100;

  const handleCardClick = () => {
    // Check if we're on mobile (screen width < 1024px)
    const isMobile = window.innerWidth < 1024;
    
    if (isMobile) {
      // Navigate to mobile lesson viewer
      navigate(`/lesson-series/${series.id}`);
    } else {
      // Use the old modal behavior for desktop
      onSelect?.(series);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="relative group cursor-pointer"
      onClick={handleCardClick}
    >
      <div className={`bg-gradient-to-br ${colorClass} rounded-2xl p-6 h-72 flex flex-col justify-between shadow-xl`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-white font-bold text-xl mb-2 line-clamp-2">{series.title}</h3>
            <p className="text-white/80 text-sm line-clamp-3 mb-4">{series.description}</p>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/80 text-xs">Progress</span>
                <span className="text-white/80 text-xs">{series.completed_lessons}/{series.total_lessons}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(series.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-black/20 hover:bg-black/40 rounded-full"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </motion.button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-white/80">
            <div className="flex items-center space-x-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm">{series.total_lessons} lessons</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{series.total_lessons * 15}min</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
              <span className="text-white text-xs font-medium capitalize">{series.difficulty}</span>
            </div>
            {progressPercentage === 100 && (
              <CheckCircle className="w-5 h-5 text-white" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}