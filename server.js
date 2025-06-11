// server.js - Gemini API Version
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Add favicon route to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Serve HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'interance.html'));
});

// Debug: Check environment variables
console.log('=== Server Starting ===');
console.log('Gemini API Key present:', !!process.env.OPENAI_API_KEY);

// Chat API endpoint using Gemini
app.post('/api/chat', async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key not configured. Please check your .env file.' });
  }

  try {
    const fetch = (await import('node-fetch')).default;
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.OPENAI_API_KEY}`;

    const response = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      return res.status(500).json({ error: 'Failed to get response from Gemini API' });
    }

    const data = await response.json();
    // Gemini's response structure
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';

    res.json({ content: aiText });
  } catch (error) {
    console.error('Error contacting Gemini API:', error);
    res.status(500).json({ error: 'Unable to connect to Gemini API.' });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});