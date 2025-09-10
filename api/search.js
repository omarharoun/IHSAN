// Helper function to get additional search results
async function getAdditionalSearchResults(query, limit) {
  const additionalResults = [];
  
  // Create diverse results based on common domains with more DuckDuckGo-style results
  const domains = [
    { domain: 'wikipedia.org', type: 'Encyclopedia', snippet: `Comprehensive encyclopedia article about ${query}` },
    { domain: 'github.com', type: 'Code Repository', snippet: `Open source projects and code examples for ${query}` },
    { domain: 'stackoverflow.com', type: 'Q&A Forum', snippet: `Community questions and answers about ${query}` },
    { domain: 'medium.com', type: 'Articles', snippet: `In-depth articles and tutorials about ${query}` },
    { domain: 'dev.to', type: 'Developer Blog', snippet: `Developer insights and experiences with ${query}` },
    { domain: 'reddit.com', type: 'Community Discussion', snippet: `Community discussions and experiences about ${query}` },
    { domain: 'youtube.com', type: 'Video Tutorials', snippet: `Video tutorials and guides for ${query}` },
    { domain: 'docs.microsoft.com', type: 'Official Documentation', snippet: `Official Microsoft documentation for ${query}` },
    { domain: 'developer.mozilla.org', type: 'Web Documentation', snippet: `Mozilla Developer Network resources for ${query}` },
    { domain: 'w3schools.com', type: 'Learning Platform', snippet: `Interactive tutorials and examples for ${query}` }
  ];
  
  // Add more DuckDuckGo-style results
  const duckDuckGoStyleResults = [
    {
      title: `${query} - Instant Answer`,
      url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      snippet: `Get instant answers and quick facts about ${query}`,
      score: 0.8,
      domain: 'duckduckgo.com'
    },
    {
      title: `${query} - News`,
      url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}&t=h_&iar=news&ia=news`,
      snippet: `Latest news and updates about ${query}`,
      score: 0.75,
      domain: 'duckduckgo.com'
    },
    {
      title: `${query} - Images`,
      url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}&t=h_&iar=images&iax=images&ia=images`,
      snippet: `Visual content and images related to ${query}`,
      score: 0.7,
      domain: 'duckduckgo.com'
    },
    {
      title: `${query} - Videos`,
      url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}&t=h_&iar=videos&iax=videos&ia=videos`,
      snippet: `Video content and tutorials about ${query}`,
      score: 0.65,
      domain: 'duckduckgo.com'
    }
  ];
  
  // Add DuckDuckGo-style results first
  additionalResults.push(...duckDuckGoStyleResults);
  
  // Then add domain-based results
  domains.slice(0, Math.min(limit - duckDuckGoStyleResults.length, 6)).forEach((item, index) => {
    additionalResults.push({
      title: `${query} - ${item.type}`,
      url: `https://${item.domain}/search?q=${encodeURIComponent(query)}`,
      snippet: item.snippet,
      score: 0.6 - (index * 0.05),
      timestamp: new Date().toISOString(),
      domain: item.domain,
      favicon: `https://www.google.com/s2/favicons?domain=${item.domain}&sz=32`
    });
  });
  
  return additionalResults;
}

// Helper function to get additional images
async function getAdditionalImages(query) {
  const images = [];
  
  // Create image URLs using various image services with more specific queries
  const imageQueries = [
    query,
    `${query} concept`,
    `${query} illustration`,
    `${query} diagram`,
    `${query} tutorial`
  ];
  
  imageQueries.forEach((imgQuery, index) => {
    images.push({
      url: `https://source.unsplash.com/400x300/?${encodeURIComponent(imgQuery)}`,
      title: `${imgQuery} - High Quality Image`,
      source: 'Unsplash'
    });
  });
  
  // Add some placeholder images with better styling
  images.push({
    url: `https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=${encodeURIComponent(query)}`,
    title: `${query} - Placeholder`,
    source: 'Placeholder'
  });
  
  return images;
}

