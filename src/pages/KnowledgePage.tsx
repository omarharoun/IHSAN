import React, { useState, useEffect } from 'react';
import { search, SearchResponse } from '../lib/search-client';
import { LearningDashboard } from '../components/Knowledge/LearningDashboard';

export const KnowledgePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('General');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setCurrentTopic(searchQuery);
    
    try {
      const results = await search(searchQuery, { limit: 10 });
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedTopics = [
    'JavaScript',
    'React',
    'Python',
    'Machine Learning',
    'Web Development',
    'Data Science',
    'Node.js',
    'CSS',
    'HTML',
    'API Development'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🧠 Knowledge Accumulation System
            </h1>
            <p className="text-lg text-gray-600">
              Transform every search into a learning journey. Click, learn, and build your knowledge map.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex space-x-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for any topic to start learning..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !searchQuery.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Learning...</span>
                  </>
                ) : (
                  <>
                    <span>🔍</span>
                    <span>Search & Learn</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Suggested Topics */}
          <div className="mt-6">
            <p className="text-sm text-gray-600 text-center mb-3">Try these topics:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestedTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => {
                    setSearchQuery(topic);
                    setCurrentTopic(topic);
                  }}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {searchResults ? (
        <LearningDashboard 
          searchResults={searchResults.results} 
          currentTopic={currentTopic}
        />
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="mb-8">
              <span className="text-6xl mb-4 block">🧠</span>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Start Your Learning Journey
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Search for any topic above and watch as each click builds your personal knowledge map. 
                Track your progress, discover learning gaps, and get personalized insights.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-3xl mb-3">🔍</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Search & Discover</h3>
                <p className="text-gray-600">
                  Search for any topic and get comprehensive results from multiple sources.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-3xl mb-3">📚</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Click & Learn</h3>
                <p className="text-gray-600">
                  Every click is tracked to build your personal knowledge graph and learning path.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Track & Improve</h3>
                <p className="text-gray-600">
                  Get insights, recommendations, and see your learning progress over time.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
