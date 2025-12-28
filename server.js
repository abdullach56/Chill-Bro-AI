import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Example /api/chat endpoint
app.post('/api/chat', async (req, res) => {
  const { contents } = req.body;

  // Simple echo logic (AI integration baad me add karna)
  const lastMsg = contents && contents.length
    ? contents[contents.length - 1].parts[0].text
    : 'Hello!';
    
  res.json({
    candidates: [
      {
        content: { parts: [{ text: `Bhai reply: ${lastMsg}` }] }
      }
    ]
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
