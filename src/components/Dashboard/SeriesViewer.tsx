import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, CheckCircle, Circle, BookOpen, Clock } from 'lucide-react';
import { LessonSeries, SeriesLesson } from '../../types';
import { FormattedContent } from './FormattedContent';

interface SeriesViewerProps {
  series: LessonSeries;
  onClose: () => void;
  onUpdateSeries: (series: LessonSeries) => void;
}

export function SeriesViewer({ series, onClose, onUpdateSeries }: SeriesViewerProps) {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const currentLesson = series.lessons[currentLessonIndex];
  const isLastLesson = currentLessonIndex === series.lessons.length - 1;
  const isFirstLesson = currentLessonIndex === 0;

  const handleAnswerSubmit = () => {
    if (selectedAnswer === null) return;
    
    setShowResult(true);
    
    // Mark lesson as completed if answer is correct
    if (selectedAnswer === currentLesson.correct_answer) {
      const updatedSeries = {
        ...series,
        lessons: series.lessons.map((lesson, index) => 
          index === currentLessonIndex ? { ...lesson, completed: true } : lesson
        ),
        completed_lessons: series.lessons.filter((lesson, index) => 
          lesson.completed || index === currentLessonIndex
        ).length
      };
      onUpdateSeries(updatedSeries);
      
      // Auto-advance to next lesson after 2 seconds if answer is correct
      setTimeout(() => {
        if (!isLastLesson) {
          nextLesson();
        }
      }, 2000);
    }
  };

  const nextLesson = () => {
    if (!isLastLesson) {
      setCurrentLessonIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const prevLesson = () => {
    if (!isFirstLesson) {
      setCurrentLessonIndex(prev => prev - 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

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
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2">{series.title}</h1>
            <div className="flex items-center space-x-4 text-gray-400">
              <span className="text-sm">Lesson {currentLesson.lesson_number} of {series.total_lessons}</span>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{currentLesson.duration_minutes} minutes</span>
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

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-800/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm font-medium">{currentLesson.title}</span>
            <span className="text-gray-400 text-sm">
              {series.completed_lessons}/{series.total_lessons} completed
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full h-2 transition-all duration-300"
              style={{ width: `${((currentLessonIndex + 1) / series.total_lessons) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                Getting Started
              </h2>
              <div className="bg-gray-800 rounded-xl p-6">
                <FormattedContent 
                  content={currentLesson.introduction}
                  className="text-gray-300 leading-relaxed"
                />
              </div>
            </section>

            {/* Core Definition */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                Key Concepts
              </h2>
              <div className="bg-gray-800 rounded-xl p-6">
                <FormattedContent 
                  content={currentLesson.core_definition}
                  className="text-gray-300 leading-relaxed"
                />
              </div>
            </section>

            {/* Examples */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                Real-World Applications
              </h2>
              <div className="space-y-4">
                {currentLesson.examples.map((example, index) => (
                  <div key={index} className="bg-gray-800 rounded-xl p-6">
                    <FormattedContent 
                      content={example}
                      className="text-gray-300 leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Assessment */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-bold">4</span>
                </div>
                Check Your Understanding
              </h2>
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">{currentLesson.assessment_question}</h3>
                <div className="space-y-3">
                  {currentLesson.assessment_options.map((option, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => !showResult && setSelectedAnswer(index)}
                      disabled={showResult}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        showResult
                          ? index === currentLesson.correct_answer
                            ? 'border-green-500 bg-green-500/20 text-green-300'
                            : index === selectedAnswer && index !== currentLesson.correct_answer
                            ? 'border-red-500 bg-red-500/20 text-red-300'
                            : 'border-gray-600 bg-gray-700 text-gray-300'
                          : selectedAnswer === index
                          ? 'border-purple-500 bg-purple-500/20 text-white'
                          : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>
                
                {!showResult && selectedAnswer !== null && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAnswerSubmit}
                    className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
                  >
                    Submit Answer
                  </motion.button>
                )}

                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 rounded-xl bg-gray-700"
                  >
                    <p className={`font-semibold ${
                      selectedAnswer === currentLesson.correct_answer ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {selectedAnswer === currentLesson.correct_answer ? 
                        '✓ Correct! Moving to next lesson...' : 
                        '✗ Incorrect - Try again or continue learning'
                      }
                    </p>
                    {selectedAnswer !== currentLesson.correct_answer && (
                      <p className="text-gray-300 mt-2">
                        The correct answer was: {currentLesson.assessment_options[currentLesson.correct_answer]}
                      </p>
                    )}
                    {selectedAnswer === currentLesson.correct_answer && !isLastLesson && (
                      <p className="text-green-300 mt-2 text-sm">
                        🎉 Great job! Automatically advancing to the next lesson in 2 seconds...
                      </p>
                    )}
                    {selectedAnswer === currentLesson.correct_answer && isLastLesson && (
                      <p className="text-green-300 mt-2 text-sm">
                        🎉 Congratulations! You've completed the entire series!
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 border-t border-gray-800">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={prevLesson}
            disabled={isFirstLesson}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
            <span className="text-white">Previous</span>
          </motion.button>

          <div className="flex items-center space-x-2">
            {series.lessons.map((lesson, index) => (
              <button
                key={lesson.id}
                onClick={() => {
                  setCurrentLessonIndex(index);
                  setSelectedAnswer(null);
                  setShowResult(false);
                }}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentLessonIndex
                    ? 'bg-purple-500'
                    : lesson.completed
                    ? 'bg-green-500'
                    : 'bg-gray-600'
                }`}
              />
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextLesson}
            disabled={isLastLesson}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-white">Next</span>
            <ChevronRight className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}