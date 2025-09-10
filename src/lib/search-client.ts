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
    const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, ...options }),
    });
    if (!response.ok) throw new Error('Search failed');
    return (await response.json()) as SearchResponse;
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
