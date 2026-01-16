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

  const { prompt } = await req.json().catch(() => ({}));
  if (!prompt) return json(400, { error: "Missing prompt" });

  try {
    const ai = new GoogleGenAI({ apiKey });

    const resp = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return json(200, { text: resp.text ?? "" });
  } catch (e: any) {
    return json(500, { error: e?.message ?? "Gemini request failed" });
  }
}
