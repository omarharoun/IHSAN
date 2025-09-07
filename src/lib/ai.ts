import OpenAI from 'openai';
import { AIGenerationRequest, LessonSeries, SeriesLesson } from '../types';

const AI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY?.trim();

// Helper function to make AI API calls
async function callAI(prompt: string): Promise<string> {
  if (!AI_API_KEY || 
      AI_API_KEY === 'your_openai_api_key_here' || 
      AI_API_KEY === '' || 
      AI_API_KEY === 'undefined' ||
      AI_API_KEY === 'null') {
    console.warn('AI API key not configured, using fallback content');
    return "FALLBACK_CONTENT";
  }

  try {
    // Create AI client
    const openai = new OpenAI({
      apiKey: AI_API_KEY,
      dangerouslyAllowBrowser: true
    });

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
      max_tokens: 1500,
      temperature: 0.7
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('AI API call failed:', error);
    if (error.status === 401) {
      console.error('Invalid API key - check your AI API key in .env file');
      return "FALLBACK_CONTENT";
    }
    if (error.status === 429) {
      console.error('Rate limit exceeded - please try again later');
      return "FALLBACK_CONTENT";
    }
    // For any other error, also use fallback
    console.error('Using fallback content due to API error');
    return "FALLBACK_CONTENT";
  }
}

// Helper function for streaming AI calls
async function callAIStream(prompt: string, onChunk: (chunk: string) => void): Promise<string> {
  if (!AI_API_KEY || 
      AI_API_KEY === 'your_openai_api_key_here' || 
      AI_API_KEY === '' || 
      AI_API_KEY === 'undefined' ||
      AI_API_KEY === 'null') {
    console.warn('AI API key not configured, using fallback streaming');
    const fallbackContent = "# Introduction to the Topic\n\nThis is a comprehensive lesson that covers the fundamental concepts and practical applications. We'll explore key principles, examine real-world examples, and provide you with the knowledge needed to master this subject.\n\n## Learning Objectives\n\nBy the end of this lesson, you will be able to:\n- Understand the core concepts\n- Apply the knowledge in practical scenarios\n- Identify key principles and best practices\n\n## Main Content\n\nLet's dive into the essential information you need to know...";
    
    // Simulate streaming by sending words one by one
    const words = fallbackContent.split(' ');
    let fullContent = '';
    
    for (const word of words) {
      fullContent += (fullContent ? ' ' : '') + word;
      onChunk(word + ' ');
      // Small delay to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return fullContent;
  }

  try {
    const openai = new OpenAI({
      apiKey: AI_API_KEY,
      dangerouslyAllowBrowser: true
    });

    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an AI lesson generator that creates educational content with AI-generated titles. Generate engaging, descriptive titles and comprehensive lessons with clear structure, examples, and educational value. Use markdown formatting for better readability.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      stream: true
    });

    let fullContent = '';
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullContent += content;
        onChunk(content);
      }
    }

    return fullContent;
  } catch (error) {
    console.error('AI streaming call failed:', error);
    // Fallback to non-streaming
    const fallbackContent = await callAI(prompt);
    if (fallbackContent !== "FALLBACK_CONTENT") {
      // Stream the fallback content word by word
      const words = fallbackContent.split(' ');
      for (const word of words) {
        onChunk(word + ' ');
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }
    return fallbackContent;
  }
}

