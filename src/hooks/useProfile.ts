import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  email: string;
  name: string;
  streak: number;
  xp: number;
  last_activity: string;
  last_opened: string;
  daily_xp_goal: number;
  daily_xp_streak: number;
  perfect_weeks: number;
  weekend_streak: number;
  night_owl_sessions: number;
  early_bird_sessions: number;
  speed_learner_count: number;
  consistent_days: number;
}

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
        return;
      }

      if (profileData) {
        // Calculate current streak based on last_activity
        const updatedProfile = await calculateAndUpdateStreak(profileData);
        setProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const calculateAndUpdateStreak = async (profileData: any): Promise<Profile> => {
    const today = new Date();
    const lastActivity = new Date(profileData.last_activity);
    const lastOpened = new Date(profileData.last_opened);
    
    // Calculate days since last activity
    const daysSinceActivity = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceOpened = Math.floor((today.getTime() - lastOpened.getTime()) / (1000 * 60 * 60 * 24));
    
    let newStreak = profileData.streak;
    let shouldUpdate = false;
    
    // If user hasn't been active for more than 1 day, reset streak
    if (daysSinceActivity > 1) {
      newStreak = 0;
      shouldUpdate = true;
    }
    // If user was active yesterday or today, maintain or increment streak
    else if (daysSinceActivity <= 1 && daysSinceOpened > 0) {
      // User is active today after being away - increment streak
      newStreak = profileData.streak + 1;
      shouldUpdate = true;
    }

    // Update the database if streak changed
    if (shouldUpdate) {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          streak: newStreak,
          last_opened: today.toISOString().split('T')[0] // Update last_opened to today
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating streak:', error);
      }
    }

    return {
      id: profileData.id,
      email: profileData.email,
      name: profileData.name,
      streak: newStreak,
      xp: profileData.xp,
      last_activity: profileData.last_activity,
      last_opened: profileData.last_opened,
      daily_xp_goal: profileData.daily_xp_goal,
      daily_xp_streak: profileData.daily_xp_streak,
      perfect_weeks: profileData.perfect_weeks,
      weekend_streak: profileData.weekend_streak,
      night_owl_sessions: profileData.night_owl_sessions,
      early_bird_sessions: profileData.early_bird_sessions,
      speed_learner_count: profileData.speed_learner_count,
      consistent_days: profileData.consistent_days,
    };
  };

  const updateActivity = async () => {
    if (!userId || !profile) return;

    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          last_activity: now,
          last_opened: now.split('T')[0] // Update last_opened to today
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating activity:', error);
        return;
      }

      // Refresh profile to recalculate streak
      await fetchProfile();
    } catch (error) {
      console.error('Error in updateActivity:', error);
    }
  };

  const addXP = async (points: number) => {
    if (!userId || !profile) return;

    try {
      const newXP = profile.xp + points;
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          xp: newXP,
          last_activity: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error adding XP:', error);
        return;
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, xp: newXP } : null);
      
      // Update activity which may affect streak
      await updateActivity();
    } catch (error) {
      console.error('Error in addXP:', error);
    }
  };

  return { 
    profile, 
    loading, 
    updateActivity, 
    addXP,
    refetch: fetchProfile 
  };
}