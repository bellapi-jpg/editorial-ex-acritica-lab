import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Validação básica de origem - rejeita requests sem referer do próprio domínio
    const origin = req.headers['origin'] ?? req.headers['referer'] ?? '';
    const allowedHost = process.env.ALLOWED_ORIGIN; // ex: "https://acritica-lab.vercel.app"
    if (allowedHost && !origin.startsWith(allowedHost)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });
    }

    const body = req.body ?? {};
    const text: string | undefined = body.text ?? body.prompt;

    if (!text) {
      return res.status(400).json({ error: 'Missing text' });
    }

    const model: string = body.model ?? 'gemini-2.0-flash';
    const genAI = new GoogleGenerativeAI(apiKey);

    // Modo estruturado (optimizeContent)
    if (body.systemInstruction && body.responseSchema) {
      const geminiModel = genAI.getGenerativeModel({
        model,
        systemInstruction: body.systemInstruction,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: body.responseSchema,
        },
      });

      const result = await geminiModel.generateContent(text);
      const response = result.response.text();
      return res.status(200).json(JSON.parse(response));
    }

    // Fallback simples
    const geminiModel = genAI.getGenerativeModel({ model });
    const result = await geminiModel.generateContent(text);
    const response = result.response.text();

    return res.status(200).json({ text: response });

  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Gemini request failed';
    console.error('API /api/gemini error:', message);
    return res.status(500).json({ error: message });
  }
}
