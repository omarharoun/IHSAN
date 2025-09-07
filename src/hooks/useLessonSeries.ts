import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LessonSeries, SeriesLesson } from '../types';

export function useLessonSeries(userId?: string) {
  const [lessonSeries, setLessonSeries] = useState<LessonSeries[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLessonSeries([]);
      setLoading(false);
      return;
    }

    fetchLessonSeries();
  }, [userId]);

  const fetchLessonSeries = async () => {
    try {
      setLoading(true);
      
      // Fetch lesson series with their lessons
      const { data: seriesData, error: seriesError } = await supabase
        .from('lesson_series')
        .select(`
          *,
          series_lessons (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (seriesError) throw seriesError;

      // Transform the data to match our LessonSeries type
      const transformedSeries: LessonSeries[] = (seriesData || []).map(series => ({
        id: series.id,
        user_id: series.user_id,
        title: series.title,
        description: series.description || '',
        category: series.category,
        difficulty: series.difficulty as 'beginner' | 'intermediate' | 'advanced',
        total_lessons: series.total_lessons,
        completed_lessons: series.completed_lessons,
        lessons: (series.series_lessons || [])
          .sort((a: any, b: any) => a.lesson_number - b.lesson_number)
          .map((lesson: any) => ({
            id: lesson.id,
            series_id: lesson.series_id,
            lesson_number: lesson.lesson_number,
            title: lesson.title,
            introduction: lesson.introduction,
            core_definition: lesson.core_definition,
            examples: lesson.examples || [],
            assessment_question: lesson.assessment_question,
            assessment_options: lesson.assessment_options || [],
            correct_answer: lesson.correct_answer,
            completed: lesson.completed,
            duration_minutes: lesson.duration_minutes
          })),
        created_at: series.created_at,
        updated_at: series.updated_at
      }));

      setLessonSeries(transformedSeries);
    } catch (error) {
      console.error('Error fetching lesson series:', error);
      setLessonSeries([]);
    } finally {
      setLoading(false);
    }
  };

  const saveLessonSeries = async (series: Omit<LessonSeries, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Insert the lesson series
      const { data: seriesData, error: seriesError } = await supabase
        .from('lesson_series')
        .insert({
          user_id: series.user_id,
          title: series.title,
          description: series.description,
          category: series.category,
          difficulty: series.difficulty,
          total_lessons: series.total_lessons,
          completed_lessons: series.completed_lessons
        })
        .select()
        .single();

      if (seriesError) throw seriesError;

      // Insert all the lessons
      const lessonsToInsert = series.lessons.map(lesson => ({
        series_id: seriesData.id,
        lesson_number: lesson.lesson_number,
        title: lesson.title,
        introduction: lesson.introduction,
        core_definition: lesson.core_definition,
        examples: lesson.examples,
        assessment_question: lesson.assessment_question,
        assessment_options: lesson.assessment_options,
        correct_answer: lesson.correct_answer,
        completed: lesson.completed,
        duration_minutes: lesson.duration_minutes
      }));

      const { error: lessonsError } = await supabase
        .from('series_lessons')
        .insert(lessonsToInsert);

      if (lessonsError) throw lessonsError;

      // Refresh the data
      await fetchLessonSeries();

      return seriesData;
    } catch (error) {
      console.error('Error saving lesson series:', error);
      throw error;
    }
  };

  const updateLessonProgress = async (seriesId: string, lessonId: string, completed: boolean) => {
    try {
      // Update the lesson completion status
      const { error: lessonError } = await supabase
        .from('series_lessons')
        .update({ completed })
        .eq('id', lessonId);

      if (lessonError) throw lessonError;

      // Get updated lesson count for the series
      const { data: lessonsData, error: countError } = await supabase
        .from('series_lessons')
        .select('completed')
        .eq('series_id', seriesId);

      if (countError) throw countError;

      const completedCount = lessonsData?.filter(lesson => lesson.completed).length || 0;

      // Update the series completed_lessons count
      const { error: seriesError } = await supabase
        .from('lesson_series')
        .update({ completed_lessons: completedCount })
        .eq('id', seriesId);

      if (seriesError) throw seriesError;

      // Refresh the data
      await fetchLessonSeries();
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      throw error;
    }
  };

  const deleteLessonSeries = async (seriesId: string) => {
    try {
      // Delete the series (lessons will be deleted automatically due to CASCADE)
      const { error } = await supabase
        .from('lesson_series')
        .delete()
        .eq('id', seriesId);

      if (error) throw error;

      // Refresh the data
      await fetchLessonSeries();
    } catch (error) {
      console.error('Error deleting lesson series:', error);
      throw error;
    }
  };

  return {
    lessonSeries,
    loading,
    saveLessonSeries,
    updateLessonProgress,
    deleteLessonSeries,
    refetch: fetchLessonSeries,
  };
}