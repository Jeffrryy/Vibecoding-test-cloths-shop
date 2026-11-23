import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const NANO_BANANA_MODEL = 'gemini-nano-banana-2.1';
const TEXT_VISION_MODEL = 'gemini-4-hydrogen';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw Object.assign(
      new Error('GEMINI_API_KEY is not configured. Please add your API key in Settings > Secrets.'),
      { statusCode: 400 }
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function parseGeminiError(error: unknown): { status: number; message: string; code?: string } {
  const errObj = error as { status?: number; statusCode?: number; message?: string; code?: string };
  const rawMessage = errObj?.message || 'An unexpected error occurred while communicating with Gemini API.';
  let status = errObj?.status || errObj?.statusCode || 500;

  if (rawMessage.includes('PERMISSION_DENIED') || rawMessage.includes('403')) {
    status = 403;
    return {
      status,
      code: 'PERMISSION_DENIED',
      message: 'API permission denied for gemini-nano-banana-2.1. Please select a billing-enabled API key in Settings > Secrets.',
    };
  }
  if (rawMessage.includes('API_KEY_INVALID') || rawMessage.includes('API key not valid')) {
    status = 400;
    return {
      status,
      code: 'API_KEY_INVALID',
      message: 'Your Gemini API key appears invalid. Please verify or update it in Settings > Secrets.',
    };
  }
  if (rawMessage.includes('RESOURCE_EXHAUSTED') || rawMessage.includes('429')) {
    status = 429;
    return {
      status,
      code: 'RESOURCE_EXHAUSTED',
      message: 'Quota exceeded or paid tier required for gemini-nano-banana-2.1. Select a billing-enabled API key in Settings > Secrets to continue.',
    };
  }
  if (rawMessage.includes('NOT_FOUND') || rawMessage.includes('404')) {
    status = 404;
    return {
      status,
      code: 'NOT_FOUND',
      message: `Model error: ${rawMessage}`,
    };
  }

  return { status: status >= 400 && status < 600 ? status : 500, message: rawMessage };
}

function stripDataUrlPrefix(dataUrlOrBase64: string): { base64: string; mimeType?: string } {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrlOrBase64);
  if (match) {
    return { mimeType: match[1], base64: match[2] };
  }
  return { base64: dataUrlOrBase64 };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '30mb' }));
  app.use('/api', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, model: NANO_BANANA_MODEL });
  });

  // Analyze uploaded logo and plan 5 diverse design variations tailored to it
  app.post('/api/mockups/plan-variations', async (req, res) => {
    try {
      const { logoBase64, logoMimeType, defaultProduct } = req.body as {
        logoBase64?: string;
        logoMimeType?: string;
        defaultProduct?: string;
      };

      if (!logoBase64) {
        return res.status(400).json({ error: 'Uploaded logo image is required.' });
      }

      const ai = getAiClient();
      const parsedLogo = stripDataUrlPrefix(logoBase64);
      const mime = logoMimeType || parsedLogo.mimeType || 'image/png';

      const response = await ai.models.generateContent({
        model: TEXT_VISION_MODEL,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mime,
                data: parsedLogo.base64,
              },
            },
            {
              text: `Inspect this brand logo carefully. Design exactly 5 diverse, cohesive merchandise mockup variations showcasing different arrangements, color palettes, print techniques, and product pairings (spread across heavyweight hoodie, boxy crewneck tee, unbleached canvas tote bag, and stoneware ceramic mug, keeping "${defaultProduct || 'hoodie'}" featured).

Each variation MUST differ significantly in:
1. Arrangement & placement (e.g. Classic Center Chest, Left Pocket Crest with subtle woven hem label, Oversized Streetwear Back/Front Graphic, Minimalist Tonal Sleeve/Corner Lockup, Vintage Wraparound Seal)
2. Color palette (garment/surface color + ink color treatment with 3 accurate hex codes)
3. Print finish & physical style (e.g. Waterbased Matte Screenprint, High-Density Puff Ink, Chainstitch Embroidery, Distressed Vintage Halftone, Kiln Ceramic Decal)

Write concise, commercial-photography-grade artDirectionPrompt instructions that instruct an image model to faithfully place this exact uploaded logo onto the chosen product with realistic fabric/surface warping, lighting, and texture.`,
            },
          ],
        },
        config: {
          systemInstruction:
            'You are a senior merchandise creative director and apparel print production specialist. Return strictly structured JSON matching the schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              brandAnalysis: {
                type: Type.STRING,
                description: 'Brief 1-sentence summary of the logo visual style and geometry.',
              },
              variations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    productId: {
                      type: Type.STRING,
                      description: 'Must be one of: hoodie, tee, tote, mug',
                    },
                    productLabel: { type: Type.STRING },
                    arrangement: { type: Type.STRING },
                    printStyle: { type: Type.STRING },
                    paletteName: { type: Type.STRING },
                    garmentColorName: { type: Type.STRING },
                    paletteHexes: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    artDirectionPrompt: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      return res.json(parsed);
    } catch (error) {
      const parsed = parseGeminiError(error);
      return res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
    }
  });

  // Place logo onto a merchandise product shot using gemini-nano-banana-2.1
  app.post('/api/mockups/generate', async (req, res) => {
    try {
      const {
        logoBase64,
        logoMimeType,
        productBlankBase64,
        productBlankMimeType,
        productName,
        garmentColor,
        printStyle,
        arrangement,
        paletteDescription,
        customInstructions,
        aspectRatio = '4:3',
        imageSize = '1K',
      } = req.body as {
        logoBase64?: string;
        logoMimeType?: string;
        productBlankBase64?: string;
        productBlankMimeType?: string;
        productName?: string;
        garmentColor?: string;
        printStyle?: string;
        arrangement?: string;
        paletteDescription?: string;
        customInstructions?: string;
        aspectRatio?: string;
        imageSize?: string;
      };

      if (!logoBase64) {
        return res.status(400).json({ error: 'Uploaded logo image is required.' });
      }

      const ai = getAiClient();
      const parsedLogo = stripDataUrlPrefix(logoBase64);
      const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
        {
          inlineData: {
            data: parsedLogo.base64,
            mimeType: logoMimeType || parsedLogo.mimeType || 'image/png',
          },
        },
      ];

      if (productBlankBase64) {
        const parsedBlank = stripDataUrlPrefix(productBlankBase64);
        parts.push({
          inlineData: {
            data: parsedBlank.base64,
            mimeType: productBlankMimeType || parsedBlank.mimeType || 'image/jpeg',
          },
        });
      }

      const promptLines = [
        productBlankBase64
          ? `Create a photorealistic commercial studio product mockup by placing the uploaded brand logo (first image) naturally onto the ${productName || 'merchandise item'} shown in the second studio reference photo.`
          : `Create a photorealistic commercial studio product photograph of a ${garmentColor || 'neutral'} ${productName || 'heavyweight cotton hoodie'} featuring the uploaded brand logo.`,
        `Placement & Arrangement: ${arrangement || 'Centered cleanly on the primary print area'}.`,
        `Surface Colorway & Palette: ${garmentColor || 'Studio neutral'} with ${paletteDescription || 'high-contrast balanced ink palette'}.`,
        `Print Finish & Material Integration: ${printStyle || 'Waterbased matte screenprint'}. Ensure the logo conforms organically to fabric folds, weave texture, surface curvature, perspective, and soft diffused studio shadows. Do not alter the logo lettering or icon geometry—preserve brand fidelity.`,
        customInstructions ? `Additional Art Direction: ${customInstructions}` : '',
        'No watermarks, no extra UI frames, clean editorial studio photography.',
      ]
        .filter(Boolean)
        .join('\n');

      parts.push({ text: promptLines });

      const response = await ai.models.generateContent({
        model: NANO_BANANA_MODEL,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio,
            imageSize,
          },
        },
      });

      let imageUrl: string | null = null;
      let textOutput = '';

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType ?? 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          textOutput += part.text;
        }
      }

      if (!imageUrl) {
        return res.status(502).json({
          error: textOutput || 'Gemini did not return an image part. Try simplifying the prompt.',
        });
      }

      return res.json({
        imageUrl,
        text: textOutput.trim(),
        model: NANO_BANANA_MODEL,
      });
    } catch (error) {
      const parsed = parseGeminiError(error);
      return res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
    }
  });

  // Create or edit images using text prompts with gemini-nano-banana-2.1
  app.post('/api/images/edit', async (req, res) => {
    try {
      const {
        prompt,
        sourceImageBase64,
        sourceMimeType,
        aspectRatio = '1:1',
        imageSize = '1K',
      } = req.body as {
        prompt?: string;
        sourceImageBase64?: string;
        sourceMimeType?: string;
        aspectRatio?: string;
        imageSize?: string;
      };

      if (!prompt || !prompt.trim()) {
        return res.status(400).json({ error: 'A text prompt is required to create or edit an image.' });
      }

      const ai = getAiClient();
      const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];

      if (sourceImageBase64) {
        const parsedImg = stripDataUrlPrefix(sourceImageBase64);
        parts.push({
          inlineData: {
            data: parsedImg.base64,
            mimeType: sourceMimeType || parsedImg.mimeType || 'image/png',
          },
        });
      }

      parts.push({ text: prompt.trim() });

      const response = await ai.models.generateContent({
        model: NANO_BANANA_MODEL,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio,
            imageSize,
          },
        },
      });

      let imageUrl: string | null = null;
      let textOutput = '';

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType ?? 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          textOutput += part.text;
        }
      }

      if (!imageUrl) {
        return res.status(502).json({
          error: textOutput || 'Gemini did not return an image part for this prompt.',
        });
      }

      return res.json({
        imageUrl,
        text: textOutput.trim(),
        model: NANO_BANANA_MODEL,
      });
    } catch (error) {
      const parsed = parseGeminiError(error);
      return res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Presshouse Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