// Vercel serverless function for search API
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, limit = 15 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Use multiple search sources for more comprehensive results
    const searchPromises = [
      // DuckDuckGo API with more comprehensive parameters
      fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=0&t=ihsan_search`),
      // Wikipedia API for additional context
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`),
      // Additional search simulation
      Promise.resolve({ json: () => Promise.resolve({}) })
    ];
    
    const [duckDuckGoResponse, wikipediaResponse] = await Promise.allSettled(searchPromises.slice(0, 2));
    const data = duckDuckGoResponse.status === 'fulfilled' ? await duckDuckGoResponse.value.json() : {};
    const wikiData = wikipediaResponse.status === 'fulfilled' ? await wikipediaResponse.value.json() : {};
    
    const results = [];
    const images = [];
    
    // Process Wikipedia result first (high quality)
    if (wikiData.title && wikiData.extract) {
      results.push({
        title: wikiData.title,
        url: wikiData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
        snippet: wikiData.extract,
        score: 0.95,
        timestamp: new Date().toISOString(),
        domain: 'en.wikipedia.org',
        favicon: 'https://www.google.com/s2/favicons?domain=en.wikipedia.org&sz=32'
      });
    }
    
    // Process main DuckDuckGo result (only if not from DuckDuckGo)
    if (data.Abstract && data.AbstractURL && !data.AbstractURL.includes('duckduckgo.com')) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL,
        snippet: data.Abstract,
        score: 0.9,
        timestamp: new Date().toISOString(),
        domain: new URL(data.AbstractURL).hostname,
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(data.AbstractURL).hostname}&sz=32`
      });
    }
    
    // Process related topics (filter out DuckDuckGo links)
    if (data.RelatedTopics) {
      data.RelatedTopics.forEach((topic, index) => {
        if (topic.Text && topic.FirstURL && !topic.FirstURL.includes('duckduckgo.com')) {
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
    
    // Process Definition if available
    if (data.Definition && data.DefinitionURL) {
      results.push({
        title: `${query} - Definition`,
        url: data.DefinitionURL,
        snippet: data.Definition,
        score: 0.85,
        timestamp: new Date().toISOString(),
        domain: new URL(data.DefinitionURL).hostname,
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(data.DefinitionURL).hostname}&sz=32`
      });
    }
    
    // Process Answer if available
    if (data.Answer && data.AnswerType) {
      results.push({
        title: `${query} - ${data.AnswerType}`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        snippet: data.Answer,
        score: 0.9,
        timestamp: new Date().toISOString(),
        domain: 'duckduckgo.com',
        favicon: 'https://www.google.com/s2/favicons?domain=duckduckgo.com&sz=32'
      });
    }
    
    // Process Redirect if available
    if (data.Redirect) {
      results.push({
        title: `${query} - Redirect`,
        url: data.Redirect,
        snippet: `Redirect to ${data.Redirect}`,
        score: 0.75,
        timestamp: new Date().toISOString(),
        domain: new URL(data.Redirect).hostname,
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(data.Redirect).hostname}&sz=32`
      });
    }
    
    // Process Infobox if available
    if (data.Infobox && data.Infobox.content) {
      data.Infobox.content.forEach((item, index) => {
        if (item.label && item.value) {
          results.push({
            title: `${query} - ${item.label}`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
            snippet: `${item.label}: ${item.value}`,
            score: 0.7 - (index * 0.05),
            timestamp: new Date().toISOString(),
            domain: 'duckduckgo.com',
            favicon: 'https://www.google.com/s2/favicons?domain=duckduckgo.com&sz=32'
          });
        }
      });
    }
    
    // Process images from Wikipedia
    if (wikiData.thumbnail) {
      images.push({
        url: wikiData.thumbnail.source,
        title: wikiData.title || query,
        source: 'Wikipedia'
      });
    }
    
    // Process images from DuckDuckGo
    if (data.Image) {
      images.push({
        url: data.Image,
        title: data.Heading || query,
        source: data.AbstractURL || 'DuckDuckGo'
      });
    }
    
    // Process additional DuckDuckGo images if available
    if (data.Images && Array.isArray(data.Images)) {
      data.Images.slice(0, 3).forEach((img, index) => {
        if (img.url) {
          images.push({
            url: img.url,
            title: img.title || `${query} - Image ${index + 1}`,
            source: 'DuckDuckGo Images'
          });
        }
      });
    }
    
    // Add more diverse results using web search simulation
    const additionalResults = await getAdditionalSearchResults(query, limit);
    results.push(...additionalResults);
    
    // Add more images
    const additionalImages = await getAdditionalImages(query);
    images.push(...additionalImages);

    const response = {
      query,
      results: results.slice(0, limit),
      total_results: results.length,
      processing_time: 0.5,
      ai_summary: data.Abstract || `Search results for "${query}"`,
      answer: data.Answer || null,
      suggestions: [
        `${query} tutorial`,
        `${query} guide`,
        `learn ${query}`,
        `${query} examples`,
        `${query} documentation`
      ],
      images: images
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      message: error.message 
    });
  }
}
