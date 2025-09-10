import React, { useState, useEffect } from 'react';
import { knowledgeTracker, KnowledgeNode, LearningPath, KnowledgeInsight } from '../../lib/knowledge-tracker';
import { KnowledgeMap } from './KnowledgeMap';
import { KnowledgeSearchResult } from './KnowledgeSearchResult';

interface LearningDashboardProps {
  searchResults?: any[];
  currentTopic?: string;
}

export const LearningDashboard: React.FC<LearningDashboardProps> = ({
  searchResults = [],
  currentTopic = 'General'
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'knowledge' | 'insights'>('search');
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [insights, setInsights] = useState<KnowledgeInsight[]>([]);
  const [stats, setStats] = useState(knowledgeTracker.getKnowledgeStats());
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);

  useEffect(() => {
    loadKnowledgeData();
  }, []);

  const loadKnowledgeData = () => {
    setLearningPaths(knowledgeTracker.getAllLearningPaths());
    setInsights(knowledgeTracker.getInsights());
    setStats(knowledgeTracker.getKnowledgeStats());
  };

  const handleKnowledgeTracked = (node: KnowledgeNode) => {
    loadKnowledgeData();
    setSelectedNode(node);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prerequisite': return '📋';
      case 'next_topic': return '➡️';
      case 'gap': return '🔍';
      case 'achievement': return '🎉';
      default: return '💡';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Learning Dashboard</h1>
              <p className="text-gray-600">Transform search into knowledge accumulation</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Knowledge Nodes</div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalNodes}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Mastery Level</div>
                <div className="text-2xl font-bold text-green-600">{Math.round(stats.masteryLevel)}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'search', label: 'Search & Learn', icon: '🔍' },
              { id: 'knowledge', label: 'Knowledge Map', icon: '🧠' },
              { id: 'insights', label: 'Learning Insights', icon: '💡' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Search Results for "{currentTopic}"
              </h2>
              <p className="text-gray-600 mb-6">
                Click on any result to start building your knowledge. Each click will be tracked and help you understand your learning journey.
              </p>
              
              <div className="grid gap-4">
                {searchResults.map((result, index) => (
                  <KnowledgeSearchResult
                    key={index}
                    result={result}
                    topic={currentTopic}
                    onKnowledgeTracked={handleKnowledgeTracked}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeMap
            onNodeClick={setSelectedNode}
            onPathClick={(path) => console.log('Path clicked:', path)}
          />
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-2xl">📚</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{stats.totalNodes}</div>
                    <div className="text-sm text-gray-500">Knowledge Nodes</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-2xl">⏱️</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{Math.floor(stats.totalTimeSpent / 60)}m</div>
                    <div className="text-sm text-gray-500">Time Invested</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{Math.round(stats.masteryLevel)}%</div>
                    <div className="text-sm text-gray-500">Mastery Level</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Insights */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Learning Insights & Recommendations</h3>
                <p className="text-gray-600 mt-1">AI-powered insights to guide your learning journey</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {insights.length > 0 ? (
                    insights.map((insight, index) => (
                      <div
                        key={index}
                        className={`p-4 border-l-4 rounded-r-lg ${getPriorityColor(insight.priority)}`}
                      >
                        <div className="flex items-start">
                          <span className="text-2xl mr-3">{getInsightIcon(insight.type)}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{insight.message}</p>
                            {insight.action && (
                              <button className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline">
                                {insight.action}
                              </button>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            insight.priority === 'high' ? 'bg-red-100 text-red-800' :
                            insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {insight.priority}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <span className="text-4xl mb-4 block">🔍</span>
                      <p>Start exploring search results to generate learning insights!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
