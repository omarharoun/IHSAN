export interface KnowledgeNode {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  clickedAt: string;
  timeSpent: number; // in seconds
  understanding: 'explored' | 'learning' | 'mastered';
  relatedTopics: string[];
  prerequisites: string[];
  nextSteps: string[];
}

export interface LearningPath {
  id: string;
  topic: string;
  nodes: KnowledgeNode[];
  progress: number; // 0-100
  totalTimeSpent: number;
  createdAt: string;
  lastUpdated: string;
}

export interface KnowledgeInsight {
  type: 'prerequisite' | 'next_topic' | 'gap' | 'achievement';
  message: string;
  action?: string;
  priority: 'low' | 'medium' | 'high';
}

class KnowledgeTracker {
  private knowledgeNodes: Map<string, KnowledgeNode> = new Map();
  private learningPaths: Map<string, LearningPath> = new Map();
  private insights: KnowledgeInsight[] = [];
  private listeners: Set<() => void> = new Set();

  // Subscribe to changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners of changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Track when user clicks on a search result
  trackKnowledgeClick(searchResult: any, topic: string): KnowledgeNode {
    const nodeId = this.generateNodeId(searchResult.url, topic);
    console.log('Tracking knowledge click:', { nodeId, topic, title: searchResult.title });
    
    // Check if already exists
    if (this.knowledgeNodes.has(nodeId)) {
      const existing = this.knowledgeNodes.get(nodeId)!;
      existing.clickedAt = new Date().toISOString();
      existing.timeSpent += 30; // Add 30 seconds for re-visit
      console.log('Updated existing node:', existing.title);
      this.saveToStorage();
      this.notifyListeners();
      return existing;
    }

    // Create new knowledge node
    const knowledgeNode: KnowledgeNode = {
      id: nodeId,
      title: searchResult.title,
      url: searchResult.url,
      domain: searchResult.domain,
      snippet: searchResult.snippet,
      topic: topic,
      difficulty: this.assessDifficulty(searchResult),
      category: this.categorizeContent(searchResult),
      clickedAt: new Date().toISOString(),
      timeSpent: 30, // Initial 30 seconds
      understanding: 'explored',
      relatedTopics: this.extractRelatedTopics(searchResult),
      prerequisites: this.identifyPrerequisites(searchResult, topic),
      nextSteps: this.suggestNextSteps(searchResult, topic)
    };

    this.knowledgeNodes.set(nodeId, knowledgeNode);
    this.updateLearningPath(topic, knowledgeNode);
    this.generateInsights(knowledgeNode);
    
    console.log('Created new knowledge node:', knowledgeNode.title);
    console.log('Total nodes now:', this.knowledgeNodes.size);
    
    // Save to localStorage
    this.saveToStorage();
    
    // Notify listeners of the change
    this.notifyListeners();
    
    return knowledgeNode;
  }

  // Get learning progress for a topic
  getLearningProgress(topic: string): LearningPath | null {
    return this.learningPaths.get(topic) || null;
  }

  // Get all learning paths
  getAllLearningPaths(): LearningPath[] {
    return Array.from(this.learningPaths.values());
  }

  // Get all knowledge nodes
  getAllKnowledgeNodes(): KnowledgeNode[] {
    return Array.from(this.knowledgeNodes.values());
  }

  // Get knowledge insights
  getInsights(): KnowledgeInsight[] {
    return this.insights;
  }

  // Get recommended next topics
  getRecommendedTopics(): string[] {
    const allTopics = Array.from(this.knowledgeNodes.values())
      .map(node => node.relatedTopics)
      .flat()
      .filter((topic, index, arr) => arr.indexOf(topic) === index);

    return allTopics.slice(0, 10);
  }

  // Update time spent on a knowledge node
  updateTimeSpent(nodeId: string, additionalTime: number): void {
    const node = this.knowledgeNodes.get(nodeId);
    if (node) {
      node.timeSpent += additionalTime;
      
      // Update understanding based on time spent
      if (node.timeSpent > 300) { // 5 minutes
        node.understanding = 'learning';
      }
      if (node.timeSpent > 900) { // 15 minutes
        node.understanding = 'mastered';
      }
      
      this.saveToStorage();
    }
  }

