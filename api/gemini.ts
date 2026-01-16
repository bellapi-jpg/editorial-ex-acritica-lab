import { GoogleGenAI, Type } from "@google/genai";

function json(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const toType = (t: string) => {
  switch (t) {
    case "OBJECT":
      return Type.OBJECT;
    case "STRING":
      return Type.STRING;
    default:
      return Type.STRING;
  }
};

const convertSchema = (s: any): any => {
  const out: any = { ...s, type: toType(s.type) };

  if (s.properties) {
    out.properties = Object.fromEntries(
      Object.entries(s.properties).map(([k, v]: any) => [k, convertSchema(v)])
    );
  }

  return out;
};

export default async function handler(req: Request) {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json(500, { error: "Missing GEMINI_API_KEY" });

  const body = await req.json().catch(() => ({}));

  // suporta os 2 jeitos: optimizeContentViaApi (text/tone/...) e runGeminiViaApi (prompt)
  const promptText: string | undefined = body.text ?? body.prompt;
  if (!promptText) return json(400, { error: "Missing text/prompt" });

  const model: string = body.model ?? "gemini-2.0-flash";

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Se vier schema+systemInstruction, devolve JSON estruturado (seu caso principal)
    if (body.systemInstruction && body.responseSchema) {
      const response = await ai.models.generateContent({
        model,
        contents: promptText,
        config: {
          systemInstruction: body.systemInstruction,
          responseMimeType: "application/json",
          responseSchema: convertSchema(body.responseSchema),
        },
      });

      const resultStr = response.text || "{}";
      return json(200, JSON.parse(resultStr));
    }

    // fallback simples (pra prompt puro)
    const resp = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: promptText }] }],
    });

    return json(200, { text: resp.text ?? "" });
  } catch (e: any) {
    return json(500, { error: e?.message ?? "Gemini request failed" });
  }
}
