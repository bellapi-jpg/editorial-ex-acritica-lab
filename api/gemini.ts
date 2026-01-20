import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
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

    const model: string = body.model ?? 'gemini-2.0-flash-exp';
    const genAI = new GoogleGenerativeAI(apiKey);

    // Modo estruturado (seu optimizeContent)
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
    
  } catch (e: any) {
    console.error('API /api/gemini error:', e);
    return res.status(500).json({ error: e?.message ?? 'Gemini request failed' });
  }
}
