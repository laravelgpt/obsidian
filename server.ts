import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini API
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  // API Route - suggestions and Chatbot
  app.post("/api/chat", async (req, res) => {
    try {
      const activeApiKey = process.env.GEMINI_API_KEY;
      if (!activeApiKey) {
        return res.status(400).json({ error: "GEMINI_API_KEY is not set. Please add it via the Secrets panel in AI Studio Settings." });
      }

      if (!ai) {
        ai = new GoogleGenAI({
          apiKey: activeApiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      }

      const { messages, activeNote, allNotesList } = req.body;

      const systemInstruction = `You are an expert Obsidian Knowledge Assistant, integrated into a sleek, minimalist Obsidian .md Markdown Editor.
Your job is to act as a chatbot to offer real-time suggestions, draft content, and help structure the user's Obsidian vault.

Current Active Note: "${activeNote?.title || "Untitled"}"
Current Note Content:
"""
${activeNote?.content || "(Note is empty)"}
"""

Available Notes in Vault:
${allNotesList && allNotesList.length > 0 
  ? allNotesList.map((n: any) => `- [[${n.title}]]`).join("\n") 
  : "No notes exist yet."}

Guidelines:
1. Promote linking and interconnectivity! When referencing topics that the user already has a note for, always format them as [[Note Title]]. Suggest creating new notes using [[New Note Title]] if a concept deserves its own node.
2. Provide content generation (drafting headers, outlines, body paragraphs) directly formatted as clean Markdown.
3. Be structured, professional, concise, and helpful.
4. If asked to generate an Obsidian plan, outline nodes and relationships explicitly using [[Note Name]] syntax.`;

      const formattedContents = messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
        }
      });

      res.json({ text: result.text });
    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      res.status(500).json({ error: error?.message || "An error occurred with Gemini API." });
    }
  });

  // API Route - generate specific Obsidian Note-Taking Plan / Roadmap
  app.post("/api/generate-plan", async (req, res) => {
    try {
      const activeApiKey = process.env.GEMINI_API_KEY;
      if (!activeApiKey) {
        return res.status(400).json({ error: "GEMINI_API_KEY is not set. Please add it via the Secrets panel in AI Studio Settings." });
      }

      if (!ai) {
        ai = new GoogleGenAI({
          apiKey: activeApiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      }

      const { topic, planType } = req.body;
      const isFullStack = planType === "fullstack";

      let systemInstruction = "";

      if (isFullStack) {
        systemInstruction = `You are a world-class Full Stack Software Architect and System Modeler.
Your goal is to parse the user's software idea/topic and create a deeply detailed, production-ready Full Stack Blueprint Notes Vault.

You MUST deliver your response exactly in JSON format as specified below.
Ensure your response is valid JSON only. Do not wrap it in markdown code blocks. Just raw, unescaped JSON.

The vault plan must contain exactly these 4 interconnected files to form a complete systems architecture:
1. "1. Database Schema & Models": Detailing the database choice, detailed tables/collections, column types, foreign keys, and relations. MUST include a Sequential Link Flow diagram using the arrow syntax (e.g., "- User Table -> Profiles Table -> Posts Table -> Likes Table") under a section, so it compiles into a dynamic visual diagram.
2. "2. Backend API Services": Detailing server technology, middleware architecture, API endpoints (GET, POST, etc.) and handlers. MUST include a flow diagram (e.g., "- Client Request -> Auth Middleware -> Rate Limiter -> User Controller -> Active DB Connection").
3. "3. Frontend Views & UI": Detailing components, state management, routes, and layout design. MUST include a flow diagram (e.g., "- App Router -> Dashboard Screen -> Project Cards -> Task Modal -> PUT API Call").
4. "4. Master Architecture Flow & Deployment": Connecting Database, Backend, and Frontend. MUST include a primary flowchart mapping the entire lifecycle (e.g., "- Client browser -> DNS Gateway -> Express App Server -> Postgres DB Storage").

All markdown content must be rich, exhaustive, containing real code/config stubs (SQL, typescript, or JSX code), headers, bullet lists, explanations, and cross-references utilizing [[Double Brackets]] syntax for connections.

JSON Schema:
{
  "vaultName": "Name of the Full Stack system vault",
  "recommendedNotes": [
    {
      "title": "Title of the note (e.g. 1. Database Schema & Models)",
      "content": "Fully populated markdown contents of this note with explanations, schema code blocks, and the vital arrow flow lines like '- Node1 -> Node2' to build the Dynamic Diagram.",
      "category": "Core"
    }
  ],
  "roadmapDescription": "Detailed overview of the engineering setup, dev commands to use, and structural roadmap."
}`;
      } else {
        systemInstruction = `You are a professional knowledge mapping and note-taking strategist. 
Your goal is to parse the user's topic and create a comprehensive, highly interconnected "Obsidian Notes Vault Plan".
This plan provides a set of structured starting notes and a strategy for linking them.

You MUST deliver your response exactly in JSON format as specified below.
Ensure your response is valid JSON only. Do not wrap it in markdown code blocks like \`\`\`json. Just raw, unescaped JSON.

JSON Schema:
{
  "vaultName": "Name of the structured vault",
  "recommendedNotes": [
    {
      "title": "Title of the note (e.g., Python Basics)",
      "content": "Fully populated markdown contents of this note, containing multiple headers, bullet points, explanations, and cross-references to other notes in the plan using [[Other Note Name]] syntax.",
      "category": "Core, Resource, Index, or Detail"
    }
  ],
  "roadmapDescription": "Short text summary of the recommended organization philosophy and next steps."
}`;
      }

      const prompt = isFullStack 
        ? `Create a Full Stack Blueprint Vault for: "${topic}". Include detailed Database, Backend API, Frontend Views, and Master Architecture diagrams using "- Node A -> Node B" arrow format inside notes.`
        : `Create an Obsidian Note Vault Plan with highly detailed, real markdown files for the topic: "${topic}". Make sure the notes are richly detailed and include double-bracket links like [[Note Title]] to build a tightly coupled semantic graph of standard links.`;

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        }
      });

      res.json(JSON.parse(result.text || "{}"));
    } catch (error: any) {
      console.error("Gemini Plan Error:", error);
      res.status(500).json({ error: error?.message || "An error occurred generating the plan." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
