export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Test API working!',
    timestamp: new Date().toISOString()
  });
}