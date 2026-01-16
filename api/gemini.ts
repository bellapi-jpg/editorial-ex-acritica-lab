import { GoogleGenAI } from "@google/genai";

function json(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async function handler(req: Request) {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json(500, { error: "Missing GEMINI_API_KEY" });

  const body = await req.json().catch(() => ({}));

  const text: string | undefined = body.text ?? body.prompt;
  if (!text) return json(400, { error: "Missing text" });

  const systemInstruction: string | undefined = body.systemInstruction;
  const schema = body.responseSchema;
  const model: string = body.model ?? "gemini-2.0-flash";

  try {
    const ai = new GoogleGenAI({ apiKey });

    const contents = [{ role: "user", parts: [{ text }] }];

    // Caso estruturado (seu optimizeContent)
    if (systemInstruction && schema) {
      const resp = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          // manda o schema como veio (sem converter Type.*)
          responseSchema: schema,
        } as any,
      });

      const resultStr = resp.text || "{}";
      return json(200, JSON.parse(resultStr));
    }

    // Fallback simples (runGeminiViaApi)
    const resp = await ai.models.generateContent({ model, contents });
    return json(200, { text: resp.text ?? "" });
  } catch (e: any) {
    return json(500, { error: e?.message ?? "Gemini request failed" });
  }
}