// Generate AI-powered lesson
export async function generateStreamingLesson(
  topic: string, 
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  onChunk: (chunk: string) => void
): Promise<string> {
  const correctedTopic = correctTopicTypos(topic);
  
  const prompt = `You are an AI lesson generator that creates educational content with AI-generated titles. Your task is to generate a complete lesson on the topic "${correctedTopic}" at ${difficulty} level.

**Instructions:**
1. First, generate an engaging, descriptive title for the lesson using AI creativity
2. Then create a comprehensive lesson that includes:
   - Learning objectives
   - Introduction to the topic
   - Main content sections with clear explanations
   - Examples or case studies where relevant
   - Mathematical formulas using LaTeX format ($...$ for inline, $$...$$ for display)
   - Code examples using proper markdown code blocks
   - Summary or conclusion
   - Practice questions or activities

**Output Requirements:**
- Use clear markdown headings and formatting for better readability
- Ensure the content is educational, accurate, and engaging
- Adapt the complexity level to ${difficulty} audience
- Keep the lesson structured and logical in flow
- Include specific examples and practical applications
- For technical topics, include code examples with proper syntax
- For scientific topics, include relevant equations and formulas

**Format:**
Start with "# [AI-Generated Title]" then proceed with the lesson content.

**Topic:** ${correctedTopic}

Begin generating the lesson now:`;

  return await callAIStream(prompt, onChunk);
}

// Helper function to correct common typos in topics
function correctTopicTypos(topic: string): string {
  const corrections = {
    'quamtum': 'quantum',
    'quantom': 'quantum',
    'quantam': 'quantum',
    'machien': 'machine',
    'machin': 'machine',
    'javascirpt': 'javascript',
    'javasript': 'javascript',
    'pythom': 'python',
    'pyhton': 'python',
    'reactjs': 'react',
    'react.js': 'react',
    'nodejs': 'node.js',
    'node js': 'node.js',
    'artifical': 'artificial',
    'inteligence': 'intelligence',
    'programing': 'programming',
    'algoritm': 'algorithm',
    'algoritms': 'algorithms',
    'databse': 'database',
    'databses': 'databases'
  };
  
  let correctedTopic = topic.toLowerCase();
  
  // Apply corrections
  Object.entries(corrections).forEach(([typo, correction]) => {
    const regex = new RegExp(`\\b${typo}\\b`, 'gi');
    correctedTopic = correctedTopic.replace(regex, correction);
  });
  
  // Capitalize first letter of each word
  return correctedTopic.replace(/\b\w/g, l => l.toUpperCase());
}

// Generate lesson titles using AI
async function generateLessonTitles(topic: string, difficulty: string, numLessons: number): Promise<string[]> {
  const correctedTopic = correctTopicTypos(topic);
  
  const prompt = `Create ${numLessons} specific lesson titles for learning "${topic}" at ${difficulty} level.

Requirements:
- Each title should represent a distinct, important concept in ${correctedTopic}
- Titles should progress from basic to advanced concepts
- Use professional, specific terminology related to ${correctedTopic}
- Make titles actionable and clear about what students will learn
- For quantum mechanics, include topics like: wave-particle duality, uncertainty principle, superposition, entanglement, quantum states, operators, etc.
- For programming topics, include specific syntax, concepts, and practical applications
- For science topics, include fundamental principles, equations, and real-world applications

Return ONLY the titles, one per line, numbered 1-${numLessons}.`;

  const response = await callAI(prompt);
  
  // Parse the response to extract titles
  const lines = response.split('\n').filter(line => line.trim());
  const titles = lines.map(line => line.replace(/^\d+\.?\s*/, '').trim()).filter(title => title.length > 0);
  
  // Fallback titles if AI fails
  if (titles.length < numLessons) {
    const correctedTopic = correctTopicTypos(topic);
    let fallbackTitles = [];
    
    if (correctedTopic.toLowerCase().includes('quantum')) {
      fallbackTitles = [
        'Introduction to Quantum Mechanics',
        'Wave-Particle Duality',
        'The Uncertainty Principle',
        'Quantum Superposition',
        'Quantum Entanglement',
        'Schrödinger Equation',
        'Quantum Operators and Observables',
        'Quantum Tunneling',
        'Quantum Applications and Technology',
        'Advanced Quantum Concepts'
      ];
    } else {
      fallbackTitles = [
        `Fundamentals of ${correctedTopic}`,
        `Core Concepts in ${correctedTopic}`,
        `Practical Applications of ${correctedTopic}`,
        `Intermediate ${correctedTopic} Techniques`,
        `Advanced ${correctedTopic} Strategies`,
        `Real-World ${correctedTopic} Implementation`,
        `${correctedTopic} Best Practices`,
        `Troubleshooting ${correctedTopic}`,
        `Scaling ${correctedTopic} Solutions`,
        `Mastering ${correctedTopic}`
      ];
    }
    return fallbackTitles.slice(0, numLessons);
  }
  
  return titles.slice(0, numLessons);
}

