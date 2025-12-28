import express from 'express';
import path from 'path';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Serve React build
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/api/chat', (req, res) => {
  // ... tera existing API logic
});

// Catch-all route to serve React index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port', PORT);
});
