# Complete AI Integration Guide for JavaScript

## Table of Contents
1. [AI APIs and Libraries Overview](#ai-apis-and-libraries-overview)
2. [Setup and Installation](#setup-and-installation)
3. [OpenAI API Integration](#openai-api-integration)
4. [Alternative AI Services](#alternative-ai-services)
5. [Error Handling and Debugging](#error-handling-and-debugging)
6. [Testing Strategies](#testing-strategies)
7. [Production Considerations](#production-considerations)
8. [Common Issues and Solutions](#common-issues-and-solutions)

## AI APIs and Libraries Overview

### Recommended AI Services for JavaScript

1. **OpenAI API** - Best for text generation, chat, and embeddings
2. **OpenRouter** - Access to multiple AI models through one API
3. **Anthropic Claude** - Excellent for reasoning and analysis
4. **Hugging Face** - Open-source models and transformers
5. **TensorFlow.js** - Client-side machine learning
6. **Google AI (Gemini)** - Multimodal AI capabilities

### When to Use Each Service

- **OpenAI**: General-purpose text generation, chatbots, content creation
- **OpenRouter**: When you need access to multiple models or cost optimization
- **Claude**: Complex reasoning, analysis, code review
- **Hugging Face**: Open-source models, custom fine-tuning
- **TensorFlow.js**: Real-time inference in browser, offline capabilities
- **Gemini**: Multimodal applications (text + images)

## Setup and Installation

### Frontend Dependencies
```bash
# Core AI libraries
npm install openai @anthropic-ai/sdk @huggingface/inference

# Utility libraries
npm install axios dotenv

# For TensorFlow.js
npm install @tensorflow/tfjs @tensorflow/tfjs-node
```

### Backend Dependencies (Node.js)
```bash
# Same as frontend plus server-specific
npm install express cors helmet rate-limiter-flexible

# Environment management
npm install dotenv
```

## OpenAI API Integration

### 1. Environment Setup

Create `.env` file:
```env
OPENAI_API_KEY=sk-your-openai-key-here
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
```

### 2. Frontend Implementation

```javascript
// utils/aiClient.js
import OpenAI from 'openai';

class AIClient {
  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Only for development
    });
    
    this.openrouter = new OpenAI({
      apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Your App Name'
      },
      dangerouslyAllowBrowser: true
    });
  }

  async generateText(prompt, options = {}) {
    const {
      model = 'gpt-3.5-turbo',
      maxTokens = 1000,
      temperature = 0.7,
      useOpenRouter = false
    } = options;

    try {
      const client = useOpenRouter ? this.openrouter : this.openai;
      
      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature,
        stream: false
      });

      return {
        success: true,
        data: response.choices[0].message.content,
        usage: response.usage
      };
    } catch (error) {
      console.error('AI API Error:', error);
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  async generateStream(prompt, onChunk, options = {}) {
    const {
      model = 'gpt-3.5-turbo',
      maxTokens = 1000,
      temperature = 0.7
    } = options;

    try {
      const stream = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature,
        stream: true
      });

      let fullResponse = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          onChunk(content, fullResponse);
        }
      }

      return { success: true, data: fullResponse };
    } catch (error) {
      console.error('Streaming Error:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  async generateEmbeddings(text, model = 'text-embedding-ada-002') {
    try {
      const response = await this.openai.embeddings.create({
        model,
        input: text
      });

      return {
        success: true,
        data: response.data[0].embedding,
        usage: response.usage
      };
    } catch (error) {
      console.error('Embeddings Error:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  handleError(error) {
    if (error.status === 401) {
      return 'Invalid API key. Please check your configuration.';
    } else if (error.status === 429) {
      return 'Rate limit exceeded. Please try again later.';
    } else if (error.status === 500) {
      return 'AI service is temporarily unavailable.';
    } else if (error.code === 'NETWORK_ERROR') {
      return 'Network error. Please check your connection.';
    }
    return error.message || 'An unexpected error occurred.';
  }

  async testConnection() {
    try {
      const result = await this.generateText('Say "Hello, World!"', {
        maxTokens: 10
      });
      return result;
    } catch (error) {
      return { success: false, error: this.handleError(error) };
    }
  }
}

export default new AIClient();
```

### 3. React Component Example

```javascript
// components/AIChat.jsx
import React, { useState, useRef, useEffect } from 'react';
import aiClient from '../utils/aiClient';

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const result = await aiClient.generateText(input, {
        model: 'gpt-3.5-turbo',
        maxTokens: 500,
        temperature: 0.7
      });

      if (result.success) {
        const aiMessage = { role: 'assistant', content: result.data };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendStreamingMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    // Add placeholder for AI response
    const aiMessageIndex = messages.length + 1;
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

    try {
      await aiClient.generateStream(
        input,
        (chunk, fullResponse) => {
          setMessages(prev => 
            prev.map((msg, index) => 
              index === aiMessageIndex 
                ? { ...msg, content: fullResponse }
                : msg
            )
          );
        },
        { maxTokens: 500 }
      );

      // Mark streaming as complete
      setMessages(prev => 
        prev.map((msg, index) => 
          index === aiMessageIndex 
            ? { ...msg, streaming: false }
            : msg
        )
      );
    } catch (err) {
      setError('Failed to send message. Please try again.');
      // Remove failed message
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-chat">
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <strong>{message.role === 'user' ? 'You' : 'AI'}:</strong>
            <span>{message.content}</span>
            {message.streaming && <span className="cursor">|</span>}
          </div>
        ))}
        {loading && !messages.some(m => m.streaming) && (
          <div className="message assistant">
            <strong>AI:</strong>
            <span>Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>
          Send
        </button>
        <button onClick={sendStreamingMessage} disabled={loading || !input.trim()}>
          Stream
        </button>
      </div>
    </div>
  );
};

export default AIChat;
```

### 4. Backend Implementation (Node.js/Express)

```javascript
// server/aiService.js
const OpenAI = require('openai');
const rateLimit = require('express-rate-limit');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.openrouter = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': process.env.APP_NAME || 'AI App'
      }
    });
  }

  // Rate limiting middleware
  createRateLimit() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many AI requests, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  async generateText(prompt, options = {}) {
    const {
      model = 'gpt-3.5-turbo',
      maxTokens = 1000,
      temperature = 0.7,
      systemPrompt = 'You are a helpful assistant.',
      useOpenRouter = false
    } = options;

    try {
      const client = useOpenRouter ? this.openrouter : this.openai;
      
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature,
        stream: false
      });

      return {
        success: true,
        data: response.choices[0].message.content,
        usage: response.usage,
        model: response.model
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  async generateWithRetry(prompt, options = {}, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.generateText(prompt, options);
        if (result.success) {
          return result;
        }
        lastError = result.error;
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    return { success: false, error: lastError };
  }

  handleError(error) {
    const errorMap = {
      401: 'Invalid API key',
      429: 'Rate limit exceeded',
      500: 'AI service unavailable',
      503: 'Service temporarily unavailable'
    };

    return {
      message: errorMap[error.status] || error.message || 'Unknown error',
      status: error.status || 500,
      code: error.code
    };
  }

  async healthCheck() {
    try {
      const result = await this.generateText('Say "OK"', { maxTokens: 5 });
      return { healthy: result.success, details: result };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
}

module.exports = new AIService();
```

```javascript
// server/routes/ai.js
const express = require('express');
const aiService = require('../aiService');
const router = express.Router();

// Apply rate limiting to all AI routes
router.use(aiService.createRateLimit());

// Text generation endpoint
router.post('/generate', async (req, res) => {
  try {
    const { prompt, options = {} } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required and must be a string'
      });
    }

    const result = await aiService.generateWithRetry(prompt, options);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(result.error.status || 500).json(result);
    }
  } catch (error) {
    console.error('Generate endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Streaming endpoint
router.post('/stream', async (req, res) => {
  try {
    const { prompt, options = {} } = req.body;
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const stream = await aiService.openai.chat.completions.create({
      model: options.model || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: options.systemPrompt || 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Stream endpoint error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  const health = await aiService.healthCheck();
  res.status(health.healthy ? 200 : 503).json(health);
});

module.exports = router;
```

## Alternative AI Services

### Anthropic Claude Integration

```javascript
// utils/claudeClient.js
import Anthropic from '@anthropic-ai/sdk';

class ClaudeClient {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }

  async generateText(prompt, options = {}) {
    const {
      model = 'claude-3-sonnet-20240229',
      maxTokens = 1000,
      temperature = 0.7,
      systemPrompt = 'You are a helpful assistant.'
    } = options;

    try {
      const response = await this.anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [
          { role: 'user', content: prompt }
        ]
      });

      return {
        success: true,
        data: response.content[0].text,
        usage: response.usage
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  handleError(error) {
    if (error.status === 401) {
      return 'Invalid Anthropic API key';
    } else if (error.status === 429) {
      return 'Rate limit exceeded';
    }
    return error.message || 'Unknown error';
  }
}

export default new ClaudeClient();
```

### Hugging Face Integration

```javascript
// utils/huggingFaceClient.js
import { HfInference } from '@huggingface/inference';

class HuggingFaceClient {
  constructor() {
    this.hf = new HfInference(import.meta.env.VITE_HUGGINGFACE_API_KEY);
  }

  async generateText(prompt, options = {}) {
    const {
      model = 'microsoft/DialoGPT-medium',
      maxTokens = 100,
      temperature = 0.7
    } = options;

    try {
      const response = await this.hf.textGeneration({
        model,
        inputs: prompt,
        parameters: {
          max_new_tokens: maxTokens,
          temperature,
          return_full_text: false
        }
      });

      return {
        success: true,
        data: response.generated_text
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async classifyText(text, labels) {
    try {
      const response = await this.hf.zeroShotClassification({
        inputs: text,
        parameters: { candidate_labels: labels }
      });

      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async summarizeText(text) {
    try {
      const response = await this.hf.summarization({
        inputs: text,
        parameters: {
          max_length: 150,
          min_length: 30
        }
      });

      return {
        success: true,
        data: response.summary_text
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new HuggingFaceClient();
```

## Error Handling and Debugging

### Comprehensive Error Handler

```javascript
// utils/errorHandler.js
class AIErrorHandler {
  static handle(error, context = '') {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      context,
      originalError: error
    };

    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('fetch')) {
      return {
        type: 'network',
        message: 'Network connection failed. Please check your internet connection.',
        retryable: true,
        ...errorInfo
      };
    }

    // API key errors
    if (error.status === 401 || error.message?.includes('API key')) {
      return {
        type: 'authentication',
        message: 'Invalid API key. Please check your configuration.',
        retryable: false,
        ...errorInfo
      };
    }

    // Rate limiting
    if (error.status === 429) {
      const retryAfter = error.headers?.['retry-after'] || 60;
      return {
        type: 'rate_limit',
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        retryable: true,
        retryAfter,
        ...errorInfo
      };
    }

    // Server errors
    if (error.status >= 500) {
      return {
        type: 'server',
        message: 'AI service is temporarily unavailable. Please try again later.',
        retryable: true,
        ...errorInfo
      };
    }

    // CORS errors
    if (error.message?.includes('CORS')) {
      return {
        type: 'cors',
        message: 'Cross-origin request blocked. This may require server-side implementation.',
        retryable: false,
        ...errorInfo
      };
    }

    // Generic error
    return {
      type: 'unknown',
      message: error.message || 'An unexpected error occurred.',
      retryable: false,
      ...errorInfo
    };
  }

  static async withRetry(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = this.handle(error, `Attempt ${attempt}/${maxRetries}`);
        
        if (!lastError.retryable || attempt === maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

export default AIErrorHandler;
```

### Debug Logger

```javascript
// utils/debugLogger.js
class DebugLogger {
  constructor(enabled = process.env.NODE_ENV === 'development') {
    this.enabled = enabled;
  }

  log(level, message, data = {}) {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };

    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, data);
    
    // Store in localStorage for debugging
    if (typeof window !== 'undefined') {
      const logs = JSON.parse(localStorage.getItem('ai_debug_logs') || '[]');
      logs.push(logEntry);
      
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('ai_debug_logs', JSON.stringify(logs));
    }
  }

  info(message, data) {
    this.log('info', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  error(message, data) {
    this.log('error', message, data);
  }

  debug(message, data) {
    this.log('debug', message, data);
  }

  getLogs() {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('ai_debug_logs') || '[]');
  }

  clearLogs() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ai_debug_logs');
    }
  }
}

export default new DebugLogger();
```

## Testing Strategies

### API Connection Tester

```javascript
// utils/apiTester.js
import aiClient from './aiClient';
import claudeClient from './claudeClient';
import huggingFaceClient from './huggingFaceClient';
import debugLogger from './debugLogger';

class APITester {
  async testAllServices() {
    const results = {};
    
    // Test OpenAI
    debugLogger.info('Testing OpenAI API...');
    results.openai = await this.testOpenAI();
    
    // Test OpenRouter
    debugLogger.info('Testing OpenRouter API...');
    results.openrouter = await this.testOpenRouter();
    
    // Test Claude
    debugLogger.info('Testing Claude API...');
    results.claude = await this.testClaude();
    
    // Test Hugging Face
    debugLogger.info('Testing Hugging Face API...');
    results.huggingface = await this.testHuggingFace();
    
    return results;
  }

  async testOpenAI() {
    try {
      const start = Date.now();
      const result = await aiClient.generateText('Say "Hello from OpenAI"', {
        maxTokens: 10,
        model: 'gpt-3.5-turbo'
      });
      const duration = Date.now() - start;
      
      return {
        success: result.success,
        response: result.data,
        duration,
        error: result.error,
        usage: result.usage
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: 0
      };
    }
  }

  async testOpenRouter() {
    try {
      const start = Date.now();
      const result = await aiClient.generateText('Say "Hello from OpenRouter"', {
        maxTokens: 10,
        model: 'openai/gpt-3.5-turbo',
        useOpenRouter: true
      });
      const duration = Date.now() - start;
      
      return {
        success: result.success,
        response: result.data,
        duration,
        error: result.error,
        usage: result.usage
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: 0
      };
    }
  }

  async testClaude() {
    try {
      const start = Date.now();
      const result = await claudeClient.generateText('Say "Hello from Claude"', {
        maxTokens: 10
      });
      const duration = Date.now() - start;
      
      return {
        success: result.success,
        response: result.data,
        duration,
        error: result.error,
        usage: result.usage
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: 0
      };
    }
  }

  async testHuggingFace() {
    try {
      const start = Date.now();
      const result = await huggingFaceClient.generateText('Hello', {
        maxTokens: 10
      });
      const duration = Date.now() - start;
      
      return {
        success: result.success,
        response: result.data,
        duration,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: 0
      };
    }
  }

  async performanceTest(service = 'openai', iterations = 5) {
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      debugLogger.info(`Performance test ${i + 1}/${iterations} for ${service}`);
      
      const start = Date.now();
      let result;
      
      switch (service) {
        case 'openai':
          result = await this.testOpenAI();
          break;
        case 'openrouter':
          result = await this.testOpenRouter();
          break;
        case 'claude':
          result = await this.testClaude();
          break;
        case 'huggingface':
          result = await this.testHuggingFace();
          break;
        default:
          throw new Error(`Unknown service: ${service}`);
      }
      
      results.push({
        iteration: i + 1,
        ...result,
        timestamp: new Date().toISOString()
      });
      
      // Wait between requests to avoid rate limiting
      if (i < iterations - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const successful = results.filter(r => r.success);
    const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    const successRate = (successful.length / results.length) * 100;
    
    return {
      service,
      iterations,
      successRate,
      avgDuration,
      results
    };
  }
}

export default new APITester();
```

### React Testing Component

```javascript
// components/APITester.jsx
import React, { useState } from 'react';
import apiTester from '../utils/apiTester';
import debugLogger from '../utils/debugLogger';

const APITester = () => {
  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);
  const [selectedService, setSelectedService] = useState('all');

  const runTests = async () => {
    setTesting(true);
    setTestResults(null);
    
    try {
      let results;
      
      if (selectedService === 'all') {
        results = await apiTester.testAllServices();
      } else {
        const singleResult = await apiTester[`test${selectedService.charAt(0).toUpperCase() + selectedService.slice(1)}`]();
        results = { [selectedService]: singleResult };
      }
      
      setTestResults(results);
      debugLogger.info('API tests completed', results);
    } catch (error) {
      debugLogger.error('API test failed', { error: error.message });
      setTestResults({ error: error.message });
    } finally {
      setTesting(false);
    }
  };

  const runPerformanceTest = async () => {
    if (selectedService === 'all') return;
    
    setTesting(true);
    try {
      const results = await apiTester.performanceTest(selectedService, 5);
      setTestResults({ performance: results });
    } catch (error) {
      setTestResults({ error: error.message });
    } finally {
      setTesting(false);
    }
  };

  const renderResults = () => {
    if (!testResults) return null;
    
    if (testResults.error) {
      return (
        <div className="error">
          <h3>Test Failed</h3>
          <p>{testResults.error}</p>
        </div>
      );
    }
    
    if (testResults.performance) {
      const perf = testResults.performance;
      return (
        <div className="performance-results">
          <h3>Performance Test Results</h3>
          <p>Service: {perf.service}</p>
          <p>Success Rate: {perf.successRate.toFixed(1)}%</p>
          <p>Average Duration: {perf.avgDuration.toFixed(0)}ms</p>
          <details>
            <summary>Detailed Results</summary>
            <pre>{JSON.stringify(perf.results, null, 2)}</pre>
          </details>
        </div>
      );
    }
    
    return (
      <div className="test-results">
        <h3>API Test Results</h3>
        {Object.entries(testResults).map(([service, result]) => (
          <div key={service} className={`service-result ${result.success ? 'success' : 'failure'}`}>
            <h4>{service.toUpperCase()}</h4>
            <p>Status: {result.success ? '✅ Success' : '❌ Failed'}</p>
            {result.duration && <p>Duration: {result.duration}ms</p>}
            {result.response && <p>Response: {result.response}</p>}
            {result.error && <p>Error: {result.error}</p>}
            {result.usage && (
              <details>
                <summary>Usage Stats</summary>
                <pre>{JSON.stringify(result.usage, null, 2)}</pre>
              </details>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="api-tester">
      <h2>AI API Tester</h2>
      
      <div className="controls">
        <select 
          value={selectedService} 
          onChange={(e) => setSelectedService(e.target.value)}
          disabled={testing}
        >
          <option value="all">All Services</option>
          <option value="openai">OpenAI</option>
          <option value="openrouter">OpenRouter</option>
          <option value="claude">Claude</option>
          <option value="huggingface">Hugging Face</option>
        </select>
        
        <button onClick={runTests} disabled={testing}>
          {testing ? 'Testing...' : 'Run Tests'}
        </button>
        
        {selectedService !== 'all' && (
          <button onClick={runPerformanceTest} disabled={testing}>
            Performance Test
          </button>
        )}
      </div>
      
      {renderResults()}
      
      <div className="debug-logs">
        <h3>Debug Logs</h3>
        <button onClick={() => debugLogger.clearLogs()}>Clear Logs</button>
        <pre className="logs">
          {debugLogger.getLogs().slice(-10).map((log, i) => (
            <div key={i} className={`log-entry ${log.level}`}>
              [{log.timestamp}] {log.level.toUpperCase()}: {log.message}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
};

export default APITester;
```

## Production Considerations

### Environment Configuration

```javascript
// config/aiConfig.js
const config = {
  development: {
    openai: {
      apiKey: process.env.VITE_OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1',
      timeout: 30000,
      maxRetries: 3
    },
    openrouter: {
      apiKey: process.env.VITE_OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      timeout: 30000,
      maxRetries: 3
    },
    rateLimit: {
      requests: 100,
      window: 15 * 60 * 1000 // 15 minutes
    },
    debug: true
  },
  
  production: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY, // Server-side only
      baseURL: 'https://api.openai.com/v1',
      timeout: 60000,
      maxRetries: 5
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY, // Server-side only
      baseURL: 'https://openrouter.ai/api/v1',
      timeout: 60000,
      maxRetries: 5
    },
    rateLimit: {
      requests: 1000,
      window: 15 * 60 * 1000
    },
    debug: false
  }
};

const env = process.env.NODE_ENV || 'development';
export default config[env];
```

### Security Best Practices

```javascript
// middleware/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Security middleware
const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: [
          "'self'",
          "https://api.openai.com",
          "https://openrouter.ai",
          "https://api.anthropic.com",
          "https://api-inference.huggingface.co"
        ]
      }
    }
  }),
  
  // Rate limiting
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false
  }),
  
  // API key validation
  (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.CLIENT_API_KEY) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    next();
  }
];

module.exports = securityMiddleware;
```

## Common Issues and Solutions

### 1. CORS Issues

**Problem**: Cross-origin requests blocked
**Solution**: 
```javascript
// For development - use proxy in vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api/ai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ai/, '/v1')
      }
    }
  }
});

// For production - implement server-side proxy
app.use('/api/ai', createProxyMiddleware({
  target: 'https://api.openai.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/ai': '/v1'
  }
}));
```

### 2. API Key Security

**Problem**: Exposing API keys in frontend
**Solution**: Always use server-side proxy for production

```javascript
// ❌ Don't do this in production
const openai = new OpenAI({
  apiKey: 'sk-your-key-here', // Exposed to client
  dangerouslyAllowBrowser: true
});

// ✅ Do this instead
// Frontend makes request to your server
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'Hello' })
});

// Server handles AI API calls with secure key
```

### 3. Rate Limiting

**Problem**: Hitting API rate limits
**Solution**: Implement client-side queuing

```javascript
class RequestQueue {
  constructor(maxConcurrent = 3, delayBetween = 1000) {
    this.queue = [];
    this.running = 0;
    this.maxConcurrent = maxConcurrent;
    this.delayBetween = delayBetween;
  }

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { fn, resolve, reject } = this.queue.shift();

    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      setTimeout(() => this.process(), this.delayBetween);
    }
  }
}

const aiQueue = new RequestQueue(2, 1500); // Max 2 concurrent, 1.5s delay

// Usage
const result = await aiQueue.add(() => 
  aiClient.generateText('Your prompt here')
);
```

### 4. Error Recovery

**Problem**: Handling temporary failures
**Solution**: Implement exponential backoff

```javascript
async function withExponentialBackoff(fn, maxRetries = 3) {
  let delay = 1000; // Start with 1 second
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Don't retry on authentication errors
      if (error.status === 401) throw error;
      
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Double the delay
    }
  }
}
```

### 5. Memory Management

**Problem**: Memory leaks with streaming responses
**Solution**: Proper cleanup

```javascript
class StreamManager {
  constructor() {
    this.activeStreams = new Set();
  }

  async createStream(prompt, onChunk) {
    const controller = new AbortController();
    this.activeStreams.add(controller);

    try {
      const stream = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        stream: true
      }, {
        signal: controller.signal
      });

      for await (const chunk of stream) {
        if (controller.signal.aborted) break;
        onChunk(chunk.choices[0]?.delta?.content || '');
      }
    } finally {
      this.activeStreams.delete(controller);
    }
  }

  cleanup() {
    this.activeStreams.forEach(controller => controller.abort());
    this.activeStreams.clear();
  }
}

// Use in React component
useEffect(() => {
  const streamManager = new StreamManager();
  
  return () => {
    streamManager.cleanup(); // Cleanup on unmount
  };
}, []);
```

## Conclusion

This comprehensive guide provides you with:

1. **Multiple AI service integrations** with working code examples
2. **Robust error handling** and debugging strategies
3. **Production-ready security** and performance considerations
4. **Complete testing framework** to verify your implementations
5. **Solutions to common problems** you'll encounter

### Next Steps

1. **Start with the API tester** to verify your keys work
2. **Implement one service at a time** (recommend starting with OpenAI)
3. **Add error handling** from day one
4. **Test thoroughly** before deploying to production
5. **Monitor usage and costs** in production

### Key Takeaways

- **Never expose API keys** in frontend code for production
- **Always implement rate limiting** and error handling
- **Use server-side proxies** for secure API access
- **Test your integrations** regularly
- **Monitor performance** and costs

This guide should resolve your AI integration frustrations and provide a solid foundation for building AI-powered JavaScript applications.