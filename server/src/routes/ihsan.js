import express from 'express';
import { body, validationResult } from 'express-validator';
import { DatabaseService } from '../services/supabase.js';
import { AIService } from '../services/ai.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get IHSAN dashboard data
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    let dashboardData = await DatabaseService.getIHSANData(req.user.id);
    
    // If no data exists, create default dashboard
    if (!dashboardData) {
      const defaultData = {
        widgets: [
          { id: 'quick_capture', type: 'quick_capture', position: { x: 0, y: 0 } },
          { id: 'learning_hub', type: 'learning_hub', position: { x: 1, y: 0 } },
          { id: 'work_dashboard', type: 'work_dashboard', position: { x: 2, y: 0 } }
        ],
        preferences: {
          theme: 'dark',
          layout: 'grid',
          notifications: true
        },
        recent_activity: [],
        bookmarks: []
      };
      
      dashboardData = await DatabaseService.createIHSANData(req.user.id, defaultData);
    }

    res.json({ dashboard: dashboardData });
  } catch (error) {
    console.error('Get IHSAN dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Update IHSAN dashboard data
router.put('/dashboard', authMiddleware, [
  body('widgets').optional().isArray(),
  body('preferences').optional().isObject(),
  body('recent_activity').optional().isArray(),
  body('bookmarks').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = req.body;
    updates.updated_at = new Date().toISOString();

    const dashboardData = await DatabaseService.updateIHSANData(req.user.id, updates);
    res.json({ dashboard: dashboardData });
  } catch (error) {
    console.error('Update IHSAN dashboard error:', error);
    res.status(500).json({ error: 'Failed to update dashboard data' });
  }
});

// Get personalized content
router.get('/content', authMiddleware, async (req, res) => {
  try {
    const { type } = req.query;
    
    // Get user stats for personalization
    const userStats = await DatabaseService.getUserStats(req.user.id);
    
    let content;
    switch (type) {
      case 'dashboard_summary':
        content = await AIService.generateIHSANContent('dashboard_summary', {
          interests: userStats.categories || ['learning']
        });
        break;
      case 'learning_path':
        const { topic, difficulty } = req.query;
        content = await AIService.generateIHSANContent('learning_path', {
          topic: topic || 'general learning',
          difficulty: difficulty || 'beginner'
        });
        break;
      case 'content_suggestion':
        content = await AIService.generateIHSANContent('content_suggestion', {
          interests: userStats.categories || ['technology']
        });
        break;
      default:
        return res.status(400).json({ error: 'Invalid content type' });
    }

    res.json({ content });
  } catch (error) {
    console.error('Get IHSAN content error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// Get feed data
router.get('/feed', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Mock feed data - in a real app, this would come from a content database
    const feedItems = [
      {
        id: '1',
        type: 'video',
        title: 'Introduction to React Hooks',
        author: 'Tech Tutorials',
        duration: '12:34',
        thumbnail: 'https://via.placeholder.com/400x225/1f2937/ffffff?text=React+Hooks',
        views: '1.2K',
        likes: 89,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        type: 'video',
        title: 'Advanced TypeScript Patterns',
        author: 'Code Masters',
        duration: '18:45',
        thumbnail: 'https://via.placeholder.com/400x225/1f2937/ffffff?text=TypeScript',
        views: '856',
        likes: 67,
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        type: 'article',
        title: 'Understanding Quantum Computing',
        author: 'Science Weekly',
        thumbnail: 'https://via.placeholder.com/400x225/1f2937/ffffff?text=Quantum',
        read_time: '8 min read',
        likes: 124,
        created_at: new Date().toISOString()
      }
    ];

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedItems = feedItems.slice(startIndex, endIndex);

    res.json({
      items: paginatedItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: feedItems.length,
        has_more: endIndex < feedItems.length
      }
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Failed to fetch feed data' });
  }
});

// Get learning resources
router.get('/learn', authMiddleware, async (req, res) => {
  try {
    const { category } = req.query;
    
    // Mock learning resources - in a real app, this would come from a database
    const resources = [
      {
        id: '1',
        title: 'Web Development Fundamentals',
        description: 'Master modern web technologies',
        category: 'technology',
        difficulty: 'beginner',
        duration: '40 hours',
        thumbnail: 'https://via.placeholder.com/300x200/3b82f6/ffffff?text=Web+Dev',
        rating: 4.8,
        students: 1250
      },
      {
        id: '2',
        title: 'Mobile App Development',
        description: 'Build amazing mobile applications',
        category: 'technology',
        difficulty: 'intermediate',
        duration: '60 hours',
        thumbnail: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Mobile+Dev',
        rating: 4.6,
        students: 890
      },
      {
        id: '3',
        title: 'Data Science & AI',
        description: 'Explore data and artificial intelligence',
        category: 'science',
        difficulty: 'advanced',
        duration: '80 hours',
        thumbnail: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=Data+Science',
        rating: 4.9,
        students: 2100
      }
    ];

    const filteredResources = category 
      ? resources.filter(r => r.category === category)
      : resources;

    res.json({ resources: filteredResources });
  } catch (error) {
    console.error('Get learning resources error:', error);
    res.status(500).json({ error: 'Failed to fetch learning resources' });
  }
});

// Get work dashboard data
router.get('/work', authMiddleware, async (req, res) => {
  try {
    // Mock work data - in a real app, this would come from project management tools
    const workData = {
      projects: [
        {
          id: '1',
          name: 'E-commerce Platform',
          status: 'in_progress',
          progress: 75,
          due_date: '2024-02-15',
          team_members: 5,
          priority: 'high'
        },
        {
          id: '2',
          name: 'Mobile App Redesign',
          status: 'planning',
          progress: 25,
          due_date: '2024-03-01',
          team_members: 3,
          priority: 'medium'
        }
      ],
      tasks: [
        {
          id: '1',
          title: 'Implement user authentication',
          project_id: '1',
          status: 'in_progress',
          due_date: '2024-01-20',
          priority: 'high'
        },
        {
          id: '2',
          title: 'Design new UI components',
          project_id: '2',
          status: 'pending',
          due_date: '2024-01-25',
          priority: 'medium'
        }
      ],
      analytics: {
        completed_tasks: 12,
        pending_tasks: 8,
        overdue_tasks: 2,
        productivity_score: 85
      }
    };

    res.json({ work: workData });
  } catch (error) {
    console.error('Get work dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch work data' });
  }
});

// Get tools and utilities
router.get('/tools', authMiddleware, async (req, res) => {
  try {
    const tools = [
      {
        id: '1',
        name: 'Code Generator',
        description: 'Generate code snippets and templates',
        category: 'development',
        icon: 'code',
        url: '/tools/code-generator'
      },
      {
        id: '2',
        name: 'API Tester',
        description: 'Test and debug your APIs',
        category: 'development',
        icon: 'api',
        url: '/tools/api-tester'
      },
      {
        id: '3',
        name: 'Database Manager',
        description: 'Manage your databases efficiently',
        category: 'database',
        icon: 'database',
        url: '/tools/database-manager'
      },
      {
        id: '4',
        name: 'Image Optimizer',
        description: 'Optimize images for web',
        category: 'media',
        icon: 'image',
        url: '/tools/image-optimizer'
      }
    ];

    res.json({ tools });
  } catch (error) {
    console.error('Get tools error:', error);
    res.status(500).json({ error: 'Failed to fetch tools' });
  }
});

// Get user progress analysis
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const userStats = await DatabaseService.getUserStats(req.user.id);
    const analysis = await AIService.analyzeUserProgress(userStats);
    
    res.json({
      stats: userStats,
      analysis
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
