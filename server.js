// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';

// Gemini API client import (example)
// import { GenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve React build folder
app.use(express.static(path.join(__dirname, 'dist')));

// API endpoint for chat
import { GoogleGenAI } from '@google/genai';

const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '' });

app.post('/api/chat', async (req, res) => {
  try {
    const { model = 'gemini-3-flash-preview', contents, message, config } = req.body;

    // Support simple `message` string or full structured `contents` payload
    const contentsToSend = contents && contents.length ? contents : (message ? [{ role: 'user', parts: [{ text: message }] }] : []);

    const response = await geminiClient.models.generateContent({
      model,
      contents: contentsToSend,
      config: config || undefined
    });

    // Forward the Gemini response directly to the client
    res.json(response);
  } catch (err) {
    console.error('Error in /api/chat:', err);
    res.status(500).json({ error: 'Something went wrong', details: err instanceof Error ? err.message : String(err) });
  }
});

// Catch-all route to serve React SPA
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
