import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  timeSpent: number;
  understanding: 'explored' | 'learning' | 'mastered';
  relatedTopics: string[];
  prerequisites: string[];
  nextSteps: string[];
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
  connections?: string[];
}

interface KnowledgeContextType {
  nodes: KnowledgeNode[];
  addNode: (searchResult: any, topic: string) => void;
  updateNode: (nodeId: string, updates: Partial<KnowledgeNode>) => void;
  deleteNode: (nodeId: string) => void;
  getStats: () => {
    totalNodes: number;
    totalTimeSpent: number;
    topicsExplored: number;
    masteryLevel: number;
    learningStreak: number;
  };
}

const KnowledgeContext = createContext<KnowledgeContextType | undefined>(undefined);

export const useKnowledge = () => {
  const context = useContext(KnowledgeContext);
  if (!context) {
    throw new Error('useKnowledge must be used within a KnowledgeProvider');
  }
  return context;
};

interface KnowledgeProviderProps {
  children: ReactNode;
}

export const KnowledgeProvider: React.FC<KnowledgeProviderProps> = ({ children }) => {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('knowledge_nodes');
    if (stored) {
      try {
        const parsedNodes = JSON.parse(stored);
        console.log('Loaded knowledge nodes from storage:', parsedNodes.length);
        setNodes(parsedNodes);
      } catch (error) {
        console.error('Failed to load knowledge nodes:', error);
      }
    }
  }, []);

  // Save to localStorage whenever nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      localStorage.setItem('knowledge_nodes', JSON.stringify(nodes));
      console.log('Saved knowledge nodes to storage:', nodes.length);
    }
  }, [nodes]);

  const generateNodeId = (url: string, topic: string): string => {
    return `${topic}-${btoa(url).slice(0, 10)}`;
  };

  const assessDifficulty = (searchResult: any): 'beginner' | 'intermediate' | 'advanced' => {
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
    
    if (domain.includes('github.com') || domain.includes('stackoverflow.com')) {
      return 'intermediate';
    }
    if (domain.includes('w3schools.com') || domain.includes('tutorialspoint.com')) {
      return 'beginner';
    }
    
    return 'intermediate';
  };

  const categorizeContent = (searchResult: any): string => {
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
  };

  const extractRelatedTopics = (searchResult: any): string[] => {
    const text = `${searchResult.title} ${searchResult.snippet}`.toLowerCase();
    const commonTopics = [
      'javascript', 'python', 'react', 'nodejs', 'css', 'html', 'api', 'database',
      'machine learning', 'ai', 'web development', 'mobile development', 'design',
      'security', 'testing', 'deployment', 'cloud', 'docker', 'kubernetes'
    ];
    
    return commonTopics.filter(topic => text.includes(topic));
  };

  const identifyPrerequisites = (searchResult: any, topic: string): string[] => {
    const text = `${searchResult.title} ${searchResult.snippet}`.toLowerCase();
    const prerequisites: string[] = [];
    
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
  };

  const suggestNextSteps = (searchResult: any, topic: string): string[] => {
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
  };

  const addNode = (searchResult: any, topic: string) => {
    const nodeId = generateNodeId(searchResult.url, topic);
    console.log('Adding knowledge node:', { nodeId, topic, title: searchResult.title });
    
    // Check if already exists
    const existingIndex = nodes.findIndex(node => node.id === nodeId);
    if (existingIndex !== -1) {
      console.log('Node already exists, updating...');
      const updatedNodes = [...nodes];
      updatedNodes[existingIndex] = {
        ...updatedNodes[existingIndex],
        clickedAt: new Date().toISOString(),
        timeSpent: updatedNodes[existingIndex].timeSpent + 30
      };
      setNodes(updatedNodes);
      return;
    }

    // Create new node
    const newNode: KnowledgeNode = {
      id: nodeId,
      title: searchResult.title,
      url: searchResult.url,
      domain: searchResult.domain,
      snippet: searchResult.snippet,
      topic: topic,
      difficulty: assessDifficulty(searchResult),
      category: categorizeContent(searchResult),
      clickedAt: new Date().toISOString(),
      timeSpent: 30,
      understanding: 'explored',
      relatedTopics: extractRelatedTopics(searchResult),
      prerequisites: identifyPrerequisites(searchResult, topic),
      nextSteps: suggestNextSteps(searchResult, topic),
      x: 400 + (Math.random() - 0.5) * 200, // Center area
      y: 100 + Math.random() * 100, // Top area
      vx: 0,
      vy: 0,
      connections: []
    };

    console.log('Created new node:', newNode.title);
    setNodes(prev => {
      const newNodes = [...prev, newNode];
      console.log('Total nodes now:', newNodes.length);
      return newNodes;
    });
  };

  const updateNode = (nodeId: string, updates: Partial<KnowledgeNode>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  };

  const deleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
  };

  const getStats = () => {
    const totalNodes = nodes.length;
    const totalTimeSpent = nodes.reduce((sum, node) => sum + node.timeSpent, 0);
    const topicsExplored = new Set(nodes.map(node => node.topic)).size;
    const mastered = nodes.filter(node => node.understanding === 'mastered').length;
    const masteryLevel = totalNodes > 0 ? (mastered / totalNodes) * 100 : 0;
    
    // Simple learning streak calculation
    const sortedNodes = nodes.sort((a, b) => 
      new Date(a.clickedAt).getTime() - new Date(b.clickedAt).getTime()
    );
    
    let learningStreak = 0;
    let currentDate = new Date();
    
    for (const node of sortedNodes.reverse()) {
      const nodeDate = new Date(node.clickedAt);
      const daysDiff = Math.floor((currentDate.getTime() - nodeDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 1) {
        learningStreak++;
        currentDate = nodeDate;
      } else {
        break;
      }
    }

    return {
      totalNodes,
      totalTimeSpent,
      topicsExplored,
      masteryLevel,
      learningStreak
    };
  };

  const value: KnowledgeContextType = {
    nodes,
    addNode,
    updateNode,
    deleteNode,
    getStats
  };

  return (
    <KnowledgeContext.Provider value={value}>
      {children}
    </KnowledgeContext.Provider>
  );
};
