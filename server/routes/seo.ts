import { Router, Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const router = Router();

function slugify(text: string): string {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function generateWithFallback(ai: GoogleGenAI, prompt: string) {
  const models = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert technical SEO and AI Search Optimization (AEO/GEO) strategist for a software engineer portfolio. Return strict JSON only matching the requested schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              slug: {
                type: Type.STRING,
                description: 'Clean URL slug using lowercase letters, numbers, and hyphens.',
              },
              seoTitle: {
                type: Type.STRING,
                description: 'SEO page title between 40 and 62 characters including Dubbaka Sathwik.',
              },
              metaDescription: {
                type: Type.STRING,
                description: 'Meta description between 120 and 158 characters.',
              },
              keywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '6 to 10 relevant search keywords and phrases.',
              },
              tldr: {
                type: Type.STRING,
                description: 'Crisp 1-2 sentence technical takeaway for search engines and AI assistants.',
              },
            },
            required: ['slug', 'seoTitle', 'metaDescription', 'keywords', 'tldr'],
          },
        },
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errStr = String(err?.message || err || '');
      const isTransient = errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('high demand');
      if (!isTransient) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Gemini metadata generation failed');
}

// POST /api/seo/generate-metadata - Server-side Gemini AI SEO & LLM discoverability metadata generator
router.post('/generate-metadata', async (req: Request, res: Response): Promise<void> => {
  try {
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      res.status(503).json({
        success: false,
        error: {
          code: 'GEMINI_KEY_MISSING',
          message: 'GEMINI_API_KEY is not configured in environment secrets.',
        },
      });
      return;
    }

    const {
      type = 'project',
      title = '',
      summary = '',
      description = '',
      category = '',
      tags = [],
      year = '',
      venue = '',
      role = '',
      sourceName = '',
      externalUrl = '',
    } = req.body || {};

    if (!title || String(title).trim().length < 2) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Title is required before generating SEO metadata.',
        },
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const cleanTags = Array.isArray(tags) ? tags.join(', ') : String(tags || '');
    const contextExtra = [
      venue ? `Venue: ${venue}` : '',
      role ? `Role: ${role}` : '',
      sourceName ? `Publisher / Source: ${sourceName}` : '',
      externalUrl ? `Original Reference URL: ${externalUrl}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    const prompt = `Generate search engine optimization (Google Search) and AI-assistant discovery (ChatGPT, Gemini, Claude) metadata for an item on Dubbaka Sathwik's official portfolio website (https://dubbakasathwik.netlify.app).

Item Type: ${type}
Title: ${title}
Category: ${category}
Year/Date: ${year || '2026'}
${contextExtra ? `${contextExtra}\n` : ''}Technologies / Tags: ${cleanTags}
Short Summary: ${summary}
Detailed Description: ${String(description || '').slice(0, 2000)}

Author Identity to associate clearly: Dubbaka Sathwik (Full-Stack Developer, AI Software Engineer, CSIT at MVSR Engineering College, Hyderabad).

Requirements:
1. slug: Clean lowercase URL slug using hyphens (e.g. "ai-hiring-assistant"), 2 to 6 words.
2. seoTitle: 40 to 62 characters, compelling, clearly includes the item title and "Dubbaka Sathwik".
3. metaDescription: 120 to 158 characters, accurate summary highlighting key tech/value and attribution to Dubbaka Sathwik.
4. keywords: Array of 6 to 10 high-intent search phrases people or recruiters might search (including "${title}", "${title} Dubbaka Sathwik", "Dubbaka Sathwik portfolio", and stack-specific terms).
5. tldr: A crisp 1-2 sentence AI-readable key takeaway summarizing what this work solves, how it works technically, and why it matters.`;

    const response = await generateWithFallback(ai, prompt);
    const rawText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawText);

    res.json({
      success: true,
      metadata: {
        slug: slugify(parsed.slug || title),
        seoTitle: String(parsed.seoTitle || `${title} | Dubbaka Sathwik`).slice(0, 80),
        metaDescription: String(parsed.metaDescription || summary || description).slice(0, 170),
        keywords: Array.isArray(parsed.keywords)
          ? parsed.keywords.map((k: any) => String(k).trim()).filter(Boolean).slice(0, 12)
          : [],
        tldr: String(parsed.tldr || '').trim(),
      },
    });
  } catch (error: any) {
    console.error('[SEO Gemini Metadata Error]:', error);
    const msg = error?.message || 'Failed to generate SEO metadata via Gemini';
    res.status(500).json({
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: msg,
      },
    });
  }
});

// POST /api/seo/ping-indexnow - Notify Bing / ChatGPT IndexNow endpoints of updated portfolio URLs
router.post('/ping-indexnow', async (req: Request, res: Response): Promise<void> => {
  try {
    const { urls = [], host = 'dubbakasathwik.netlify.app', key = '' } = req.body || {};
    const validUrls = Array.isArray(urls) && urls.length > 0
      ? urls.slice(0, 50)
      : [`https://${host}/`, `https://${host}/insights`, `https://${host}/llms.txt`];

    // Ping IndexNow API if key is configured or requested
    if (!key) {
      res.json({
        success: true,
        skippedExternal: true,
        urlsQueued: validUrls.length,
        message: 'Sitemap & llms.txt URLs prepared. Add an IndexNow verification file to enable direct Bing/ChatGPT push.',
      });
      return;
    }

    const indexRes = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `https://${host}/${key}.txt`,
        urlList: validUrls,
      }),
    });

    res.json({
      success: indexRes.ok,
      status: indexRes.status,
      urlsSubmitted: validUrls.length,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { message: err?.message || 'IndexNow ping error' },
    });
  }
});

export default router;
