const https = require('https');
const http = require('http');
const { URL } = require('url');

// Browser-like user agent
const USER_AGENT = 'Mozilla/5.0 (compatible; VercelBrowser/1.0; +https://vercel.com)';

/**
 * Enhanced fetch function with IPv4 preference
 */
function fetchWithIPv4(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        ...options.headers
      },
      family: 4, // Force IPv4
      timeout: 10000
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          url: url
        });
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Connection failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Test website connectivity
 */
async function testConnectivity(url) {
  try {
    const response = await fetchWithIPv4(url);
    return {
      success: true,
      status: response.status,
      url: response.url,
      dataLength: response.data.length,
      message: `Successfully connected to ${url} (Status: ${response.status})`
    };
  } catch (error) {
    return {
      success: false,
      url: url,
      error: error.message,
      message: `Failed to connect to ${url}: ${error.message}`
    };
  }
}

/**
 * Get website content
 */
async function browseWebsite(url) {
  try {
    const response = await fetchWithIPv4(url);
    
    // Extract title from HTML
    const titleMatch = response.data.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'No title found';
    
    return {
      success: true,
      url: response.url,
      status: response.status,
      title: title,
      content: response.data,
      headers: response.headers
    };
  } catch (error) {
    return {
      success: false,
      url: url,
      error: error.message
    };
  }
}

/**
 * Vercel API handler
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { action, url } = req.query;
    
    switch (action) {
      case 'test':
        const testResult = await testConnectivity(url || 'https://www.google.com');
        res.status(200).json(testResult);
        break;
        
      case 'browse':
        if (!url) {
          res.status(400).json({ error: 'URL parameter required for browse action' });
          return;
        }
        const browseResult = await browseWebsite(url);
        res.status(200).json(browseResult);
        break;
        
      case 'health':
        const healthTests = await Promise.all([
          testConnectivity('https://www.google.com'),
          testConnectivity('https://www.github.com')
        ]);
        
        res.status(200).json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          tests: healthTests,
          environment: {
            nodeVersion: process.version,
            platform: process.platform
          }
        });
        break;
        
      default:
        res.status(400).json({ 
          error: 'Invalid action. Use: test, browse, or health',
          usage: {
            test: '/api/browser-clean?action=test&url=https://example.com',
            browse: '/api/browser-clean?action=browse&url=https://example.com', 
            health: '/api/browser-clean?action=health'
          }
        });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}