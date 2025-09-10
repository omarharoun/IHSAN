import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Circle, 
  Clock,
  BookOpen,
  Menu,
  X
} from 'lucide-react';
import { LessonSeries, SeriesLesson } from '../../types';
import { FormattedContent } from '../Dashboard/FormattedContent';
import { MobileBottomSheet } from './MobileBottomSheet';

interface MobileLessonSeriesViewerProps {
  series: LessonSeries;
  onUpdateSeries: (series: LessonSeries) => void;
  onClose: () => void;
}

export function MobileLessonSeriesViewer({ 
  series, 
  onUpdateSeries, 
  onClose 
}: MobileLessonSeriesViewerProps) {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showLessonMenu, setShowLessonMenu] = useState(false);

  const currentLesson = series.lessons[currentLessonIndex];
  const isLastLesson = currentLessonIndex === series.lessons.length - 1;
  const isFirstLesson = currentLessonIndex === 0;

  // Reset state when lesson changes
  useEffect(() => {
    setSelectedAnswer(null);
    setShowResult(false);
  }, [currentLessonIndex]);

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
    }
  };

  const prevLesson = () => {
    if (!isFirstLesson) {
      setCurrentLessonIndex(prev => prev - 1);
    }
  };

  const goToLesson = (index: number) => {
    setCurrentLessonIndex(index);
    setShowLessonMenu(false);
  };

  const progressPercentage = ((currentLessonIndex + 1) / series.total_lessons) * 100;

  return (
    <div className="min-h-screen bg-black safe-area-all">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-gray-800 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
            <div className="flex-1 min-w-0">
              <h1 className="text-mobile-lg font-bold text-white truncate">{series.title}</h1>
              <p className="text-mobile-sm text-gray-400">
                Lesson {currentLesson.lesson_number} of {series.total_lessons}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLessonMenu(true)}
              className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-mobile-sm font-medium">{currentLesson.title}</span>
            <span className="text-gray-400 text-mobile-xs">
              {series.completed_lessons}/{series.total_lessons} completed
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full h-2"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Lesson Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Introduction */}
        <section>
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm font-bold">1</span>
            </div>
            <h2 className="text-mobile-lg font-bold text-white">Getting Started</h2>
          </div>
          <div className="card-mobile">
            <FormattedContent 
              content={currentLesson.introduction}
              className="text-gray-300 leading-relaxed text-mobile-sm"
            />
          </div>
        </section>

        {/* Core Definition */}
        <section>
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm font-bold">2</span>
            </div>
            <h2 className="text-mobile-lg font-bold text-white">Key Concepts</h2>
          </div>
          <div className="card-mobile">
            <FormattedContent 
              content={currentLesson.core_definition}
              className="text-gray-300 leading-relaxed text-mobile-sm"
            />
          </div>
        </section>

        {/* Examples */}
        <section>
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm font-bold">3</span>
            </div>
            <h2 className="text-mobile-lg font-bold text-white">Real-World Applications</h2>
          </div>
          <div className="space-y-4">
            {currentLesson.examples.map((example, index) => (
              <div key={index} className="card-mobile">
                <FormattedContent 
                  content={example}
                  className="text-gray-300 leading-relaxed text-mobile-sm"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Assessment */}
        <section>
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm font-bold">4</span>
            </div>
            <h2 className="text-mobile-lg font-bold text-white">Check Your Understanding</h2>
          </div>
          <div className="card-mobile">
            <h3 className="text-white font-semibold mb-4 text-mobile-base">{currentLesson.assessment_question}</h3>
            <div className="space-y-3">
              {currentLesson.assessment_options.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !showResult && setSelectedAnswer(index)}
                  disabled={showResult}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all btn-touch ${
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
                  <span className="text-mobile-sm">{option}</span>
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
                className="btn-touch w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all"
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
                <p className={`font-semibold text-mobile-sm ${
                  selectedAnswer === currentLesson.correct_answer ? 'text-green-400' : 'text-red-400'
                }`}>
                  {selectedAnswer === currentLesson.correct_answer ? 
                    '✓ Correct! Moving to next lesson...' : 
                    '✗ Incorrect - Try again or continue learning'
                  }
                </p>
                {selectedAnswer !== currentLesson.correct_answer && (
                  <p className="text-gray-300 mt-2 text-mobile-xs">
                    The correct answer was: {currentLesson.assessment_options[currentLesson.correct_answer]}
                  </p>
                )}
                {selectedAnswer === currentLesson.correct_answer && !isLastLesson && (
                  <p className="text-green-300 mt-2 text-mobile-xs">
                    🎉 Great job! Automatically advancing to the next lesson in 2 seconds...
                  </p>
                )}
                {selectedAnswer === currentLesson.correct_answer && isLastLesson && (
                  <p className="text-green-300 mt-2 text-mobile-xs">
                    🎉 Congratulations! You've completed the entire series!
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </section>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="sticky bottom-0 bg-black/95 backdrop-blur-md border-t border-gray-800 safe-area-bottom">
        <div className="flex items-center justify-between px-4 py-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={prevLesson}
            disabled={isFirstLesson}
            className="btn-touch flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
            <span className="text-white text-mobile-sm">Previous</span>
          </motion.button>

          <div className="flex items-center space-x-2">
            {series.lessons.map((lesson, index) => (
              <button
                key={lesson.id}
                onClick={() => goToLesson(index)}
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
            className="btn-touch flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-white text-mobile-sm">Next</span>
            <ChevronRight className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      </div>

      {/* Lesson Menu Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showLessonMenu}
        onClose={() => setShowLessonMenu(false)}
        title="Lesson Navigation"
        snapPoints={[0.6, 0.9]}
      >
        <div className="space-y-4">
          {series.lessons.map((lesson, index) => (
            <motion.button
              key={lesson.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => goToLesson(index)}
              className={`w-full text-left p-4 rounded-xl transition-all ${
                index === currentLessonIndex
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    lesson.completed 
                      ? 'bg-green-500' 
                      : index === currentLessonIndex 
                      ? 'bg-purple-500' 
                      : 'bg-gray-600'
                  }`}>
                    {lesson.completed ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-white text-sm font-bold">{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-mobile-sm">{lesson.title}</h3>
                    <p className="text-mobile-xs text-gray-400">
                      {lesson.duration_minutes} minutes
                    </p>
                  </div>
                </div>
                {index === currentLessonIndex && (
                  <div className="text-purple-400 text-mobile-xs font-semibold">
                    Current
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </MobileBottomSheet>
    </div>
  );
}