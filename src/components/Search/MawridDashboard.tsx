import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from './Message';
import { Sources } from './Sources';
import { EmbeddedBrowser } from './EmbeddedBrowser';
import { TextContentViewer } from './TextContentViewer';
import { search, type SearchResponse } from '../../lib/search-client';
import { knowledgeTracker, KnowledgeNode } from '../../lib/knowledge-tracker';
import { KnowledgeGraph } from '../Knowledge/KnowledgeGraph';
import { Search, Clock, Bookmark, ExternalLink, Brain, TrendingUp, Target, Network } from 'lucide-react';

type ChatItem = { id: string; role: 'user' | 'assistant'; content: string };

export function MawridDashboard() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chat, setChat] = useState<ChatItem[]>([]);
    const [result, setResult] = useState<SearchResponse | null>(null);
    const [browserUrl, setBrowserUrl] = useState<string | null>(null);
    const [textViewerUrl, setTextViewerUrl] = useState<string | null>(null);
    const [clickedLinks, setClickedLinks] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [knowledgeStats, setKnowledgeStats] = useState(knowledgeTracker.getKnowledgeStats());
    const [trackedNodes, setTrackedNodes] = useState<KnowledgeNode[]>([]);
    const [showKnowledgePanel, setShowKnowledgePanel] = useState(false);
    const [knowledgeViewMode, setKnowledgeViewMode] = useState<'list' | 'graph'>('graph');
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Load suggestions when query changes
    useEffect(() => {
        if (query.length > 2) {
            const timeoutId = setTimeout(() => {
                // This would call the suggestions API
                setSuggestions([]);
                setShowSuggestions(true);
            }, 300);
            return () => clearTimeout(timeoutId);
        } else {
            setShowSuggestions(false);
            setSuggestions([]);
        }
    }, [query]);

    // Subscribe to knowledge changes
    useEffect(() => {
        const unsubscribe = knowledgeTracker.subscribe(() => {
            setKnowledgeStats(knowledgeTracker.getKnowledgeStats());
            // Refresh tracked nodes from all knowledge nodes
            const allNodes = knowledgeTracker.getAllKnowledgeNodes();
            setTrackedNodes(allNodes.slice(-10)); // Show last 10 nodes
        });
        
        return unsubscribe;
    }, []);

    async function handleSubmit(q?: string) {
        const text = (q ?? query).trim();
        if (!text) return;
        setIsLoading(true);
        setChat((c) => [...c, { id: crypto.randomUUID(), role: 'user', content: text }]);
        setQuery('');
        setShowSuggestions(false);
        try {
            const res = await search(text);
            setResult(res);
            setChat((c) => [
                ...c,
                { id: crypto.randomUUID(), role: 'assistant', content: res.ai_summary || 'No summary available.' },
            ]);
        } catch (e) {
            setChat((c) => [...c, { id: crypto.randomUUID(), role: 'assistant', content: 'Something went wrong.' }]);
        } finally {
            setIsLoading(false);
        }
    }

    // Handle keyboard navigation
    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    }

    // Browser functions
    function handleLinkClick(url: string) {
        setBrowserUrl(url);
        setClickedLinks(prev => [...prev, url]);
        
        // Track knowledge if we have a result
        if (result) {
            const searchResult = result.results.find(r => r.url === url);
            if (searchResult) {
                knowledgeTracker.trackKnowledgeClick(searchResult, query);
                // The subscription will automatically update the UI
            }
        }
    }

    function handleCloseBrowser() {
        setBrowserUrl(null);
    }

    function handleTextClick(url: string) {
        setTextViewerUrl(url);
    }

    function handleCloseTextViewer() {
        setTextViewerUrl(null);
    }

    const sourceItems = useMemo(() => {
        if (!result) return [] as { title: string; url: string; domain: string; snippet?: string; favicon?: string; metadata?: any }[];
        return result.results.map((r) => ({ 
            title: r.title, 
            url: r.url, 
            domain: r.domain,
            snippet: r.snippet,
            favicon: r.favicon,
            metadata: r.metadata
        }));
    }, [result]);

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="border-b border-gray-800/50 bg-black/80 backdrop-blur-sm sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <div className="text-xl font-semibold text-white flex items-center space-x-2">
                                <Search className="w-6 h-6 text-blue-400" />
                                <span>Mawrid - المورد</span>
                            </div>
                            <div className="hidden sm:block text-sm text-gray-400">AI-powered search</div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button 
                                onClick={() => setShowKnowledgePanel(!showKnowledgePanel)}
                                className="text-sm text-gray-400 hover:text-white transition-colors flex items-center space-x-1"
                            >
                                <Brain className="w-4 h-4" />
                                <span>Knowledge</span>
                                {knowledgeStats.totalNodes > 0 && (
                                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full ml-1">
                                        {knowledgeStats.totalNodes}
                                    </span>
                                )}
                            </button>
                            <button className="text-sm text-gray-400 hover:text-white transition-colors flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>History</span>
                            </button>
                            <button className="text-sm text-gray-400 hover:text-white transition-colors flex items-center space-x-1">
                                <Bookmark className="w-4 h-4" />
                                <span>Bookmarks</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search Section */}
                <div className="mb-12">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                            Ask anything
                        </h1>
                        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                            Get instant answers with sources from across the web
                        </p>
                    </div>

                    {/* Search Input */}
                    <div className="relative max-w-4xl mx-auto">
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => query.length > 2 && setShowSuggestions(true)}
                                placeholder="Search the web..."
                                className="w-full h-14 pl-12 pr-16 text-lg bg-white/10 border border-gray-600 rounded-2xl outline-none focus:border-blue-500 focus:bg-white/15 transition-all duration-200 placeholder:text-gray-400 text-white backdrop-blur-sm"
                                autoComplete="off"
                                spellCheck="false"
                            />
                            <button
                                onClick={() => handleSubmit()}
                                disabled={isLoading || !query.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Search className="w-5 h-5" />
                                )}
                            </button>
                        </div>

                        {/* Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-lg z-50">
                                {suggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setQuery(suggestion);
                                            handleSubmit(suggestion);
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors first:rounded-t-xl last:rounded-b-xl"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Search className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-300">{suggestion}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Section */}
                {chat.length > 0 && (
                    <section className="space-y-8">
                        {chat.map((m, index) => (
                            <div key={m.id} className="animate-fade-in">
                                <Message 
                                    role={m.role} 
                                    content={
                                        m.role === 'assistant' ? (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                                        ) : (
                                            m.content
                                        )
                                    } 
                                />
                            </div>
                        ))}

                        {isLoading && (
                            <div className="animate-fade-in">
                                <div className="max-w-3xl mr-auto rounded-2xl px-6 py-4 border border-gray-700 bg-gray-900/50">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                                        <span className="text-gray-400 ml-2">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {result && (
                            <div className="animate-fade-in space-y-6">
                                {/* Direct Answer (Featured Snippet) */}
                                {result.answer && (
                                    <div className="max-w-4xl mr-auto">
                                        <div className="bg-blue-900/20 border border-blue-700/50 rounded-2xl p-6">
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                                    <Search className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-blue-300 mb-2">Quick Answer</h3>
                                                    <div className="prose prose-invert max-w-none">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.answer}</ReactMarkdown>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Images */}
                                {result.images && result.images.length > 0 && (
                                    <div className="max-w-4xl mr-auto">
                                        <div className="flex items-center space-x-2 mb-4">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <h3 className="text-lg font-semibold text-gray-200">Images</h3>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            {result.images.slice(0, 8).map((img, idx) => (
                                                <a
                                                    key={idx}
                                                    href={img.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="group block rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-lg"
                                                >
                                                    <div className="aspect-square bg-gray-800 relative overflow-hidden">
                                                        <img
                                                            src={img.url}
                                                            alt={img.title || 'Search result image'}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                            }}
                                                        />
                                                        <div className="hidden absolute inset-0 bg-gray-700 flex items-center justify-center">
                                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    {img.title && (
                                                        <div className="p-2">
                                                            <p className="text-xs text-gray-300 line-clamp-2">{img.title}</p>
                                                        </div>
                                                    )}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="max-w-4xl mr-auto">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <h3 className="text-lg font-semibold text-gray-200">Sources</h3>
                                        <div className="flex items-center space-x-1 text-sm text-blue-400">
                                            <Brain className="w-4 h-4" />
                                            <span>Click to track knowledge</span>
                                        </div>
                                    </div>
                                    <Sources items={sourceItems} onLinkClick={handleLinkClick} />
                                </div>
                                <div className="max-w-3xl mr-auto text-sm text-gray-500 flex items-center space-x-4">
                                    <span>{result.total_results} results</span>
                                    <span>•</span>
                                    <span>{result.processing_time.toFixed(2)}s</span>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* Clicked Links History */}
                {clickedLinks.length > 0 && (
                    <section className="mt-8">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex items-center space-x-2 mb-4">
                                <Clock className="w-5 h-5 text-gray-400" />
                                <h3 className="text-lg font-semibold text-gray-200">Recently Visited Links</h3>
                                <span className="text-sm text-gray-400">({clickedLinks.length})</span>
                            </div>
                            <div className="space-y-2">
                                {clickedLinks.slice(-10).reverse().map((link, index) => (
                                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-900/30 rounded-lg border border-gray-700">
                                        <div className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full"></div>
                                        <div className="flex-1 min-w-0">
                                            <button
                                                onClick={() => handleLinkClick(link)}
                                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors truncate"
                                            >
                                                {link}
                                            </button>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleTextClick(link)}
                                                className="p-1 text-gray-400 hover:text-white transition-colors"
                                                title="View as text"
                                            >
                                                <Bookmark className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => window.open(link, '_blank')}
                                                className="p-1 text-gray-400 hover:text-white transition-colors"
                                                title="Open in new tab"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {/* Knowledge Panel */}
            {showKnowledgePanel && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Brain className="w-6 h-6 text-blue-400" />
                                    <h2 className="text-xl font-semibold text-white">Your Knowledge Journey</h2>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setKnowledgeViewMode('graph')}
                                            className={`p-2 rounded-lg transition-colors ${
                                                knowledgeViewMode === 'graph' 
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                            }`}
                                        >
                                            <Network className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setKnowledgeViewMode('list')}
                                            className={`p-2 rounded-lg transition-colors ${
                                                knowledgeViewMode === 'list' 
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                            }`}
                                        >
                                            <TrendingUp className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setShowKnowledgePanel(false)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {knowledgeViewMode === 'graph' ? (
                            <div className="h-[60vh]">
                                <KnowledgeGraph />
                            </div>
                        ) : (
                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                {/* Knowledge Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700/50">
                                        <div className="text-2xl font-bold text-blue-400">{knowledgeStats.totalNodes}</div>
                                        <div className="text-sm text-gray-400">Knowledge Nodes</div>
                                    </div>
                                    <div className="bg-green-900/20 p-4 rounded-lg border border-green-700/50">
                                        <div className="text-2xl font-bold text-green-400">{Math.floor(knowledgeStats.totalTimeSpent / 60)}m</div>
                                        <div className="text-sm text-gray-400">Time Invested</div>
                                    </div>
                                    <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-700/50">
                                        <div className="text-2xl font-bold text-purple-400">{knowledgeStats.topicsExplored}</div>
                                        <div className="text-sm text-gray-400">Topics Explored</div>
                                    </div>
                                    <div className="bg-orange-900/20 p-4 rounded-lg border border-orange-700/50">
                                        <div className="text-2xl font-bold text-orange-400">{Math.round(knowledgeStats.masteryLevel)}%</div>
                                        <div className="text-sm text-gray-400">Mastery Level</div>
                                    </div>
                                </div>

                                {/* Recent Knowledge Nodes */}
                                {trackedNodes.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                                            <TrendingUp className="w-5 h-5" />
                                            <span>Recently Learned</span>
                                        </h3>
                                        <div className="space-y-3">
                                            {trackedNodes.slice(-5).reverse().map((node, index) => (
                                                <div key={node.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="font-medium text-white text-sm">{node.title}</h4>
                                                        <div className="flex items-center space-x-2">
                                                            <span className={`px-2 py-1 rounded text-xs ${
                                                                node.difficulty === 'beginner' ? 'bg-green-900/50 text-green-400' :
                                                                node.difficulty === 'intermediate' ? 'bg-yellow-900/50 text-yellow-400' :
                                                                'bg-red-900/50 text-red-400'
                                                            }`}>
                                                                {node.difficulty}
                                                            </span>
                                                            <span className={`px-2 py-1 rounded text-xs ${
                                                                node.understanding === 'explored' ? 'bg-blue-900/50 text-blue-400' :
                                                                node.understanding === 'learning' ? 'bg-purple-900/50 text-purple-400' :
                                                                'bg-green-900/50 text-green-400'
                                                            }`}>
                                                                {node.understanding}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-400 text-sm mb-2">{node.snippet}</p>
                                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                                        <span>{node.domain}</span>
                                                        <span>{Math.floor(node.timeSpent / 60)}m spent</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Learning Insights */}
                                {knowledgeTracker.getInsights().length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                                            <Target className="w-5 h-5" />
                                            <span>Learning Insights</span>
                                        </h3>
                                        <div className="space-y-3">
                                            {knowledgeTracker.getInsights().slice(0, 3).map((insight, index) => (
                                                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                                                    insight.priority === 'high' ? 'border-red-500 bg-red-900/20' :
                                                    insight.priority === 'medium' ? 'border-yellow-500 bg-yellow-900/20' :
                                                    'border-green-500 bg-green-900/20'
                                                }`}>
                                                    <p className="text-sm text-gray-300">{insight.message}</p>
                                                    {insight.action && (
                                                        <button className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline">
                                                            {insight.action}
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {trackedNodes.length === 0 && (
                                    <div className="text-center py-8 text-gray-400">
                                        <Brain className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                                        <p>Start clicking on search results to build your knowledge map!</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Embedded Browser */}
            {browserUrl && (
                <EmbeddedBrowser
                    url={browserUrl}
                    onClose={handleCloseBrowser}
                    onLinkClick={handleLinkClick}
                />
            )}

            {/* Text Content Viewer */}
            {textViewerUrl && (
                <TextContentViewer
                    url={textViewerUrl}
                    onClose={handleCloseTextViewer}
                />
            )}
        </div>
    );
}
