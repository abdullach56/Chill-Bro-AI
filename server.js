import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Serve Vite build
app.use(express.static(path.join(__dirname, "dist")));

// API route
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    // TEMP response (replace with Gemini later)
    res.json({
      reply: `Bhai reply: ${message}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ EXPRESS 5 SAFE SPA FALLBACK
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