  // Mark topic as completed
  markTopicCompleted(topic: string): void {
    const path = this.learningPaths.get(topic);
    if (path) {
      path.progress = 100;
      path.lastUpdated = new Date().toISOString();
      this.saveToStorage();
    }
  }

  // Get knowledge statistics
  getKnowledgeStats(): {
    totalNodes: number;
    totalTimeSpent: number;
    topicsExplored: number;
    masteryLevel: number;
    learningStreak: number;
  } {
    const nodes = Array.from(this.knowledgeNodes.values());
    const paths = Array.from(this.learningPaths.values());
    
    return {
      totalNodes: nodes.length,
      totalTimeSpent: nodes.reduce((sum, node) => sum + node.timeSpent, 0),
      topicsExplored: paths.length,
      masteryLevel: this.calculateMasteryLevel(nodes),
      learningStreak: this.calculateLearningStreak(nodes)
    };
  }

  // Private helper methods
  private generateNodeId(url: string, topic: string): string {
    return `${topic}-${btoa(url).slice(0, 10)}`;
  }

  private assessDifficulty(searchResult: any): 'beginner' | 'intermediate' | 'advanced' {
    const title = searchResult.title.toLowerCase();
    const snippet = searchResult.snippet.toLowerCase();
    const domain = searchResult.domain.toLowerCase();
    
    const advancedKeywords = ['advanced', 'expert', 'professional', 'enterprise', 'complex', 'optimization'];
    const beginnerKeywords = ['beginner', 'tutorial', 'introduction', 'basics', 'getting started', 'learn'];
    
    if (advancedKeywords.some(keyword => title.includes(keyword) || snippet.includes(keyword))) {
      return 'advanced';
    }
    if (beginnerKeywords.some(keyword => title.includes(keyword) || snippet.includes(keyword))) {
      return 'beginner';
    }
    
    // Check domain for difficulty hints
    if (domain.includes('github.com') || domain.includes('stackoverflow.com')) {
      return 'intermediate';
    }
    if (domain.includes('w3schools.com') || domain.includes('tutorialspoint.com')) {
      return 'beginner';
    }
    
    return 'intermediate';
  }

  private categorizeContent(searchResult: any): string {
    const domain = searchResult.domain.toLowerCase();
    const title = searchResult.title.toLowerCase();
    
    if (domain.includes('github.com')) return 'Code & Development';
    if (domain.includes('stackoverflow.com')) return 'Q&A & Problem Solving';
    if (domain.includes('wikipedia.org')) return 'Reference & Encyclopedia';
    if (domain.includes('youtube.com')) return 'Video & Tutorials';
    if (domain.includes('medium.com') || domain.includes('dev.to')) return 'Articles & Blogs';
    if (domain.includes('docs.') || domain.includes('documentation')) return 'Documentation';
    if (title.includes('tutorial') || title.includes('guide')) return 'Tutorials & Guides';
    if (title.includes('news') || title.includes('update')) return 'News & Updates';
    
    return 'General Knowledge';
  }

  private extractRelatedTopics(searchResult: any): string[] {
    const text = `${searchResult.title} ${searchResult.snippet}`.toLowerCase();
    const commonTopics = [
      'javascript', 'python', 'react', 'nodejs', 'css', 'html', 'api', 'database',
      'machine learning', 'ai', 'web development', 'mobile development', 'design',
      'security', 'testing', 'deployment', 'cloud', 'docker', 'kubernetes'
    ];
    
    return commonTopics.filter(topic => text.includes(topic));
  }

  private identifyPrerequisites(searchResult: any, topic: string): string[] {
    const text = `${searchResult.title} ${searchResult.snippet}`.toLowerCase();
    const prerequisites: string[] = [];
    
    // Common prerequisite patterns
    if (text.includes('advanced') || text.includes('expert')) {
      prerequisites.push('Basic understanding of ' + topic);
    }
    if (text.includes('api') && !text.includes('basic')) {
      prerequisites.push('HTTP and REST concepts');
    }
    if (text.includes('framework') || text.includes('library')) {
      prerequisites.push('Core language knowledge');
    }
    
    return prerequisites;
  }

