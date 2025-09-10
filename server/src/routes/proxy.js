import express from 'express';
import axios from 'axios';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Proxy endpoint for fetching web content
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).json({ error: 'URL parameter is required' });
        }

        // Validate URL
        let targetUrl;
        try {
            targetUrl = new URL(url);
        } catch (error) {
            return res.status(400).json({ error: 'Invalid URL provided' });
        }

        // Only allow HTTP and HTTPS protocols
        if (!['http:', 'https:'].includes(targetUrl.protocol)) {
            return res.status(400).json({ error: 'Only HTTP and HTTPS URLs are allowed' });
        }

        // Fetch the content
        const response = await axios.get(targetUrl.toString(), {
            timeout: 10000, // 10 second timeout
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            },
            maxRedirects: 5,
            validateStatus: (status) => status < 400
        });

        // Set appropriate headers
        res.set({
            'Content-Type': response.headers['content-type'] || 'text/html',
            'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
            'X-Original-URL': url,
            'X-Proxy-Status': 'success'
        });

        res.send(response.data);
    } catch (error) {
        console.error('Proxy error:', error);
        
        if (error.code === 'ENOTFOUND') {
            return res.status(404).json({ error: 'URL not found' });
        } else if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({ error: 'Connection refused' });
        } else if (error.code === 'ETIMEDOUT') {
            return res.status(504).json({ error: 'Request timeout' });
        } else if (error.response) {
            return res.status(error.response.status).json({ 
                error: `HTTP ${error.response.status}: ${error.response.statusText}` 
            });
        } else {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
});

export default router;