// Generate introduction using AI
async function generateIntroduction(topic: string, lessonTitle: string, difficulty: string): Promise<string> {
  const correctedTopic = correctTopicTypos(topic);
  
  const prompt = `Write a detailed 200-300 word introduction for a ${difficulty} level lesson on "${lessonTitle}" in the context of learning ${topic}.

Requirements:
- Connect the concept to familiar, everyday analogies that anyone can understand
- Explain WHY this specific lesson matters for mastering ${correctedTopic}
- Set clear expectations for what students will learn
- Use encouraging, accessible language
- Make it specific to ${correctedTopic}, not generic
- Include real-world relevance
- For quantum mechanics, use analogies like spinning coins, wave pools, or particle behavior
- For programming, relate to building blocks, recipes, or problem-solving

Write in a conversational, engaging tone that builds excitement for learning.`;

  const response = await callAI(prompt);
  
  // Enhanced fallback content when API is not available
  if (response === "FALLBACK_CONTENT") {
    if (correctedTopic.toLowerCase().includes('quantum')) {
      return `Welcome to the fascinating world of ${lessonTitle}! Quantum mechanics might seem mysterious, but think of it like this: imagine you're trying to understand how the smallest building blocks of our universe behave. Just as you might study how LEGO blocks connect to build amazing structures, we're going to explore how particles and waves interact at the quantum level. This lesson on ${lessonTitle} is crucial because it forms one of the fundamental pillars of quantum theory. By the end of this lesson, you'll understand not just the theory, but how this concept applies to real technologies like quantum computers, lasers, and medical imaging devices. Don't worry if it seems complex at first - we'll break it down step by step, using everyday analogies to make these quantum concepts as clear as possible. Get ready to discover how the quantum world works!`;
    } else {
      return `Welcome to this comprehensive lesson on ${lessonTitle}! This topic is a fundamental building block in mastering ${correctedTopic}. Think of learning ${correctedTopic} like building a house - each concept we cover is like laying another brick in your foundation of knowledge. ${lessonTitle} is particularly important because it connects directly to real-world applications you'll encounter in professional ${correctedTopic} work. Throughout this lesson, we'll break down complex ideas into manageable pieces, provide practical examples you can relate to, and show you exactly how to apply what you learn. By the end, you'll have a solid understanding of ${lessonTitle} and be ready to tackle more advanced concepts. Let's dive in and explore how ${lessonTitle} works in the context of ${correctedTopic}!`;
    }
  }
  
  return response;
}

