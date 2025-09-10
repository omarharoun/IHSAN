import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Brain, TrendingUp } from 'lucide-react';
import { TopNavigation } from './TopNavigation';
import { LessonCard } from './LessonCard';
import { CreateLessonModal } from './CreateLessonModal';
import { LessonViewer } from './LessonViewer';
import { ChatInterface } from '../Chat/ChatInterface';
import { StreamingLessonViewer } from './StreamingLessonViewer';
import { useAuth } from '../../hooks/useAuth';
import { useLessons } from '../../hooks/useLessons';
import { useLessonSeries } from '../../hooks/useLessonSeries';
import { useProfile } from '../../hooks/useProfile';
import { Lesson, AIGenerationRequest, LessonSeries } from '../../types';

export function Dashboard() {
  const { user } = useAuth();
  const { profile, updateActivity, addXP } = useProfile(user?.id);
  const { lessons, loading, saveLesson, deleteLesson } = useLessons(user?.id);
  const { lessonSeries, loading: seriesLoading, saveLessonSeries, updateLessonProgress, deleteLessonSeries } = useLessonSeries(user?.id);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<LessonSeries | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [streamingLesson, setStreamingLesson] = useState<{topic: string, difficulty: 'beginner' | 'intermediate' | 'advanced'} | null>(null);

  // Update activity when user visits dashboard
  useEffect(() => {
    if (user && updateActivity) {
      updateActivity();
    }
  }, [user, updateActivity]);

  const handleSeriesGenerated = async (series: LessonSeries, request: AIGenerationRequest) => {
    if (!user) return;

    try {
      // Save series to database
      await saveLessonSeries({ ...series, user_id: user.id });
      
      // Award XP for creating a lesson series
      if (addXP) {
        await addXP(50); // 50 XP for creating a series
      }
    } catch (error) {
      console.error('Error saving lesson series:', error);
    }
  };

  const handleStreamingLessonRequest = (topic: string, difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    setStreamingLesson({ topic, difficulty });
  };


  const handleUpdateSeries = async (updatedSeries: LessonSeries) => {
    // Find the lesson that was just completed
    const originalSeries = lessonSeries.find(s => s.id === updatedSeries.id);
    if (!originalSeries) return;

    // Find which lesson was completed
    for (let i = 0; i < updatedSeries.lessons.length; i++) {
      const updatedLesson = updatedSeries.lessons[i];
      const originalLesson = originalSeries.lessons[i];
      
      if (updatedLesson.completed && !originalLesson.completed) {
        // This lesson was just completed
        await updateLessonProgress(updatedSeries.id, updatedLesson.id, true);
        
        // Award XP for completing a lesson
        if (addXP) {
          await addXP(25); // 25 XP for completing a lesson
        }
        break;
      }
    }
  };

  const getRandomColor = () => {
    const colors = ['blue', 'green', 'purple', 'orange', 'teal', 'indigo'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const stats = [
    { label: 'Lesson Series', value: lessonSeries.length, icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
    { label: 'Total Lessons', value: lessonSeries.reduce((acc, series) => acc + series.total_lessons, 0), icon: Brain, color: 'from-purple-500 to-pink-500' },
    { label: 'Completed', value: lessonSeries.reduce((acc, series) => acc + series.completed_lessons, 0), icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
  ];


  return (
    <div className="min-h-screen bg-black">
      <TopNavigation onOpenChat={() => setShowChat(true)} />
      
      <main className="p-mobile">
        {/* Stats Section */}
        <div className="grid-mobile-3 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-br ${stat.color} rounded-2xl p-4 sm:p-6 text-white`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-mobile-sm">{stat.label}</p>
                  <p className="text-mobile-3xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white/80" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Create New Lesson Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl p-6 sm:p-8 mb-8 transition-all group btn-touch"
        >
          <div className="flex items-center justify-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-white/20 rounded-full group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-white text-mobile-lg font-bold">Create New Lesson</h3>
              <p className="text-white/80 text-mobile-sm">Generate streaming lessons with AI</p>
            </div>
          </div>
        </motion.button>

        {/* Lesson Series Grid */}
        {seriesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-white text-lg">Loading your lesson series...</div>
          </div>
        ) : lessonSeries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white text-xl font-semibold mb-2">No lesson series yet</h3>
            <p className="text-gray-400">Create your first streaming lesson to get started!</p>
          </motion.div>
        ) : (
          <div className="grid-mobile-4">
            {lessonSeries.map((series, index) => (
              <motion.div
                key={series.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <SeriesCard
                  series={series}
                  onSelect={setSelectedSeries}
                  onDelete={deleteLessonSeries}
                />
              </motion.div>
            ))}
          </div>
        )}

      </main>

      {/* Modals */}
      <CreateLessonModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSeriesGenerated={handleSeriesGenerated}
        onStreamingLessonRequest={handleStreamingLessonRequest}
      />

      {selectedLesson && (
        <LessonViewer
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
        />
      )}

      {/* Desktop Series Viewer - only show on desktop */}
      {selectedSeries && (
        <div className="hidden lg:block">
          <SeriesViewer
            series={selectedSeries}
            onClose={() => setSelectedSeries(null)}
            onUpdateSeries={handleUpdateSeries}
          />
        </div>
      )}
      
      {streamingLesson && (
        <StreamingLessonViewer
          topic={streamingLesson.topic}
          difficulty={streamingLesson.difficulty}
          onClose={() => setStreamingLesson(null)}
        />
      )}

      <ChatInterface
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />
    </div>
  );
}

// Import the new components
import { SeriesCard } from './SeriesCard';
import { SeriesViewer } from './SeriesViewer';
import { X } from 'lucide-react';