  private suggestNextSteps(searchResult: any, topic: string): string[] {
    const nextSteps: string[] = [];
    const text = `${searchResult.title} ${searchResult.snippet}`.toLowerCase();
    
    if (text.includes('tutorial') || text.includes('guide')) {
      nextSteps.push('Practice with hands-on exercises');
      nextSteps.push('Build a small project');
    }
    if (text.includes('documentation')) {
      nextSteps.push('Try implementing examples');
      nextSteps.push('Explore related features');
    }
    if (text.includes('concept') || text.includes('theory')) {
      nextSteps.push('Find practical applications');
      nextSteps.push('Look for real-world examples');
    }
    
    return nextSteps;
  }

  private updateLearningPath(topic: string, node: KnowledgeNode): void {
    if (!this.learningPaths.has(topic)) {
      this.learningPaths.set(topic, {
        id: topic,
        topic: topic,
        nodes: [],
        progress: 0,
        totalTimeSpent: 0,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }
    
    const path = this.learningPaths.get(topic)!;
    path.nodes.push(node);
    path.totalTimeSpent += node.timeSpent;
    path.progress = Math.min((path.nodes.length * 10), 100); // 10% per node
    path.lastUpdated = new Date().toISOString();
  }

  private generateInsights(node: KnowledgeNode): void {
    // Check for learning gaps
    if (node.prerequisites.length > 0) {
      this.insights.push({
        type: 'prerequisite',
        message: `You're exploring ${node.topic}, but you might need to understand: ${node.prerequisites.join(', ')}`,
        action: 'Review prerequisites',
        priority: 'medium'
      });
    }
    
    // Check for next learning opportunities
    if (node.nextSteps.length > 0) {
      this.insights.push({
        type: 'next_topic',
        message: `Great! You've explored ${node.title}. Next: ${node.nextSteps[0]}`,
        action: 'Continue learning',
        priority: 'high'
      });
    }
    
    // Check for mastery achievements
    if (node.understanding === 'mastered') {
      this.insights.push({
        type: 'achievement',
        message: `🎉 You've mastered ${node.title}! Consider exploring related topics.`,
        action: 'Explore related topics',
        priority: 'high'
      });
    }
  }

  private calculateMasteryLevel(nodes: KnowledgeNode[]): number {
    const mastered = nodes.filter(node => node.understanding === 'mastered').length;
    return nodes.length > 0 ? (mastered / nodes.length) * 100 : 0;
  }

  private calculateLearningStreak(nodes: KnowledgeNode[]): number {
    const sortedNodes = nodes.sort((a, b) => 
      new Date(a.clickedAt).getTime() - new Date(b.clickedAt).getTime()
    );
    
    let streak = 0;
    let currentDate = new Date();
    
    for (const node of sortedNodes.reverse()) {
      const nodeDate = new Date(node.clickedAt);
      const daysDiff = Math.floor((currentDate.getTime() - nodeDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 1) {
        streak++;
        currentDate = nodeDate;
      } else {
        break;
      }
    }
    
    return streak;
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('knowledge_nodes', JSON.stringify(Array.from(this.knowledgeNodes.entries())));
      localStorage.setItem('learning_paths', JSON.stringify(Array.from(this.learningPaths.entries())));
      localStorage.setItem('knowledge_insights', JSON.stringify(this.insights));
    } catch (error) {
      console.error('Failed to save knowledge data:', error);
    }
  }

  // Load from storage
  loadFromStorage(): void {
    try {
      const storedNodes = localStorage.getItem('knowledge_nodes');
      if (storedNodes) {
        this.knowledgeNodes = new Map(JSON.parse(storedNodes));
        console.log('Loaded knowledge nodes:', this.knowledgeNodes.size);
      }
      
      const storedPaths = localStorage.getItem('learning_paths');
      if (storedPaths) {
        this.learningPaths = new Map(JSON.parse(storedPaths));
        console.log('Loaded learning paths:', this.learningPaths.size);
      }
      
      const storedInsights = localStorage.getItem('knowledge_insights');
      if (storedInsights) {
        this.insights = JSON.parse(storedInsights);
      }
    } catch (error) {
      console.error('Failed to load knowledge data:', error);
    }
  }
}

// Export singleton instance
export const knowledgeTracker = new KnowledgeTracker();

// Initialize on load
if (typeof window !== 'undefined') {
  knowledgeTracker.loadFromStorage();
}
