import { motion } from 'framer-motion';
import { Clock, BookOpen, Trash2 } from 'lucide-react';
import { Lesson } from '../../types';

interface LessonCardProps {
  lesson: Lesson;
  onSelect: (lesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
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

export function LessonCard({ lesson, onSelect, onDelete }: LessonCardProps) {
  const colorClass = categoryColors[lesson.category as keyof typeof categoryColors] || categoryColors.other;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="relative group cursor-pointer"
      onClick={() => onSelect(lesson)}
    >
      <div className={`bg-gradient-to-br ${colorClass} rounded-2xl p-6 h-64 flex flex-col justify-between shadow-xl`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-white font-bold text-xl mb-2 line-clamp-2">{aiGeneratedTitle}</h3>
            <p className="text-sm line-clamp-3">{aiGeneratedDescription}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(lesson.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-black/20 hover:bg-black/40 rounded-full"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </motion.button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{lesson.duration_minutes}min</span>
            </div>
            <div className="flex items-center space-x-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm capitalize">{lesson.difficulty}</span>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-white text-xs font-medium capitalize">{lesson.category}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}