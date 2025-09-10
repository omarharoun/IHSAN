import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Play, Pause, RotateCcw, CheckCircle, Clock } from 'lucide-react';
import { generateStreamingLesson } from '../../lib/ai';
import { FormattedContent } from './FormattedContent';

interface StreamingLessonViewerProps {
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  onClose: () => void;
}

// Streaming lesson viewer with progressive content reveal
export function StreamingLessonViewer({ topic, difficulty, onClose }: StreamingLessonViewerProps) {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const streamingRef = useRef<boolean>(false);

  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [content]);

  // Start streaming lesson generation
  const startStreaming = async () => {
    if (streamingRef.current) return;
    
    setIsStreaming(true);
    setIsComplete(false);
    setIsPaused(false);
    setContent('');
    streamingRef.current = true;

    try {
      await generateStreamingLesson(topic, difficulty, (chunk: string) => {
        if (!streamingRef.current || isPaused) return;
        setContent(prev => prev + chunk);
      });
      
      setIsComplete(true);
    } catch (error) {
      console.error('Error generating streaming lesson:', error);
      setContent(prev => prev + '\n\n**Error:** Failed to generate lesson content. Please try again.');
    } finally {
      setIsStreaming(false);
      streamingRef.current = false;
    }
  };

  const pauseStreaming = () => {
    setIsPaused(true);
    setIsStreaming(false);
  };

  const resumeStreaming = () => {
    if (!isComplete) {
      setIsPaused(false);
      setIsStreaming(true);
    }
  };

  const resetLesson = () => {
    streamingRef.current = false;
    setContent('');
    setIsStreaming(false);
    setIsComplete(false);
    setIsPaused(false);
  };

  useEffect(() => {
    // Auto-start streaming when component mounts
    startStreaming();
    
    return () => {
      streamingRef.current = false;
    };
  }, []);

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
        className="relative bg-gray-900 border-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden border"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2">
              Streaming Lesson
            </h1>
            <div className="flex items-center space-x-4 text-gray-400">
              <span className="text-sm">Topic: {topic}</span>
              <span className="text-sm capitalize">Level: {difficulty}</span>
              <div className="flex items-center space-x-1">
                {isStreaming && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
                <span className="text-sm">
                  {isStreaming ? 'Generating...' : isComplete ? 'Complete' : 'Ready'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-2 mr-4">
            {!isComplete && (
              <>
                {isStreaming ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={pauseStreaming}
                    className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded-xl transition-colors"
                  >
                    <Pause className="w-4 h-4 text-white" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resumeStreaming}
                    className="p-2 bg-green-600 hover:bg-green-700 rounded-xl transition-colors"
                  >
                    <Play className="w-4 h-4 text-white" />
                  </motion.button>
                )}
              </>
            )}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetLesson}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-white" />
            </motion.button>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content Area */}
        <div 
          ref={contentRef}
          className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-gray-900"
        >
          {content ? (
            <div className="prose prose-invert max-w-none">
              <FormattedContent 
                content={content}
                className="text-gray-300 leading-relaxed"
              />
              {isStreaming && (
                <span className="inline-block w-2 h-5 bg-purple-500 animate-pulse ml-1" />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">
                  Preparing your streaming lesson...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-800/50">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>
              {content.split(' ').length} words generated
            </span>
            <div className="flex items-center space-x-2">
              {isComplete && <CheckCircle className="w-4 h-4 text-green-500" />}
              <span>
                {isComplete ? 'Lesson complete!' : isStreaming ? 'Streaming live...' : 'Paused'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}