# Vercel Browser Connectivity Fix

A Vercel-compatible solution for browser connectivity issues that works in serverless functions.

## Problem Solved

- **IPv6 connectivity issues** - Forces IPv4 connections
- **DNS resolution problems** - Uses reliable DNS servers
- **Browser-like functionality** - Provides web scraping and browsing capabilities
- **Vercel compatibility** - Works within Vercel's serverless constraints

## Features

- ✅ IPv4-only connections (avoids Vercel's IPv6 limitations)
- ✅ Reliable DNS resolution
- ✅ Browser-like user agent and headers
- ✅ Website content extraction
- ✅ Health monitoring
- ✅ CORS enabled for web usage

## API Endpoints

### Test Connectivity
```
GET /api/browser?action=test&url=https://example.com
```

### Browse Website
```
GET /api/browser?action=browse&url=https://example.com
```

### Health Check
```
GET /api/browser?action=health
```

## Usage Examples

### Test if a website is accessible:
```bash
curl "https://your-app.vercel.app/api/browser?action=test&url=https://www.google.com"
```

### Get website content:
```bash
curl "https://your-app.vercel.app/api/browser?action=browse&url=https://www.github.com"
```

### Check system health:
```bash
curl "https://your-app.vercel.app/api/browser?action=health"
```

## Deployment

1. Copy the files to your Vercel project
2. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

## Key Differences from Linux Script

| Linux Script | Vercel Solution |
|---------------|-----------------|
| `sudo apt install` | Uses built-in Node.js modules |
| System file modification | Environment variables |
| Persistent changes | Per-request configuration |
| Root privileges required | Runs in sandbox |
| IPv6 disable via sysctl | IPv4-only via Node.js options |

## Environment Variables

The solution automatically sets:
- `NODE_OPTIONS=--dns-result-order=ipv4first` - Forces IPv4 connections
- Browser-like User-Agent headers
- Proper timeout and connection settings

## Limitations

- No GUI browsers (text-based only)
- 30-second function timeout limit
- No persistent storage between requests
- Limited to HTTP/HTTPS requests

## Browser Alternatives for Vercel

1. **Puppeteer** - For full browser automation (requires special Vercel config)
2. **Playwright** - Similar to Puppeteer
3. **Cheerio** - For HTML parsing
4. **This solution** - Lightweight HTTP requests with browser-like behavior