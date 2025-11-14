const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8050;

// Middleware
app.use(cors());
app.use(express.json());

// Chat endpoint
app.get('/chat', (req, res) => {
  const { name } = req.query;
  
  if (!name) {
    return res.status(400).json({ error: 'Name parameter is required' });
  }
  
  res.json({ message: `Hi ${name}` });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
