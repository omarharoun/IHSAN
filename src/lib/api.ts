import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          const { access_token } = response.data.session;
          localStorage.setItem('access_token', access_token);
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData: { email: string; password: string; full_name: string }) =>
    api.post('/auth/register', userData),
  
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  getProfile: () =>
    api.get('/auth/profile'),
  
  updateProfile: (updates: { name?: string; daily_xp_goal?: number }) =>
    api.put('/auth/profile', updates),
  
  logout: () =>
    api.post('/auth/logout'),
  
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),
};

// MindFlow API
export const mindflowAPI = {
  getLessons: () =>
    api.get('/mindflow/lessons'),
  
  getLesson: (id: string) =>
    api.get(`/mindflow/lessons/${id}`),
  
  createLesson: (lessonData: {
    title: string;
    topic: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    category: string;
    duration_minutes: number;
    description?: string;
  }) =>
    api.post('/mindflow/lessons', lessonData),
  
  updateLesson: (id: string, updates: any) =>
    api.put(`/mindflow/lessons/${id}`, updates),
  
  deleteLesson: (id: string) =>
    api.delete(`/mindflow/lessons/${id}`),
  
  createLessonSeries: (seriesData: {
    topic: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    num_lessons?: number;
  }) =>
    api.post('/mindflow/lessons/series', seriesData),
  
  getChatMessages: (lessonId?: string) =>
    api.get('/mindflow/chat', { params: { lesson_id: lessonId } }),
  
  createChatMessage: (messageData: {
    message: string;
    lesson_id?: string;
    is_ai?: boolean;
  }) =>
    api.post('/mindflow/chat', messageData),
  
  getStats: () =>
    api.get('/mindflow/stats'),
};

// IHSAN API
export const ihsanAPI = {
  getDashboard: () =>
    api.get('/ihsan/dashboard'),
  
  updateDashboard: (updates: any) =>
    api.put('/ihsan/dashboard', updates),
  
  getContent: (type: 'dashboard_summary' | 'learning_path' | 'content_suggestion', params?: any) =>
    api.get('/ihsan/content', { params: { type, ...params } }),
  
  getFeed: (page = 1, limit = 10) =>
    api.get('/ihsan/feed', { params: { page, limit } }),
  
  getLearningResources: (category?: string) =>
    api.get('/ihsan/learn', { params: { category } }),
  
  getWorkData: () =>
    api.get('/ihsan/work'),
  
  getTools: () =>
    api.get('/ihsan/tools'),
  
  getAnalytics: () =>
    api.get('/ihsan/analytics'),
};

// AI API
export const aiAPI = {
  chat: (message: string, context?: string) =>
    api.post('/ai/chat', { message, context }),
  
  generateLesson: (data: {
    topic: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    category: string;
    duration: number;
  }) =>
    api.post('/ai/generate-lesson', data),
  
  generateSeries: (data: {
    topic: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    num_lessons?: number;
  }) =>
    api.post('/ai/generate-series', data),
  
  generateIHSANContent: (type: string, params: any) =>
    api.post('/ai/generate-ihsan-content', { type, params }),
  
  analyzeProgress: (userStats: any) =>
    api.post('/ai/analyze-progress', { userStats }),
  
  getStatus: () =>
    api.get('/ai/status'),
};

export default api;