// Generate core definition using AI
async function generateCoreDefinition(topic: string, lessonTitle: string, difficulty: string): Promise<string> {
  const correctedTopic = correctTopicTypos(topic);
  
  const prompt = `Write a comprehensive 300-500 word technical explanation of "${lessonTitle}" in the context of ${topic} at ${difficulty} level.

Requirements:
- Provide precise, technical definitions specific to ${correctedTopic}
- Break down complex terms into understandable parts
- Include specific terminology, syntax, or key principles used in ${correctedTopic}
- Explain the underlying concepts and how they work
- Use proper technical language while remaining accessible
- Include specific details that professionals in ${correctedTopic} would recognize
- Make it actionable - students should understand HOW to apply this
- For quantum mechanics, include mathematical formulations, physical principles, and experimental evidence
- Include specific equations, constants, or formulas where relevant using LaTeX format (e.g., $E = mc^2$ for inline, $$E = mc^2$$ for block equations)
- For code examples, use proper code blocks with language specification
- Format mathematical expressions in LaTeX: use $...$ for inline math, $$...$$ for display math
- Use \`code\` for inline code snippets

Focus on depth and accuracy. This should be professional-level content.`;

  const response = await callAI(prompt);
  
  // Enhanced fallback content when API is not available
  if (response === "FALLBACK_CONTENT") {
    if (correctedTopic.toLowerCase().includes('quantum')) {
      return `${lessonTitle} represents a fundamental principle in quantum mechanics that governs how particles behave at the atomic and subatomic level. At its core, this concept challenges our classical understanding of physics by introducing probabilistic behavior rather than deterministic outcomes. 

The mathematical framework involves wave functions $\\psi$, which describe the quantum state of a system, and operators that act upon these states to extract measurable quantities. Key principles include the superposition principle, where quantum systems can exist in multiple states simultaneously until measured, and the measurement problem, where observation causes wave function collapse. 

The Schrödinger equation governs the time evolution of quantum systems:
$$i\\hbar\\frac{\\partial\\psi}{\\partial t} = \\hat{H}\\psi$$

While Heisenberg's uncertainty principle sets fundamental limits on simultaneous measurement precision:
$$\\Delta x \\Delta p \\geq \\frac{\\hbar}{2}$$

These concepts aren't just theoretical - they form the basis for modern technologies including lasers, MRI machines, quantum computers, and semiconductor devices. Understanding ${lessonTitle} requires grasping both the mathematical formalism and the physical intuition behind quantum behavior.`;
    } else {
      return `${lessonTitle} is a core concept in ${correctedTopic} that professionals use daily in real-world applications. At its foundation, this concept involves understanding the fundamental principles that govern how ${correctedTopic} systems operate and interact. The technical implementation requires mastering specific methodologies, best practices, and industry-standard approaches that have been refined over years of practical application. Key components include understanding the underlying architecture, learning the proper syntax and conventions, and knowing how to troubleshoot common issues that arise in production environments. This knowledge directly translates to practical skills you'll use in professional ${correctedTopic} work, from basic implementation to advanced optimization techniques. Modern ${correctedTopic} relies heavily on these principles, and mastering ${lessonTitle} will give you the foundation needed to tackle complex projects and collaborate effectively with other professionals in the field.`;
    }
  }
  
  return response;
}

