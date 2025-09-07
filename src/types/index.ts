export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Lesson {
  id: string;
  user_id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes: number;
  thumbnail_color: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  lesson_id?: string;
  message: string;
  is_ai: boolean;
  created_at: string;
}

export interface AIGenerationRequest {
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  category: string;
}

export interface LessonSeries {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  total_lessons: number;
  completed_lessons: number;
  lessons: SeriesLesson[];
  created_at: string;
  updated_at: string;
}

export interface SeriesLesson {
  id: string;
  series_id: string;
  lesson_number: number;
  title: string;
  introduction: string;
  core_definition: string;
  examples: string[];
  assessment_question: string;
  assessment_options: string[];
  correct_answer: number;
  completed: boolean;
  duration_minutes: number;
}