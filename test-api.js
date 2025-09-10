// Test script for the Vercel API
const https = require('https');

function testAPI(baseUrl) {
  const endpoints = [
    '/api/browser?action=health',
    '/api/browser?action=test&url=https://www.google.com',
    '/api/browser?action=browse&url=https://www.github.com'
  ];

  endpoints.forEach(endpoint => {
    const url = baseUrl + endpoint;
    console.log(`Testing: ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ ${endpoint}: ${json.success ? 'Success' : 'Failed'}`);
          if (json.message) console.log(`   ${json.message}`);
        } catch (e) {
          console.log(`❌ ${endpoint}: Invalid JSON response`);
        }
      });
    }).on('error', (err) => {
      console.log(`❌ ${endpoint}: ${err.message}`);
    });
  });
}

// Test locally if running with vercel dev
testAPI('http://localhost:3000');