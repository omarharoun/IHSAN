# Browser Connectivity Fix - Web Interface

This directory contains the web interface for testing the browser connectivity fix.

## Files

- `index.html` - Interactive web interface for testing the API endpoints

## Usage

Visit the main page to access the interactive testing interface, or use the API endpoints directly:

- `/api/test` - Basic connectivity test
- `/api/browser-simple?action=health` - System health check
- `/api/browser-simple?action=test&url=https://example.com` - Test specific website
- `/api/browser-simple?action=browse&url=https://example.com` - Browse website content