// Generate examples using AI
async function generateExamples(topic: string, lessonTitle: string, difficulty: string): Promise<string[]> {
  const correctedTopic = correctTopicTypos(topic);
  
  const prompt = `Create 4 detailed, specific examples for "${lessonTitle}" in ${topic} at ${difficulty} level. Each example should be 100-200 words.

Requirements:
- Include actual code snippets, formulas, step-by-step processes, or real procedures specific to ${correctedTopic}
- Show different aspects or use cases of the concept
- Use industry-standard practices and realistic scenarios
- Make examples progressively more complex
- Include specific syntax, commands, or technical details
- Each example should be practical and immediately applicable
- For quantum mechanics, include mathematical derivations, experimental setups, or real-world applications
- For programming, include actual code with explanations
- Format code using proper code blocks: \`\`\`language\ncode here\n\`\`\`
- Format mathematical expressions using LaTeX: $...$ for inline, $$...$$ for display
- Use \`code\` for inline code snippets

Format as 4 separate examples, clearly distinct from each other.

Example format:
**Example 1: [Specific scenario]**
[Detailed explanation with code/process]

**Example 2: [Different scenario]**
[Detailed explanation with code/process]

Continue for all 4 examples.`;

  let response = await callAI(prompt);
  
  // Parse examples from the response
  const examples = response.split(/\*\*Example \d+:/).slice(1).map(example => {
    return example.trim().replace(/^\*\*/, '').trim();
  });
  
  // Fallback if parsing fails
  if (examples.length < 4) {
    const correctedTopic = correctTopicTypos(topic);
    
    if (correctedTopic.toLowerCase().includes('quantum')) {
      return [
        `**Double-Slit Experiment**: When electrons are fired through two parallel slits, they create an interference pattern on a detector screen, demonstrating wave-like behavior. However, when we try to observe which slit each electron passes through, the interference pattern disappears and electrons behave like particles. This fundamental experiment shows the wave-particle duality central to ${lessonTitle}. The mathematical description involves probability amplitudes $\\psi_1$ and $\\psi_2$ for each slit, where the total amplitude is $\\psi = \\psi_1 + \\psi_2$, and the probability is $|\\psi|^2$.`,
        `**Quantum Tunneling in Electronics**: In quantum tunneling, particles can pass through energy barriers that should be impossible to cross classically. This effect is used in tunnel diodes and scanning tunneling microscopes. The probability of tunneling depends exponentially on barrier width and height, following the equation: $$T \\approx e^{-2\\kappa a}$$ where $\\kappa = \\sqrt{2m(V-E)}/\\hbar$. Real applications include flash memory storage and quantum computing qubits.`,
        `**Schrödinger's Cat Thought Experiment**: A cat in a box with a quantum-triggered poison mechanism exists in a superposition of alive and dead states until observed. This illustrates how quantum superposition applies to macroscopic objects and highlights the measurement problem in quantum mechanics related to ${lessonTitle}. The wave function $|\\psi\\rangle = \\alpha|\\text{alive}\\rangle + \\beta|\\text{dead}\\rangle$ collapses upon measurement.`,
        `**Quantum Entanglement in Cryptography**: Two particles can be quantum ententangled, meaning measuring one instantly affects the other regardless of distance. This property is used in quantum key distribution for ultra-secure communication, where any eavesdropping attempt can be detected through changes in the quantum states. The Bell inequality violation proves non-local correlations exist in nature.`
      ];
    } else {
      return [
        `**Basic Implementation**: Start with a simple ${lessonTitle} example in ${correctedTopic}. This involves setting up the basic structure, understanding the core syntax, and implementing a minimal working version. For example, if working with data structures, you'd initialize the structure, add basic elements, and perform simple operations:

\`\`\`javascript
// Basic example
const example = new DataStructure();
example.add('item');
console.log(example.get());
\`\`\`

The key is understanding the fundamental concepts before moving to complex scenarios.`,
        `**Real-World Application**: Here's how ${lessonTitle} is used in production ${correctedTopic} environments. Professional developers implement this concept to solve specific business problems, optimize performance, and maintain code quality. This includes error handling, edge case management, and integration with existing systems. The implementation follows industry standards and best practices.`,
        `**Advanced Optimization**: This example shows ${lessonTitle} in a complex ${correctedTopic} scenario requiring advanced techniques. It involves performance optimization, scalability considerations, and sophisticated algorithms. Professional developers use these patterns in large-scale applications where efficiency and maintainability are critical. The solution demonstrates mastery of the concept.`,
        `**Professional Integration**: This demonstrates ${lessonTitle} integrated with other ${correctedTopic} concepts in a complete system. It shows how the concept fits into larger architectures, handles complex data flows, and maintains system reliability. This is the level of implementation you'd see in enterprise applications and production systems.`
      ];
    }
  }
  
  return examples.slice(0, 4);
}

