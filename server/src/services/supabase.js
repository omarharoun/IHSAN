import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for backend operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Admin client for backend operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Regular client for user operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database helper functions
export class DatabaseService {
  // User management (using existing profiles table)
  static async getUserById(userId) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createUser(userData) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateUser(userId, updates) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // MindFlow lessons
  static async getLessons(userId) {
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getLessonById(lessonId, userId) {
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createLesson(lessonData) {
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .insert(lessonData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateLesson(lessonId, userId, updates) {
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .update(updates)
      .eq('id', lessonId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteLesson(lessonId, userId) {
    const { error } = await supabaseAdmin
      .from('lessons')
      .delete()
      .eq('id', lessonId)
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  }

  // IHSAN dashboard data
  static async getIHSANData(userId) {
    const { data, error } = await supabaseAdmin
      .from('ihsan_dashboard')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  }

  static async createIHSANData(userId, data) {
    const { data: result, error } = await supabaseAdmin
      .from('ihsan_dashboard')
      .insert({ user_id: userId, ...data })
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }

  static async updateIHSANData(userId, updates) {
    const { data, error } = await supabaseAdmin
      .from('ihsan_dashboard')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Chat messages
  static async getChatMessages(userId, lessonId = null) {
    let query = supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async createChatMessage(messageData) {
    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .insert(messageData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Analytics and statistics
  static async getUserStats(userId) {
    const [lessonsResult, messagesResult] = await Promise.all([
      supabaseAdmin
        .from('lessons')
        .select('id, created_at, category, difficulty')
        .eq('user_id', userId),
      supabaseAdmin
        .from('chat_messages')
        .select('id, created_at')
        .eq('user_id', userId)
    ]);

    if (lessonsResult.error) throw lessonsResult.error;
    if (messagesResult.error) throw messagesResult.error;

    const lessons = lessonsResult.data;
    const messages = messagesResult.data;

    // Calculate statistics
    const totalLessons = lessons.length;
    const totalMessages = messages.length;
    const categories = [...new Set(lessons.map(l => l.category))];
    const difficulties = [...new Set(lessons.map(l => l.difficulty))];

    // Recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentLessons = lessons.filter(l => new Date(l.created_at) > weekAgo).length;
    const recentMessages = messages.filter(m => new Date(m.created_at) > weekAgo).length;

    return {
      totalLessons,
      totalMessages,
      categories,
      difficulties,
      recentActivity: {
        lessons: recentLessons,
        messages: recentMessages
      }
    };
  }
}
