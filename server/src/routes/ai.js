import express from 'express';
import { body, validationResult } from 'express-validator';
import { AIService } from '../services/ai.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Chat with AI
router.post('/chat', authMiddleware, [
  body('message').notEmpty().trim(),
  body('context').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message, context } = req.body;
    const response = await AIService.chatWithAI(message, context);

    res.json({
      message: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Generate lesson content
router.post('/generate-lesson', authMiddleware, [
  body('topic').notEmpty().trim(),
  body('difficulty').isIn(['beginner', 'intermediate', 'advanced']),
  body('category').notEmpty().trim(),
  body('duration').isInt({ min: 1, max: 300 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { topic, difficulty, category, duration } = req.body;
    const content = await AIService.generateLesson(topic, difficulty, category, duration);

    res.json({
      content,
      metadata: {
        topic,
        difficulty,
        category,
        duration,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI lesson generation error:', error);
    res.status(500).json({ error: 'Failed to generate lesson content' });
  }
});

// Generate lesson series
router.post('/generate-series', authMiddleware, [
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
    const lessonTitles = await AIService.generateLessonSeries(topic, difficulty, num_lessons);

    res.json({
      lesson_titles: lessonTitles,
      metadata: {
        topic,
        difficulty,
        num_lessons: lessonTitles.length,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI series generation error:', error);
    res.status(500).json({ error: 'Failed to generate lesson series' });
  }
});

// Generate IHSAN content
router.post('/generate-ihsan-content', authMiddleware, [
  body('type').isIn(['dashboard_summary', 'learning_path', 'content_suggestion']),
  body('params').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, params } = req.body;
    const content = await AIService.generateIHSANContent(type, params);

    res.json({
      content,
      metadata: {
        type,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI IHSAN content generation error:', error);
    res.status(500).json({ error: 'Failed to generate IHSAN content' });
  }
});

// Analyze user progress
router.post('/analyze-progress', authMiddleware, async (req, res) => {
  try {
    const { userStats } = req.body;
    
    if (!userStats) {
      return res.status(400).json({ error: 'User stats required' });
    }

    const analysis = await AIService.analyzeUserProgress(userStats);

    res.json({
      analysis,
      metadata: {
        analyzed_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI progress analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze user progress' });
  }
});

// Get AI model status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    // Check if OpenAI API key is configured
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    
    res.json({
      status: hasApiKey ? 'available' : 'unavailable',
      model: 'gpt-3.5-turbo',
      features: [
        'lesson_generation',
        'lesson_series',
        'chat_assistant',
        'content_generation',
        'progress_analysis'
      ],
      configured: hasApiKey
    });
  } catch (error) {
    console.error('AI status check error:', error);
    res.status(500).json({ error: 'Failed to check AI status' });
  }
});

export default router;