// Generate assessment using AI
async function generateAssessment(topic: string, lessonTitle: string, difficulty: string): Promise<{
  question: string;
  options: string[];
  correct: number;
}> {
  const correctedTopic = correctTopicTypos(topic);
  
  const prompt = `Create a challenging assessment question for "${lessonTitle}" in ${topic} at ${difficulty} level.

Requirements:
- Test deep understanding, not just memorization
- Require applying knowledge of ${lessonTitle} in ${correctedTopic}
- Include 4 realistic answer options with plausible distractors
- Make the question specific to ${correctedTopic} concepts
- Ensure only one clearly correct answer
- Use professional terminology from ${correctedTopic}
- For quantum mechanics, include mathematical concepts, physical principles, or experimental scenarios

Format:
Question: [Your challenging question about ${lessonTitle}]
A) [Option 1]
B) [Option 2] 
C) [Option 3]
D) [Option 4]
Correct: [A, B, C, or D]`;

  const response = await callAI(prompt);
  
  // Parse the assessment
  const lines = response.split('\n').filter(line => line.trim());
  const questionLine = lines.find(line => line.startsWith('Question:'));
  const optionLines = lines.filter(line => /^[A-D]\)/.test(line.trim()));
  const correctLine = lines.find(line => line.startsWith('Correct:'));
  
  if (!questionLine || optionLines.length < 4 || !correctLine) {
    // Fallback assessment
    const correctedTopic = correctTopicTypos(topic);
    
    if (correctedTopic.toLowerCase().includes('quantum')) {
      return {
        question: `According to ${lessonTitle} principles, what fundamental change occurs when a quantum system is observed or measured?`,
        options: [
          `The wave function ψ collapses to a definite eigenstate, ending quantum superposition and yielding a specific measurement outcome`,
          `The system maintains superposition indefinitely, with all quantum states remaining equally probable`,
          `All possible quantum states become equally probable, but superposition continues unchanged`,
          `The measurement process has no effect on the quantum system's wave function or state`
        ],
        correct: 0
      };
    }
    
    return {
      question: `When implementing ${lessonTitle} in professional ${correctedTopic} development, what is the most critical consideration for success?`,
      options: [
        `Understanding the fundamental principles, proper implementation patterns, and following industry best practices`,
        `Memorizing all technical terminology and syntax without understanding the underlying concepts`,
        `Always choosing the most complex implementation approach regardless of project requirements`,
        `Avoiding established best practices in favor of completely novel approaches`
      ],
      correct: 0
    };
  }
  
  const question = questionLine.replace('Question:', '').trim();
  const options = optionLines.map(line => line.replace(/^[A-D]\)\s*/, '').trim());
  const correctLetter = correctLine.replace('Correct:', '').trim().toUpperCase();
  const correct = ['A', 'B', 'C', 'D'].indexOf(correctLetter);
  
  return {
    question,
    options,
    correct: correct >= 0 ? correct : 0
  };
}

// Determine optimal lesson count
function getOptimalLessonCount(topic: string, difficulty: string): number {
  const lowerTopic = topic.toLowerCase();
  
  let topicComplexity = 'low';
  
  // High complexity topics
  if (lowerTopic.includes('machine learning') || lowerTopic.includes('artificial intelligence') ||
      lowerTopic.includes('quantum') || lowerTopic.includes('blockchain') ||
      lowerTopic.includes('advanced') || lowerTopic.includes('deep learning') ||
      lowerTopic.includes('neural network') || lowerTopic.includes('cryptography') ||
      lowerTopic.includes('compiler') || lowerTopic.includes('distributed systems')) {
    topicComplexity = 'high';
  }
  // Medium complexity topics
  else if (lowerTopic.includes('programming') || lowerTopic.includes('database') ||
           lowerTopic.includes('web development') || lowerTopic.includes('data structure') ||
           lowerTopic.includes('algorithm') || lowerTopic.includes('framework') ||
           lowerTopic.includes('api') || lowerTopic.includes('security') ||
           lowerTopic.includes('network') || lowerTopic.includes('system design')) {
    topicComplexity = 'medium';
  }
  
  if (difficulty === 'beginner') {
    return topicComplexity === 'high' ? 6 : topicComplexity === 'medium' ? 4 : 3;
  } else if (difficulty === 'intermediate') {
    return topicComplexity === 'high' ? 8 : topicComplexity === 'medium' ? 6 : 4;
  } else { // advanced
    return topicComplexity === 'high' ? 10 : topicComplexity === 'medium' ? 8 : 6;
  }
}

