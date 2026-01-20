import { OptimizationResult, EditorialTone } from "./types";

const getSystemInstruction = (tone: EditorialTone) => {
  let toneInstruction = "";
  if (tone === 'COLD') {
    toneInstruction = "ESTILO EDITORIAL: FRIO. O foco é a sobriedade máxima. Títulos diretos, factuais, sem adjetivos. Ideal para notícias jurídicas, falecimentos ou comunicados oficiais.";
  } else if (tone === 'HOT') {
    toneInstruction = "ESTILO EDITORIAL: QUENTE. O foco é o engajamento e a curiosidade. Use palavras de impacto, destaque o benefício ou a surpresa para o leitor. Use gatilhos mentais de curiosidade sem mentir.";
  } else {
    toneInstruction = "ESTILO EDITORIAL: EQUILIBRADO. O padrão ouro do Acritica.com. Informativo, profissional e com SEO refinado para o Google News.";
  }

  return `Você é o Coordenador de IA do portal Acritica.com.
Sua missão é otimizar rascunhos jornalísticos para performance digital máxima.

DIRETRIZES TÉCNICAS:
${toneInstruction}

Para cada campo (Título, Linha Fina, Primeiro Parágrafo), gere um 'insight' (uma pílula de conhecimento) em PORTUGUÊS explicando a lógica por trás da sugestão. Exemplos: lógica de algoritmo, psicologia do clique, regras de escaneabilidade ou SEO.

# REGRAS DE OURO:
- TÍTULO: Máximo 80 caracteres (ideal entre 50-70).
- INSIGHTS: Devem ser rápidos, inteligentes e educativos.
- CONTEÚDO: Nunca invente informações. Use apenas o rascunho fornecido.`;
};

export const optimizeContent = async (text: string, tone: EditorialTone): Promise<OptimizationResult> => {
  // roda via Vercel function (/api/gemini) — mantém seu prompt e schema intactos
  const payload = {
    text,
    tone,
    model: "gemini-pro",
    systemInstruction: getSystemInstruction(tone),
    responseSchema: {
      type: "OBJECT",
      properties: {
        titulo: { type: "STRING" },
        tituloInsight: {
          type: "OBJECT",
          properties: {
            text: { type: "STRING" },
            category: { type: "STRING", enum: ["SEO", "ALGORITHM", "PSYCHOLOGY", "STRUCTURE"] },
          },
          required: ["text", "category"],
        },
        linhaFina: { type: "STRING" },
        linhaFinaInsight: {
          type: "OBJECT",
          properties: {
            text: { type: "STRING" },
            category: { type: "STRING" },
          },
          required: ["text", "category"],
        },
        primeiroParagrafo: { type: "STRING" },
        primeiroParagrafoInsight: {
          type: "OBJECT",
          properties: {
            text: { type: "STRING" },
            category: { type: "STRING" },
          },
          required: ["text", "category"],
        },
      },
      required: ["titulo", "tituloInsight", "linhaFina", "linhaFinaInsight", "primeiroParagrafo", "primeiroParagrafoInsight"],
    },
  };

  const r = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error || "Gemini failed");

  return data as OptimizationResult;
};

// deixa aqui se você ainda usa em algum lugar
export async function runGeminiViaApi(prompt: string) {
  const r = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error || "Gemini failed");

  return data.text as string;
}
