import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import validator from 'validator';  // For input sanitization

dotenv.config({ path: path.join(process.cwd(), '.env') });

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve chat UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Function to convert **text** to bold HTML
const convertToBold = (text) => {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
};

// Chat endpoint
app.post('/chat', async (req, res) => {
  const { userInput } = req.body;

  // Input sanitization to prevent malicious inputs
  const sanitizedInput = validator.escape(userInput);
  
  if (!sanitizedInput) {
    return res.status(400).json({ error: 'No userInput provided or invalid input' });
  }

  console.log('🔍 userInput:', sanitizedInput + "This is a news checking website api request check the news wheather it is true or not . make the answer Short if u need to explain go up 20 words  max else try under 20 words answer to the point.");

  try {
    const modelName = 'models/gemini-1.5-pro-001';

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/${modelName}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: sanitizedInput }] }]
        })
      }
    );

    const raw = await geminiRes.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch (jsonErr) {
      console.error('❌ Failed to parse Gemini response:', raw);
      return res.status(500).json({ error: 'Invalid response from AI', raw });
    }

    console.log('🔍 Gemini API response:', JSON.stringify(data, null, 2));

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI';

    // Convert the response to a more natural paragraph format and bold the **text**
    const formattedText = convertToBold(replyText);

    // Wrap the response in a paragraph for better formatting
    const paragraphText = `<p>${formattedText}</p>`;

    res.json({ response: paragraphText });

  } catch (err) {
    console.error('🛑 Gemini fetch error:', err);
    res.status(500).json({ error: 'AI service error', details: err.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
