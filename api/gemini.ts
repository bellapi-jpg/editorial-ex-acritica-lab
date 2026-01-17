import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
    }

    const body = req.body ?? {};
    const text: string | undefined = body.text ?? body.prompt;
    if (!text) {
      return res.status(400).json({ error: "Missing text" });
    }

    const model: string = body.model ?? "gemini-2.0-flash";

    const ai = new GoogleGenAI({ apiKey });

    const contents = [{ role: "user", parts: [{ text }] }];

    // quando vier no modo "estruturado" (teu optimizeContent)
    if (body.systemInstruction && body.responseSchema) {
      const resp = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: body.systemInstruction,
          responseMimeType: "application/json",
          responseSchema: body.responseSchema,
        } as any,
      });

      const resultStr = resp.text || "{}";
      return res.status(200).json(JSON.parse(resultStr));
    }

    // fallback simples
    const resp = await ai.models.generateContent({ model, contents });
    return res.status(200).json({ text: resp.text ?? "" });
  } catch (e: any) {
    console.error("API /api/gemini error:", e);
    return res.status(500).json({ error: e?.message ?? "Gemini request failed" });
  }
}
