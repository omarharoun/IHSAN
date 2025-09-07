import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIService {
  static async generateLesson(topic, difficulty, category, duration) {
    try {
      const prompt = `Create a comprehensive ${difficulty} level lesson about "${topic}" in the ${category} category. 
      The lesson should be approximately ${duration} minutes long.
      
      Please structure the lesson with:
      1. Clear learning objectives
      2. Main content broken into digestible sections
      3. Practical examples or exercises
      4. Key takeaways
      5. Suggested next steps
      
      Make it engaging and educational. Format the response in markdown.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator who creates detailed, specific, and practical educational content. Always provide comprehensive, actionable information with real examples.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('AI lesson generation failed:', error);
      throw new Error('Failed to generate lesson content');
    }
  }

  static async generateLessonSeries(topic, difficulty, numLessons) {
    try {
      const prompt = `Create ${numLessons} lesson titles for learning "${topic}" at ${difficulty} level.
      
      Requirements:
      - Each title should represent a distinct, important concept
      - Titles should progress from basic to advanced concepts
      - Use professional, specific terminology
      - Make titles actionable and clear about what students will learn
      
      Return ONLY the titles, one per line, numbered 1-${numLessons}.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert curriculum designer who creates structured learning paths.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const content = response.choices[0].message.content || '';
      const lines = content.split('\n').filter(line => line.trim());
      const titles = lines.map(line => line.replace(/^\d+\.?\s*/, '').trim()).filter(title => title.length > 0);
      
      return titles.slice(0, numLessons);
    } catch (error) {
      console.error('AI lesson series generation failed:', error);
      throw new Error('Failed to generate lesson series');
    }
  }

  static async chatWithAI(message, context = null) {
    try {
      const systemPrompt = context 
        ? `You are a helpful learning assistant. The user is asking about this lesson context: ${context}. Provide helpful, encouraging responses that support their learning journey.`
        : 'You are a helpful learning assistant. Provide supportive, educational responses to help users with their learning goals.';

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('AI chat failed:', error);
      throw new Error('Failed to process chat message');
    }
  }

  static async generateIHSANContent(type, params) {
    try {
      let prompt = '';
      
      switch (type) {
        case 'dashboard_summary':
          prompt = `Generate a personalized dashboard summary for a user interested in ${params.interests?.join(', ') || 'learning'}. Include motivational content and learning suggestions.`;
          break;
        case 'learning_path':
          prompt = `Create a learning path recommendation for someone interested in ${params.topic} at ${params.difficulty} level. Include specific steps and resources.`;
          break;
        case 'content_suggestion':
          prompt = `Suggest 5 engaging content pieces for someone interested in ${params.interests?.join(', ') || 'technology and learning'}. Include titles and brief descriptions.`;
          break;
        default:
          throw new Error('Invalid content type');
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a personalized learning assistant that creates engaging, motivational content for learners.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.8
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('AI IHSAN content generation failed:', error);
      throw new Error('Failed to generate IHSAN content');
    }
  }

  static async analyzeUserProgress(userStats) {
    try {
      const prompt = `Analyze the following user learning statistics and provide personalized insights and recommendations:
      
      Total Lessons: ${userStats.totalLessons}
      Total Messages: ${userStats.totalMessages}
      Categories: ${userStats.categories?.join(', ') || 'None'}
      Difficulties: ${userStats.difficulties?.join(', ') || 'None'}
      Recent Activity: ${userStats.recentActivity?.lessons || 0} lessons, ${userStats.recentActivity?.messages || 0} messages in the last week
      
      Provide:
      1. Learning pattern analysis
      2. Strengths and areas for improvement
      3. Personalized recommendations
      4. Motivational insights`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an educational analytics expert who provides personalized learning insights and recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('AI progress analysis failed:', error);
      throw new Error('Failed to analyze user progress');
    }
  }
}
