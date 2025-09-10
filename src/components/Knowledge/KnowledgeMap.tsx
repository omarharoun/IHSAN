import React, { useState, useEffect } from 'react';
import { knowledgeTracker, KnowledgeNode, LearningPath, KnowledgeInsight } from '../../lib/knowledge-tracker';

interface KnowledgeMapProps {
  onNodeClick?: (node: KnowledgeNode) => void;
  onPathClick?: (path: LearningPath) => void;
}

export const KnowledgeMap: React.FC<KnowledgeMapProps> = ({ onNodeClick, onPathClick }) => {
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [insights, setInsights] = useState<KnowledgeInsight[]>([]);
  const [stats, setStats] = useState(knowledgeTracker.getKnowledgeStats());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  useEffect(() => {
    loadKnowledgeData();
  }, []);

  const loadKnowledgeData = () => {
    setLearningPaths(knowledgeTracker.getAllLearningPaths());
    setInsights(knowledgeTracker.getInsights());
    setStats(knowledgeTracker.getKnowledgeStats());
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUnderstandingColor = (understanding: string) => {
    switch (understanding) {
      case 'explored': return 'bg-blue-100 text-blue-800';
      case 'learning': return 'bg-purple-100 text-purple-800';
      case 'mastered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Knowledge Journey</h2>
        <p className="text-gray-600">Track your learning progress and discover new paths</p>
      </div>

      {/* Knowledge Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.totalNodes}</div>
          <div className="text-sm text-blue-800">Knowledge Nodes</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{Math.floor(stats.totalTimeSpent / 60)}m</div>
          <div className="text-sm text-green-800">Time Invested</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{stats.topicsExplored}</div>
          <div className="text-sm text-purple-800">Topics Explored</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{stats.learningStreak}</div>
          <div className="text-sm text-orange-800">Day Streak</div>
        </div>
      </div>

      {/* Learning Paths */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Paths</h3>
        <div className="space-y-3">
          {learningPaths.map((path) => (
            <div
              key={path.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                selectedPath === path.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => {
                setSelectedPath(selectedPath === path.id ? null : path.id);
                onPathClick?.(path);
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900">{path.topic}</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{path.nodes.length} nodes</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${path.progress}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500">{path.progress}%</span>
                </div>
              </div>
              
              {selectedPath === path.id && (
                <div className="mt-3 space-y-2">
                  {path.nodes.map((node) => (
                    <div
                      key={node.id}
                      className="p-3 bg-white rounded border cursor-pointer hover:bg-gray-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNodeClick?.(node);
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900 text-sm">{node.title}</h5>
                        <div className="flex space-x-1">
                          <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(node.difficulty)}`}>
                            {node.difficulty}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${getUnderstandingColor(node.understanding)}`}>
                            {node.understanding}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{node.snippet}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{node.domain}</span>
                        <span>{Math.floor(node.timeSpent / 60)}m spent</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Learning Insights */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Insights</h3>
        <div className="space-y-3">
          {insights.slice(0, 5).map((insight, index) => (
            <div
              key={index}
              className={`p-4 border-l-4 rounded-r-lg ${getPriorityColor(insight.priority)}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-900">{insight.message}</p>
                  {insight.action && (
                    <button className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline">
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
          ))}
        </div>
      </div>
    </div>
  );
};
