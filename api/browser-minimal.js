const https = require('https');

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
    
    if (action === 'test') {
      // Simple test with IPv4 preference
      const testUrl = url || 'https://www.google.com';
      
      const response = await new Promise((resolve, reject) => {
        const parsedUrl = new URL(testUrl);
        const req = https.request({
          hostname: parsedUrl.hostname,
          port: 443,
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'GET',
          family: 4, // Force IPv4
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; VercelBrowser/1.0)'
          },
          timeout: 10000
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({
            status: res.statusCode,
            dataLength: data.length
          }));
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
        
        req.end();
      });
      
      res.status(200).json({
        success: true,
        message: `Connected to ${testUrl}`,
        status: response.status,
        dataLength: response.dataLength
      });
    } else if (action === 'health') {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: {
          nodeVersion: process.version,
          platform: process.platform
        }
      });
    } else {
      res.status(400).json({
        error: 'Invalid action. Use: test or health',
        usage: {
          test: '/api/browser-minimal?action=test&url=https://example.com',
          health: '/api/browser-minimal?action=health'
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