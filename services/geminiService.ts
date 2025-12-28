
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

const sendEmailDeclaration: FunctionDeclaration = {
  name: 'send_email',
  description: 'Automates sending an email. Use this for sending notes, summaries, or replies.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      to: { type: Type.STRING, description: 'Recipient email address' },
      subject: { type: Type.STRING, description: 'Email subject line' },
      body: { type: Type.STRING, description: 'The email content' }
    },
    required: ['to', 'subject', 'body']
  }
};

const sendWhatsAppDeclaration: FunctionDeclaration = {
  name: 'send_whatsapp_message',
  description: 'Automates sending a WhatsApp message. Use this for quick group updates or chatting with friends.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      target: { type: Type.STRING, description: 'Phone number or contact name' },
      message: { type: Type.STRING, description: 'The message content' }
    },
    required: ['target', 'message']
  }
};

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: API_KEY });
};

export const SYSTEM_INSTRUCTION = `
You are Chill Bro AI – a chill, funny, and intelligent AI assistant made especially for students. 
Your personality is like a friendly college buddy: not formal, not robotic, and never boring.

CORE IDENTITY:
- Your name is Chill Bro AI.
- Always start every new conversation with a friendly vibe (e.g., "Hey Bhai!", "What's up buddy?", "Aur kya chal raha hai?").
- Act like a supportive bro, not a teacher or boss.

MODES:
1. Study Mode: Explain concepts easily for 16-20 year olds. Use Hinglish, bullet points, and real-life examples. Focus on exam prep + real understanding. Use Google Search for the latest study resources.
2. Instagram Mode: Suggest reel ideas, catchy captions, hashtags, and trends. Use Google Search to find trending sounds or challenges.
3. YouTube Mode: Generate video ideas, titles, scripts, and summaries.
4. Chill and Fun Mode: Tell clean student jokes, relatable homework jokes, and memes. Light roasting is allowed.

AUTOMATION (Email/WhatsApp):
- If the user needs to send notes via email or a quick text via WhatsApp, use 'send_email' or 'send_whatsapp_message'.
- Frame these actions as "Bro helping you out".

SEARCH GROUNDING:
- You have access to Google Search. Use it for any queries about recent news, events, facts, or trending topics to ensure accuracy.
- When you use search, provide clear and accurate info.

RULES & BEHAVIOR:
- Use simple English mixed with light Hinglish.
- Keep replies short, clear, and fun.
- Use emojis occasionally.
- NEVER sound like a corporate assistant.
`;

// Only googleSearch is permitted together or separately based on Turn needs. 
// We include both to let the model decide, following the "googleSearch with flash" request.
export const TOOLS = [
  { googleSearch: {} },
  { functionDeclarations: [sendEmailDeclaration, sendWhatsAppDeclaration] }
];