// Auto-determine category
function determineCategory(topic: string): string {
  const lowerTopic = topic.toLowerCase();
  
  if (lowerTopic.includes('programming') || lowerTopic.includes('coding') || 
      lowerTopic.includes('javascript') || lowerTopic.includes('python') || 
      lowerTopic.includes('react') || lowerTopic.includes('web') || 
      lowerTopic.includes('software') || lowerTopic.includes('computer') ||
      lowerTopic.includes('ai') || lowerTopic.includes('machine learning') ||
      lowerTopic.includes('data') || lowerTopic.includes('algorithm') ||
      lowerTopic.includes('database') || lowerTopic.includes('api') ||
      lowerTopic.includes('cloud') || lowerTopic.includes('cybersecurity') ||
      lowerTopic.includes('blockchain') || lowerTopic.includes('iot')) {
    return 'technology';
  }
  
  if (lowerTopic.includes('biology') || lowerTopic.includes('chemistry') || 
      lowerTopic.includes('physics') || lowerTopic.includes('math') || 
      lowerTopic.includes('science') || lowerTopic.includes('research') ||
      lowerTopic.includes('experiment') || lowerTopic.includes('theory') ||
      lowerTopic.includes('quantum') || lowerTopic.includes('molecular') ||
      lowerTopic.includes('genetics') || lowerTopic.includes('astronomy') ||
      lowerTopic.includes('ecology') || lowerTopic.includes('neuroscience')) {
    return 'science';
  }
  
  if (lowerTopic.includes('business') || lowerTopic.includes('marketing') || 
      lowerTopic.includes('management') || lowerTopic.includes('finance') || 
      lowerTopic.includes('economics') || lowerTopic.includes('strategy') ||
      lowerTopic.includes('leadership') || lowerTopic.includes('sales') ||
      lowerTopic.includes('entrepreneurship') || lowerTopic.includes('startup') ||
      lowerTopic.includes('investment') || lowerTopic.includes('accounting') ||
      lowerTopic.includes('project management') || lowerTopic.includes('hr')) {
    return 'business';
  }
  
  if (lowerTopic.includes('health') || lowerTopic.includes('medicine') || 
      lowerTopic.includes('fitness') || lowerTopic.includes('nutrition') || 
      lowerTopic.includes('wellness') || lowerTopic.includes('mental health') ||
      lowerTopic.includes('psychology') || lowerTopic.includes('therapy') ||
      lowerTopic.includes('medical') || lowerTopic.includes('anatomy') ||
      lowerTopic.includes('exercise') || lowerTopic.includes('diet')) {
    return 'health';
  }
  
  if (lowerTopic.includes('language') || lowerTopic.includes('english') || 
      lowerTopic.includes('spanish') || lowerTopic.includes('french') || 
      lowerTopic.includes('german') || lowerTopic.includes('chinese') ||
      lowerTopic.includes('japanese') || lowerTopic.includes('grammar') ||
      lowerTopic.includes('vocabulary') || lowerTopic.includes('writing') ||
      lowerTopic.includes('speaking') || lowerTopic.includes('reading') ||
      lowerTopic.includes('literature') || lowerTopic.includes('linguistics')) {
    return 'language';
  }
  
  if (lowerTopic.includes('art') || lowerTopic.includes('design') || 
      lowerTopic.includes('music') || lowerTopic.includes('painting') || 
      lowerTopic.includes('drawing') || lowerTopic.includes('photography') ||
      lowerTopic.includes('creative') || lowerTopic.includes('visual') ||
      lowerTopic.includes('sculpture') || lowerTopic.includes('theater') ||
      lowerTopic.includes('dance') || lowerTopic.includes('film') ||
      lowerTopic.includes('animation') || lowerTopic.includes('graphic')) {
    return 'arts';
  }
  
  return 'other';
}

