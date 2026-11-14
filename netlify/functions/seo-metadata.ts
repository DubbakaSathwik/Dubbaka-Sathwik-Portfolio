import { GoogleGenAI, Type } from '@google/genai';

interface NetlifyEvent {
  httpMethod: string;
  path: string;
  body?: string | null;
  isBase64Encoded?: boolean;
}

function slugify(text: string): string {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function jsonResponse(statusCode: number, body: Record<string, any>) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(body),
  };
}

async function generateWithFallback(ai: GoogleGenAI, prompt: string) {
  const models = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of models) {
    try {
      return await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert technical SEO and AI Search Optimization (AEO/GEO) strategist for a software engineer portfolio. Return strict JSON only matching the requested schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              slug: { type: Type.STRING },
              seoTitle: { type: Type.STRING },
              metaDescription: { type: Type.STRING },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              tldr: { type: Type.STRING },
            },
            required: ['slug', 'seoTitle', 'metaDescription', 'keywords', 'tldr'],
          },
        },
      });
    } catch (err: any) {
      lastError = err;
      const errStr = String(err?.message || err || '');
      const isTransient = errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('high demand');
      if (!isTransient) throw err;
    }
  }
  throw lastError || new Error('Gemini metadata generation failed');
}

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, {});
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, {
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST for SEO metadata generation.' },
    });
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return jsonResponse(503, {
      success: false,
      error: {
        code: 'GEMINI_KEY_MISSING',
        message: 'GEMINI_API_KEY is not configured in Netlify Environment Variables.',
      },
    });
  }

  let body: Record<string, any> = {};
  try {
    const raw =
      event.isBase64Encoded && event.body
        ? Buffer.from(event.body, 'base64').toString('utf8')
        : event.body || '{}';
    body = JSON.parse(raw);
  } catch {
    body = {};
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
  } = body;

  if (!title || String(title).trim().length < 2) {
    return jsonResponse(400, {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Title is required before generating SEO metadata.' },
    });
  }

  try {
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
    const parsed = JSON.parse((response.text ?? '{}').trim());

    return jsonResponse(200, {
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
    return jsonResponse(500, {
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: error?.message || 'Failed to generate SEO metadata via Gemini',
      },
    });
  }
};
