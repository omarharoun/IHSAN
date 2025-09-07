import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lesson } from '../types';

export function useLessons(userId?: string) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLessons([]);
      setLoading(false);
      return;
    }

    fetchLessons();
  }, [userId]);

  const fetchLessons = async () => {
    try {
      setLoading(false);
      setLessons([]);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      setLessons([]);
      setLoading(false);
    }
  };

  const saveLesson = async (lesson: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // For now, just add to local state since database isn't set up
      const newLesson = {
        ...lesson,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Lesson;
      
      setLessons(prev => [newLesson, ...prev]);
      return newLesson;
    } catch (error) {
      console.error('Error saving lesson:', error);
      throw error;
    }
  };

  const deleteLesson = async (lessonId: string) => {
    try {
      setLessons(prev => prev.filter(lesson => lesson.id !== lessonId));
    } catch (error) {
      console.error('Error deleting lesson:', error);
      throw error;
    }
  };

  return {
    lessons,
    loading,
    saveLesson,
    deleteLesson,
    refetch: fetchLessons,
  };
}