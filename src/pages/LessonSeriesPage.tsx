import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLessonSeriesViewer } from '../components/Mobile/MobileLessonSeriesViewer';
import { useLessonSeries } from '../hooks/useLessonSeries';
import { useAuth } from '../hooks/useAuth';
import { LessonSeries } from '../types';

export function LessonSeriesPage() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lessonSeries, updateLessonProgress } = useLessonSeries(user?.id);
  const [series, setSeries] = useState<LessonSeries | null>(null);

  useEffect(() => {
    if (seriesId && lessonSeries.length > 0) {
      const foundSeries = lessonSeries.find(s => s.id === seriesId);
      if (foundSeries) {
        setSeries(foundSeries);
      } else {
        // Series not found, redirect back
        navigate('/');
      }
    }
  }, [seriesId, lessonSeries, navigate]);

  const handleUpdateSeries = async (updatedSeries: LessonSeries) => {
    setSeries(updatedSeries);
    
    // Find which lesson was completed
    const originalSeries = lessonSeries.find(s => s.id === updatedSeries.id);
    if (!originalSeries) return;

    for (let i = 0; i < updatedSeries.lessons.length; i++) {
      const updatedLesson = updatedSeries.lessons[i];
      const originalLesson = originalSeries.lessons[i];
      
      if (updatedLesson.completed && !originalLesson.completed) {
        // This lesson was just completed
        await updateLessonProgress(updatedSeries.id, updatedLesson.id, true);
        break;
      }
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  if (!series) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-mobile-lg">Loading lesson series...</div>
      </div>
    );
  }

  return (
    <MobileLessonSeriesViewer
      series={series}
      onUpdateSeries={handleUpdateSeries}
      onClose={handleClose}
    />
  );
}