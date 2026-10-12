import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
// Remove top-level vite import

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY as string,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// AI Generation Routes
app.post('/api/ai/generate-truefalse', async (req, res) => {
  const { count = 10 } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Generate ${count} logical true/false questions for Senior High School students in Ghana. 
      Focus on logical quantifiers: ALL, SOME, NONE. 
      Use local Ghanaian contexts (schools, markets, food, culture).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  answer: { type: Type.STRING, enum: ["TRUE", "FALSE"] },
                  explanation: { type: Type.STRING },
                  hint: { type: Type.STRING }
                },
                required: ["text", "answer", "explanation", "hint"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

app.post('/api/ai/generate-venn', async (req, res) => {
  const { count = 3 } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Generate ${count} Venn Diagram scenarios for SHS students in Ghana. 
      Each scenario should have two sets (Left, Right) and an Overlap. 
      Include 3 true/false questions per scenario.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenarios: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  left: { type: Type.STRING },
                  right: { type: Type.STRING },
                  overlap: { type: Type.STRING },
                  questions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        q: { type: Type.STRING },
                        a: { type: Type.STRING, enum: ["TRUE", "FALSE"] },
                        exp: { type: Type.STRING }
                      },
                      required: ["q", "a", "exp"]
                    }
                  }
                },
                required: ["left", "right", "overlap", "questions"]
              }
            }
          },
          required: ["scenarios"]
        }
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate Venn scenarios" });
  }
});

app.post('/api/ai/generate-patterns', async (req, res) => {
  const { count = 10 } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Generate ${count} number sequence pattern problems for SHS students. 
      Focus on linear, doubling, and simple arithmetic/geometric sequences.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patterns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  seq: { type: Type.ARRAY, items: { type: Type.STRING } },
                  answer: { type: Type.NUMBER },
                  options: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                  rule: { type: Type.STRING },
                  type: { type: Type.STRING },
                  level: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] }
                },
                required: ["seq", "answer", "options", "rule", "type", "level"]
              }
            }
          },
          required: ["patterns"]
        }
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate patterns" });
  }
});

app.post('/api/ai/generate-decisions', async (req, res) => {
  const { count = 5 } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Generate ${count} multi-factor decision scenarios for SHS students in Ghana. 
      Context: Business, school, or community projects in Ghana.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenarios: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  scenario: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        cost: { type: Type.STRING },
                        benefit: { type: Type.STRING },
                        risk: { type: Type.STRING },
                        isBest: { type: Type.BOOLEAN },
                        reason: { type: Type.STRING }
                      },
                      required: ["name", "cost", "benefit", "risk", "isBest", "reason"]
                    }
                  }
                },
                required: ["scenario", "options"]
              }
            }
          },
          required: ["scenarios"]
        }
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate decisions" });
  }
});

app.post('/api/ai/generate-arguments', async (req, res) => {
  const { count = 5 } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Generate ${count} syllogism/logical deduction problems for SHS students. 
      Context: Ghanaian cultural or academic scenarios.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            arguments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  premise1: { type: Type.STRING },
                  premise2: { type: Type.STRING },
                  conclusion: { type: Type.STRING },
                  isValid: { type: Type.BOOLEAN },
                  explanation: { type: Type.STRING }
                },
                required: ["premise1", "premise2", "conclusion", "isValid", "explanation"]
              }
            }
          },
          required: ["arguments"]
        }
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate arguments" });
  }
});

app.post('/api/ai/generate-fallacies', async (req, res) => {
  const { count = 5 } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Generate ${count} informal fallacy identification problems for SHS students. 
      Include Ad Hominem, Straw Man, Slippery Slope, Appeal to Authority.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fallacies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  fallacyName: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["text", "fallacyName", "explanation"]
              }
            }
          },
          required: ["fallacies"]
        }
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate fallacies" });
  }
});

// Middleware and server start
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // In production, the server is bundled into dist/server.js
    // so __dirname is the dist directory itself.
    app.use(express.static(__dirname));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'index.html'));
    });
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
