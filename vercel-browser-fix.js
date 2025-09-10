// Vercel-compatible browser connectivity solution
// This works in Vercel serverless functions

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Force IPv4 connections by disabling IPv6
process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';

// DNS configuration for better reliability
const DNS_SERVERS = [
  '8.8.8.8',
  '8.8.4.4', 
  '1.1.1.1'
];

// Browser-like user agent
const USER_AGENT = 'Mozilla/5.0 (compatible; VercelBrowser/1.0; +https://vercel.com)';

/**
 * Enhanced fetch function with IPv4 preference and better error handling
 */
async function fetchWithIPv4(url, options = {}) {
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
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        ...options.headers
      },
      // Force IPv4
      family: 4,
      // Timeout settings
      timeout: 10000,
      // DNS settings
      lookup: require('dns').lookup
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
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
    console.log(`Testing connectivity to: ${url}`);
    const response = await fetchWithIPv4(url);
    
    return {
      success: true,
      status: response.status,
      url: response.url,
      headers: response.headers,
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
 * Get website content (browser-like)
 */
async function browseWebsite(url) {
  try {
    const response = await fetchWithIPv4(url);
    
    // Extract title from HTML
    const titleMatch = response.data.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'No title found';
    
    // Extract meta description
    const descMatch = response.data.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1].trim() : 'No description found';
    
    return {
      success: true,
      url: response.url,
      status: response.status,
      title: title,
      description: description,
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
          testConnectivity('https://www.github.com'),
          testConnectivity('https://www.stackoverflow.com')
        ]);
        
        res.status(200).json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          tests: healthTests,
          environment: {
            nodeVersion: process.version,
            platform: process.platform,
            dnsOrder: process.env.NODE_OPTIONS
          }
        });
        break;
        
      default:
        res.status(400).json({ 
          error: 'Invalid action. Use: test, browse, or health',
          usage: {
            test: '/api/browser?action=test&url=https://example.com',
            browse: '/api/browser?action=browse&url=https://example.com', 
            health: '/api/browser?action=health'
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