import React, { useState } from 'react';
import { SearchResult } from '../../lib/search-client';
import { knowledgeTracker, KnowledgeNode } from '../../lib/knowledge-tracker';

interface KnowledgeSearchResultProps {
  result: SearchResult;
  topic: string;
  onKnowledgeTracked?: (node: KnowledgeNode) => void;
}

export const KnowledgeSearchResult: React.FC<KnowledgeSearchResultProps> = ({
  result,
  topic,
  onKnowledgeTracked
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = async () => {
    setIsTracking(true);
    
    // Track the knowledge click
    const knowledgeNode = knowledgeTracker.trackKnowledgeClick(result, topic);
    
    // Simulate time tracking (in real app, this would be more sophisticated)
    const startTime = Date.now();
    
    // Open the link
    window.open(result.url, '_blank');
    
    // Track time spent (simplified - in real app, use page visibility API)
    setTimeout(() => {
      const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);
      knowledgeTracker.updateTimeSpent(knowledgeNode.id, timeSpentSeconds);
      setTimeSpent(timeSpentSeconds);
      onKnowledgeTracked?.(knowledgeNode);
      setIsTracking(false);
    }, 2000); // Simulate 2 seconds of reading time
  };

  const getDifficultyColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDomainIcon = (domain: string) => {
    if (domain.includes('wikipedia.org')) return '📚';
    if (domain.includes('github.com')) return '💻';
    if (domain.includes('stackoverflow.com')) return '❓';
    if (domain.includes('youtube.com')) return '🎥';
    if (domain.includes('medium.com')) return '📝';
    if (domain.includes('dev.to')) return '👨‍💻';
    return '🔗';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{getDomainIcon(result.domain)}</span>
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {result.title}
            </h3>
            <span className={`text-sm font-medium ${getDifficultyColor(result.score)}`}>
              {Math.round(result.score * 100)}%
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-3">
            {result.snippet}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center space-x-1">
              <span>🌐</span>
              <span>{result.domain}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>⏱️</span>
              <span>{new Date(result.timestamp).toLocaleDateString()}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Knowledge Tracking Button */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={handleClick}
          disabled={isTracking}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
            isTracking
              ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
          }`}
        >
          {isTracking ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Learning...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>🧠</span>
              <span>Click to Learn & Track Knowledge</span>
            </div>
          )}
        </button>
        
        {timeSpent > 0 && (
          <div className="mt-2 text-center text-sm text-green-600">
            ✅ Knowledge tracked! ({timeSpent}s spent)
          </div>
        )}
      </div>

      {/* Expandable Details */}
      <div className="mt-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
        >
          <span>{isExpanded ? '▼' : '▶'}</span>
          <span>{isExpanded ? 'Hide' : 'Show'} Learning Details</span>
        </button>
        
        {isExpanded && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Topic:</span>
                <span className="ml-2 text-gray-600">{topic}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Relevance Score:</span>
                <span className={`ml-2 font-medium ${getDifficultyColor(result.score)}`}>
                  {Math.round(result.score * 100)}%
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Domain:</span>
                <span className="ml-2 text-gray-600">{result.domain}</span>
              </div>
              {result.metadata?.language && (
                <div>
                  <span className="font-medium text-gray-700">Language:</span>
                  <span className="ml-2 text-gray-600">{result.metadata.language}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
