import express from 'express';
import { tavily } from '@tavily/core';
import OpenAI from 'openai';
import { supabase } from '../services/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Initialize clients
function createTavilyClient() {
    return tavily({ apiKey: process.env.TAVILY_API_KEY });
}

function createOpenAIClient() {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Search endpoint
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { query, limit = 5, offset = 0 } = req.body;
        const userId = req.user.id;
        
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ detail: 'Query is required' });
        }

        if (!process.env.TAVILY_API_KEY) {
            return res.status(500).json({ detail: 'Tavily API key not configured' });
        }

        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ detail: 'OpenAI API key not configured' });
        }

        const startTime = Date.now();

        // Search with Tavily
        const tavilyClient = createTavilyClient();
        const searchResponse = await tavilyClient.search(query, {
            searchDepth: 'advanced',
            maxResults: Math.min(limit * 2, 20),
            includeAnswer: true,
            includeImages: true,
            includeDomains: [],
            excludeDomains: []
        });

        // Process results
        const results = searchResponse.results.map((result, index) => {
            const url = new URL(result.url);
            const domain = url.hostname;
            
            // Create better snippets
            let snippet = result.content;
            if (snippet.length > 300) {
                const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
                let bestMatch = 0;
                let bestIndex = 0;
                
                for (let i = 0; i < snippet.length - 100; i += 50) {
                    const chunk = snippet.substring(i, i + 200).toLowerCase();
                    const matches = queryWords.reduce((count, word) => 
                        count + (chunk.includes(word) ? 1 : 0), 0
                    );
                    if (matches > bestMatch) {
                        bestMatch = matches;
                        bestIndex = i;
                    }
                }
                
                snippet = snippet.substring(Math.max(0, bestIndex - 50), bestIndex + 200);
                if (bestIndex > 0) snippet = '...' + snippet;
                if (bestIndex + 200 < result.content.length) snippet = snippet + '...';
            } else {
                snippet = snippet.substring(0, 300);
            }

            return {
                title: result.title,
                url: result.url,
                snippet: snippet,
                content: result.content,
                score: 1 - (index * 0.05),
                timestamp: new Date().toISOString(),
                domain: domain,
                favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
                metadata: {
                    published_date: result.publishedDate || null,
                    language: 'en',
                    type: 'webpage'
                }
            };
        });

        // Generate AI summary
        let aiSummary = '';
        try {
            const summaryPrompt = `Based on the following search results for the query "${query}", provide a comprehensive and accurate summary in markdown format. Focus on the most relevant and important information.

Search Results:
${results.map(r => `**${r.title}**\n${r.content}\nSource: ${r.url}\n`).join('\n---\n')}

Please provide a well-structured summary that answers the user's query:`;

            const openai = createOpenAIClient();
            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful AI assistant that provides accurate, well-structured summaries based on search results. Always cite sources and provide factual information.'
                    },
                    {
                        role: 'user',
                        content: summaryPrompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.3,
            });

            aiSummary = completion.choices[0]?.message?.content || 'Unable to generate summary.';
        } catch (error) {
            console.error('Error generating AI summary:', error);
            aiSummary = 'Based on the search results, I found relevant information but was unable to generate a summary at this time.';
        }

        const processingTime = (Date.now() - startTime) / 1000;

        // Save search to history
        try {
            await supabase
                .from('search_history')
                .insert({
                    user_id: userId,
                    query: query,
                    results_count: results.length,
                    processing_time: processingTime
                });
        } catch (error) {
            console.error('Error saving search history:', error);
        }

        const response = {
            query,
            results,
            total_results: results.length,
            processing_time: processingTime,
            ai_summary: aiSummary,
            answer: searchResponse.answer || null,
            suggestions: [],
            images: searchResponse.images || []
        };

        res.json(response);
    } catch (error) {
        console.error('Search API error:', error);
        res.status(500).json({ 
            detail: 'Search failed', 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
});

// Get search suggestions
router.get('/suggestions', authMiddleware, async (req, res) => {
    try {
        const { query, limit = 10 } = req.query;
        const userId = req.user.id;
        
        if (!query || query.length < 1) {
            return res.json({ suggestions: [] });
        }

        // Get suggestions from database
        const { data: suggestions, error } = await supabase
            .rpc('get_search_suggestions', {
                user_uuid: userId,
                query_text: query,
                limit_count: parseInt(limit)
            });

        if (error) {
            console.error('Error getting suggestions:', error);
            return res.json({ suggestions: [] });
        }

        const suggestionList = suggestions?.map(s => s.suggestion) || [];
        res.json({ suggestions: suggestionList });
    } catch (error) {
        console.error('Suggestions API error:', error);
        res.json({ suggestions: [] });
    }
});

// Get search history
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 20, offset = 0 } = req.query;

        const { data: history, error } = await supabase
            .from('search_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        if (error) {
            console.error('Error getting search history:', error);
            return res.status(500).json({ detail: 'Failed to get search history' });
        }

        res.json({ history: history || [] });
    } catch (error) {
        console.error('Search history API error:', error);
        res.status(500).json({ detail: 'Failed to get search history' });
    }
});

// Save search bookmark
router.post('/bookmark', authMiddleware, async (req, res) => {
    try {
        const { title, url, snippet, domain, favicon_url, query } = req.body;
        const userId = req.user.id;

        if (!title || !url || !query) {
            return res.status(400).json({ detail: 'Title, URL, and query are required' });
        }

        const { data: bookmark, error } = await supabase
            .from('search_bookmarks')
            .insert({
                user_id: userId,
                title,
                url,
                snippet,
                domain,
                favicon_url,
                query
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving bookmark:', error);
            return res.status(500).json({ detail: 'Failed to save bookmark' });
        }

        res.json({ bookmark });
    } catch (error) {
        console.error('Bookmark API error:', error);
        res.status(500).json({ detail: 'Failed to save bookmark' });
    }
});

// Get search bookmarks
router.get('/bookmarks', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 20, offset = 0 } = req.query;

        const { data: bookmarks, error } = await supabase
            .from('search_bookmarks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        if (error) {
            console.error('Error getting bookmarks:', error);
            return res.status(500).json({ detail: 'Failed to get bookmarks' });
        }

        res.json({ bookmarks: bookmarks || [] });
    } catch (error) {
        console.error('Bookmarks API error:', error);
        res.status(500).json({ detail: 'Failed to get bookmarks' });
    }
});

// Delete search bookmark
router.delete('/bookmark/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { error } = await supabase
            .from('search_bookmarks')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            console.error('Error deleting bookmark:', error);
            return res.status(500).json({ detail: 'Failed to delete bookmark' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Delete bookmark API error:', error);
        res.status(500).json({ detail: 'Failed to delete bookmark' });
    }
});

export default router;
