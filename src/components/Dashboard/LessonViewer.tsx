import React from 'react';
import { motion } from 'framer-motion';
import { X, Clock, BookOpen, Tag } from 'lucide-react';
import { Lesson } from '../../types';
import { FormattedContent } from './FormattedContent';

interface LessonViewerProps {
  lesson: Lesson;
  onClose: () => void;
}

export function LessonViewer({ lesson, onClose }: LessonViewerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-gray-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-800"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2">{lesson.title}</h1>
            <div className="flex items-center space-x-4 text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{lesson.duration_minutes} minutes</span>
              </div>
              <div className="flex items-center space-x-1">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm capitalize">{lesson.difficulty}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Tag className="w-4 h-4" />
                <span className="text-sm capitalize">{lesson.category}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <FormattedContent 
            content={lesson.content}
            className="text-gray-300 leading-relaxed"
          />
        </div>
      </motion.div>
    </div>
  );
}