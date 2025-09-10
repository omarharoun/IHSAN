export type SearchResult = {
    title: string;
    url: string;
    snippet: string;
    content?: string;
    score: number;
    timestamp: string;
    domain: string;
    favicon?: string;
    metadata?: {
        published_date?: string;
        language?: string;
        type?: string;
    };
};

export type SearchResponse = {
    query: string;
    results: SearchResult[];
    total_results: number;
    processing_time: number;
    ai_summary?: string;
    answer?: string;
    suggestions?: string[];
    images?: Array<{
        url: string;
        title?: string;
        source?: string;
    }>;
};

export async function search(query: string, options?: { limit?: number; offset?: number; filters?: Record<string, unknown> }) {
    // Try local API first
    try {
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, ...options }),
        });
        if (response.ok) {
            return (await response.json()) as SearchResponse;
        }
    } catch (error) {
        console.warn('Local API not available, trying external search');
    }
    
    // Fallback to external search (you can replace with any search API)
    try {
        // Using DuckDuckGo Instant Answer API as a free alternative
        const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
        const data = await response.json();
        
        const results: SearchResult[] = [];
        
        // Process DuckDuckGo results
        if (data.Abstract) {
            results.push({
                title: data.Heading || query,
                url: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
                snippet: data.Abstract,
                score: 0.9,
                timestamp: new Date().toISOString(),
                domain: new URL(data.AbstractURL || 'https://duckduckgo.com').hostname,
                favicon: `https://www.google.com/s2/favicons?domain=${new URL(data.AbstractURL || 'https://duckduckgo.com').hostname}&sz=32`
            });
        }
        
        // Add related topics
        if (data.RelatedTopics) {
            data.RelatedTopics.slice(0, options?.limit || 5).forEach((topic: any, index: number) => {
                if (topic.Text && topic.FirstURL) {
                    results.push({
                        title: topic.Text.split(' - ')[0] || topic.Text,
                        url: topic.FirstURL,
                        snippet: topic.Text,
                        score: 0.8 - (index * 0.1),
                        timestamp: new Date().toISOString(),
                        domain: new URL(topic.FirstURL).hostname,
                        favicon: `https://www.google.com/s2/favicons?domain=${new URL(topic.FirstURL).hostname}&sz=32`
                    });
                }
            });
        }
        
        return {
            query,
            results: results.slice(0, options?.limit || 5),
            total_results: results.length,
            processing_time: 0.5,
            ai_summary: data.Abstract || `Search results for "${query}"`,
            answer: data.Answer || null,
            suggestions: [],
            images: []
        } as SearchResponse;
        
    } catch (error) {
        console.error('External search failed:', error);
        throw new Error('Search failed - no API available');
    }
}

export async function getSuggestions(query: string, limit: number = 10): Promise<string[]> {
    const url = new URL('/api/search/suggestions', window.location.origin);
    url.searchParams.set('query', query);
    url.searchParams.set('limit', limit.toString());
    
    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            console.error('Suggestions API error:', response.status);
            return [];
        }
        
        const data = await response.json();
        return data.suggestions ?? [];
    } catch (error) {
        console.error('Suggestions fetch error:', error);
        return [];
    }
}

export async function getSearchHistory(limit: number = 20, offset: number = 0) {
    const response = await fetch(`/api/search/history?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to get search history');
    return (await response.json()) as { history: any[] };
}

export async function saveBookmark(bookmark: {
    title: string;
    url: string;
    snippet?: string;
    domain?: string;
    favicon_url?: string;
    query: string;
}) {
    const response = await fetch('/api/search/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookmark),
    });
    if (!response.ok) throw new Error('Failed to save bookmark');
    return (await response.json()) as { bookmark: any };
}

export async function getBookmarks(limit: number = 20, offset: number = 0) {
    const response = await fetch(`/api/search/bookmarks?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to get bookmarks');
    return (await response.json()) as { bookmarks: any[] };
}

export async function deleteBookmark(id: string) {
    const response = await fetch(`/api/search/bookmark/${id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to delete bookmark');
    return (await response.json()) as { success: boolean };
}
