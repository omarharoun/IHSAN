import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader } from 'lucide-react';
import { generateLessonSeries } from '../../lib/ai';
import { AIGenerationRequest } from '../../types';
import BackgroundLessonService from '../../services/BackgroundLessonService';
import { useAuth } from '../../hooks/useAuth';

interface CreateLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSeriesGenerated: (series: LessonSeries, request: AIGenerationRequest) => void;
}

const categories = [
  'technology', 'science', 'business', 'arts', 'health', 'language', 'other'
];

const difficulties = [
  { value: 'beginner', label: 'Beginner', description: 'New to the topic' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some experience' },
  { value: 'advanced', label: 'Advanced', description: 'Deep knowledge' }
];

// Function to automatically determine category from topic
const determineCategory = (topic: string): string => {
  const lowerTopic = topic.toLowerCase();
  
  // Technology keywords
  if (lowerTopic.includes('programming') || lowerTopic.includes('coding') || 
      lowerTopic.includes('javascript') || lowerTopic.includes('python') || 
      lowerTopic.includes('react') || lowerTopic.includes('web') || 
      lowerTopic.includes('software') || lowerTopic.includes('computer') ||
      lowerTopic.includes('ai') || lowerTopic.includes('machine learning') ||
      lowerTopic.includes('data') || lowerTopic.includes('algorithm') ||
      lowerTopic.includes('database') || lowerTopic.includes('api') ||
      lowerTopic.includes('cloud') || lowerTopic.includes('cybersecurity') ||
      lowerTopic.includes('blockchain') || lowerTopic.includes('iot')) {
    return 'technology';
  }
  
  // Science keywords
  if (lowerTopic.includes('biology') || lowerTopic.includes('chemistry') || 
      lowerTopic.includes('physics') || lowerTopic.includes('math') || 
      lowerTopic.includes('science') || lowerTopic.includes('research') ||
      lowerTopic.includes('experiment') || lowerTopic.includes('theory') ||
      lowerTopic.includes('quantum') || lowerTopic.includes('molecular') ||
      lowerTopic.includes('genetics') || lowerTopic.includes('astronomy') ||
      lowerTopic.includes('ecology') || lowerTopic.includes('neuroscience')) {
    return 'science';
  }
  
  // Business keywords
  if (lowerTopic.includes('business') || lowerTopic.includes('marketing') || 
      lowerTopic.includes('management') || lowerTopic.includes('finance') || 
      lowerTopic.includes('economics') || lowerTopic.includes('strategy') ||
      lowerTopic.includes('leadership') || lowerTopic.includes('sales') ||
      lowerTopic.includes('entrepreneurship') || lowerTopic.includes('startup') ||
      lowerTopic.includes('investment') || lowerTopic.includes('accounting') ||
      lowerTopic.includes('project management') || lowerTopic.includes('hr')) {
    return 'business';
  }
  
  // Health keywords
  if (lowerTopic.includes('health') || lowerTopic.includes('medicine') || 
      lowerTopic.includes('fitness') || lowerTopic.includes('nutrition') || 
      lowerTopic.includes('wellness') || lowerTopic.includes('mental health') ||
      lowerTopic.includes('psychology') || lowerTopic.includes('therapy') ||
      lowerTopic.includes('medical') || lowerTopic.includes('anatomy') ||
      lowerTopic.includes('exercise') || lowerTopic.includes('diet')) {
    return 'health';
  }
  
  // Language keywords
  if (lowerTopic.includes('language') || lowerTopic.includes('english') || 
      lowerTopic.includes('spanish') || lowerTopic.includes('french') || 
      lowerTopic.includes('german') || lowerTopic.includes('chinese') ||
      lowerTopic.includes('japanese') || lowerTopic.includes('grammar') ||
      lowerTopic.includes('vocabulary') || lowerTopic.includes('writing') ||
      lowerTopic.includes('speaking') || lowerTopic.includes('reading') ||
      lowerTopic.includes('literature') || lowerTopic.includes('linguistics')) {
    return 'language';
  }
  
  // Arts keywords
  if (lowerTopic.includes('art') || lowerTopic.includes('design') || 
      lowerTopic.includes('music') || lowerTopic.includes('painting') || 
      lowerTopic.includes('drawing') || lowerTopic.includes('photography') ||
      lowerTopic.includes('creative') || lowerTopic.includes('visual') ||
      lowerTopic.includes('sculpture') || lowerTopic.includes('theater') ||
      lowerTopic.includes('dance') || lowerTopic.includes('film') ||
      lowerTopic.includes('animation') || lowerTopic.includes('graphic')) {
    return 'arts';
  }
  
  // Default to 'other' if no category matches
  return 'other';
};

export function CreateLessonModal({ 
  isOpen, 
  onClose, 
  onSeriesGenerated
}: CreateLessonModalProps) {
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('technology');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [loading, setLoading] = useState(false);
  const backgroundService = BackgroundLessonService.getInstance();

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    try {
      // Auto-determine category from topic
      const category = determineCategory(topic.trim());

      // AI determines the optimal number of lessons based on topic complexity
      const request: AIGenerationRequest = {
        topic: topic.trim(),
        category,
        difficulty,
        duration: 0 // Will be determined by AI
      };

      // Start background generation
      if (user) {
        await backgroundService.startLessonGeneration(
          topic.trim(),
          difficulty,
          user.id
        );

        // Also generate the series for immediate use
        const series = await generateLessonSeries(request);
        onSeriesGenerated(series, request);
      }

      onClose();

      // Reset form
      setTopic('');
      setDifficulty('beginner');
    } catch (error) {
      console.error('Error generating lesson series:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-gray-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Create New Lesson</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Removed Lesson Series button, it's now the default option */}
              <div>
                <label className="block text-white font-medium mb-2">What would you like to learn?</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., React Hooks, Machine Learning Basics, Spanish Grammar..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-3">Difficulty Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {difficulties.map(diff => (
                    <motion.button
                      key={diff.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDifficulty(diff.value as any)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        difficulty === diff.value
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-white font-medium">{diff.label}</div>
                      <div className="text-gray-400 text-sm">{diff.description}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={!topic.trim() || loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Generating Lesson Series...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Lesson Series</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}