export async function generateLessonSeries(request: AIGenerationRequest): Promise<LessonSeries> {
  const numLessons = getOptimalLessonCount(request.topic, request.difficulty);
  const correctedTopic = correctTopicTypos(request.topic);
  const category = determineCategory(correctedTopic);
  
  // Generate lesson titles using AI
  const lessonTitles = await generateLessonTitles(correctedTopic, request.difficulty, numLessons);
  
  const lessons: SeriesLesson[] = [];
  
  // Generate each lesson with custom AI prompts
  for (let i = 0; i < numLessons; i++) {
    const lessonTitle = lessonTitles[i];
    
    // Generate each section with specific AI prompts
    const [introduction, coreDefinition, examples, assessment] = await Promise.all([
      generateIntroduction(correctedTopic, lessonTitle, request.difficulty),
      generateCoreDefinition(correctedTopic, lessonTitle, request.difficulty),
      generateExamples(correctedTopic, lessonTitle, request.difficulty),
      generateAssessment(correctedTopic, lessonTitle, request.difficulty)
    ]);
    
    lessons.push({
      id: `lesson-${i + 1}`,
      series_id: `series-${Date.now()}`,
      lesson_number: i + 1,
      title: lessonTitle,
      introduction,
      core_definition: coreDefinition,
      examples,
      assessment_question: assessment.question,
      assessment_options: assessment.options,
      correct_answer: assessment.correct,
      completed: false,
      duration_minutes: 15
    });
  }

  return {
    id: `series-${Date.now()}`,
    user_id: 'current-user',
    title: `Master ${correctedTopic}`,
    description: `A comprehensive ${numLessons}-lesson journey from ${request.difficulty} to proficiency in ${correctedTopic}`,
    category,
    difficulty: request.difficulty,
    total_lessons: numLessons,
    completed_lessons: 0,
    lessons,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export async function generateLesson(request: AIGenerationRequest): Promise<string> {
  const prompt = `Create a comprehensive ${request.difficulty} level lesson about "${request.topic}" in the ${request.category} category. 
  The lesson should be approximately ${request.duration} minutes long.
  
  Please structure the lesson with:
  1. Clear learning objectives
  2. Main content broken into digestible sections
  3. Practical examples or exercises
  4. Key takeaways
  5. Suggested next steps
  
  Make it engaging and educational. Format the response in markdown.`;

  return await callAI(prompt);
}

export async function chatWithAI(message: string, context?: string): Promise<string> {
  const systemPrompt = context 
    ? `You are a helpful learning assistant. The user is asking about this lesson context: ${context}. Provide helpful, encouraging responses that support their learning journey.`
    : 'You are a helpful learning assistant. Provide supportive, educational responses to help users with their learning goals.';

  const prompt = `${systemPrompt}\n\nUser message: ${message}`;
  
  return await callAI(prompt);
}

// Generate an AI-powered title for the topic
async function generateAIPoweredTitle(topic: string, difficulty: string): Promise<string> {
  const correctedTopic = correctTopicTypos(topic);
  
  const prompt = `Generate an AI-powered title for the topic "${correctedTopic}" at ${difficulty} level. The title should be engaging, descriptive, and relevant to the topic. Use creativity to make it stand out.`;
  const title = await callAI(prompt);
  
  return title;
}

// Generate lesson in the background
export async function generateLessonInBackground(
  topic: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  onChunk: (chunk: string) => void
): Promise<void> {
  const correctedTopic = correctTopicTypos(topic);
  const aiGeneratedTitle = await generateAIPoweredTitle(correctedTopic, difficulty);
  const prompt = `Generate a comprehensive lesson on "${aiGeneratedTitle}" at ${difficulty} level.`;

  try {
    await callAIStream(prompt, onChunk);
  } catch (error) {
    console.error('Background lesson generation failed:', error);
  }
}

function showBanner(message: string) {
  const banner = document.createElement('div');
  banner.textContent = message;
  banner.style.position = 'fixed';
  banner.style.top = '0';
  banner.style.width = '100%';
  banner.style.backgroundColor = '#4caf50';
  banner.style.color = '#fff';
  banner.style.textAlign = 'center';
  banner.style.padding = '10px';
  banner.style.zIndex = '1000';
  document.body.appendChild(banner);

  setTimeout(() => {
    banner.remove();
  }, 5000);
}

export async function generateLessonWithBanner(
  topic: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  onChunk: (chunk: string) => void
): Promise<void> {
  showBanner('Lesson generation started...');

  try {
    await generateLessonInBackground(topic, difficulty, onChunk);
    showBanner('Lesson generation completed!');
  } catch (error) {
    console.error('Lesson generation failed:', error);
    showBanner('Lesson generation failed. Please try again.');
  }
}