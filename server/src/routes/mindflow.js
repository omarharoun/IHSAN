import express from 'express';
import { body, validationResult } from 'express-validator';
import { DatabaseService } from '../services/supabase.js';
import { AIService } from '../services/ai.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all lessons for user
router.get('/lessons', authMiddleware, async (req, res) => {
  try {
    const lessons = await DatabaseService.getLessons(req.user.id);
    res.json({ lessons });
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// Get specific lesson
router.get('/lessons/:id', authMiddleware, async (req, res) => {
  try {
    const lesson = await DatabaseService.getLessonById(req.params.id, req.user.id);
    res.json({ lesson });
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(404).json({ error: 'Lesson not found' });
  }
});

// Create new lesson
router.post('/lessons', authMiddleware, [
  body('title').notEmpty().trim(),
  body('topic').notEmpty().trim(),
  body('difficulty').isIn(['beginner', 'intermediate', 'advanced']),
  body('category').notEmpty().trim(),
  body('duration_minutes').isInt({ min: 1, max: 300 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, topic, difficulty, category, duration_minutes, description } = req.body;

    // Generate AI content
    const content = await AIService.generateLesson(topic, difficulty, category, duration_minutes);

    const lessonData = {
      user_id: req.user.id,
      title,
      description: description || '',
      content,
      category,
      difficulty,
      duration_minutes,
      thumbnail_color: getRandomColor(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const lesson = await DatabaseService.createLesson(lessonData);
    res.status(201).json({ lesson });
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
});

// Update lesson
router.put('/lessons/:id', authMiddleware, [
  body('title').optional().notEmpty().trim(),
  body('description').optional().trim(),
  body('content').optional().notEmpty(),
  body('category').optional().notEmpty().trim(),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('duration_minutes').optional().isInt({ min: 1, max: 300 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = req.body;
    updates.updated_at = new Date().toISOString();

    const lesson = await DatabaseService.updateLesson(req.params.id, req.user.id, updates);
    res.json({ lesson });
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

// Delete lesson
router.delete('/lessons/:id', authMiddleware, async (req, res) => {
  try {
    await DatabaseService.deleteLesson(req.params.id, req.user.id);
    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

// Generate lesson series
router.post('/lessons/series', authMiddleware, [
  body('topic').notEmpty().trim(),
  body('difficulty').isIn(['beginner', 'intermediate', 'advanced']),
  body('num_lessons').optional().isInt({ min: 1, max: 20 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { topic, difficulty, num_lessons = 5 } = req.body;

    // Generate lesson titles
    const lessonTitles = await AIService.generateLessonSeries(topic, difficulty, num_lessons);

    // Create lessons for each title
    const lessons = [];
    for (let i = 0; i < lessonTitles.length; i++) {
      const title = lessonTitles[i];
      const content = await AIService.generateLesson(title, difficulty, 'other', 15);

      const lessonData = {
        user_id: req.user.id,
        title,
        description: `Part ${i + 1} of ${num_lessons} in the ${topic} series`,
        content,
        category: 'other',
        difficulty,
        duration_minutes: 15,
        thumbnail_color: getRandomColor(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const lesson = await DatabaseService.createLesson(lessonData);
      lessons.push(lesson);
    }

    res.status(201).json({ 
      message: 'Lesson series created successfully',
      lessons,
      series_info: {
        topic,
        difficulty,
        total_lessons: lessons.length
      }
    });
  } catch (error) {
    console.error('Create lesson series error:', error);
    res.status(500).json({ error: 'Failed to create lesson series' });
  }
});

// Get chat messages
router.get('/chat', authMiddleware, async (req, res) => {
  try {
    const { lesson_id } = req.query;
    const messages = await DatabaseService.getChatMessages(req.user.id, lesson_id);
    res.json({ messages });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// Create chat message
router.post('/chat', authMiddleware, [
  body('message').notEmpty().trim(),
  body('lesson_id').optional().isUUID(),
  body('is_ai').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message, lesson_id, is_ai = false } = req.body;

    const messageData = {
      user_id: req.user.id,
      lesson_id,
      message,
      is_ai,
      created_at: new Date().toISOString()
    };

    const chatMessage = await DatabaseService.createChatMessage(messageData);
    res.status(201).json({ message: chatMessage });
  } catch (error) {
    console.error('Create chat message error:', error);
    res.status(500).json({ error: 'Failed to create chat message' });
  }
});

// Get user statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await DatabaseService.getUserStats(req.user.id);
    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Helper function to get random color
function getRandomColor() {
  const colors = ['blue', 'green', 'purple', 'red', 'yellow', 'pink', 'indigo', 'teal'];
  return colors[Math.floor(Math.random() * colors.length)];
}

export default router;
