import { buildQuoteDraftPrompt, type AiQuoteDraftRequest } from "./quoteDraft";

export interface ExternalQuoteDraftPromptPayload {
  system: string;
  user: string;
}

export function buildExternalQuoteDraftPrompt(
  input: AiQuoteDraftRequest
): ExternalQuoteDraftPromptPayload {
  const prompt = buildQuoteDraftPrompt(input);

  return {
    system: [
      prompt.system,
      "O JSON deve ser puro, sem markdown, sem comentarios e sem texto antes ou depois.",
      "Use exatamente schemaVersion ai.quote_draft.v1."
    ].join("\n"),
    user: prompt.user
  };
}

export function parseExternalJsonResponse(input: string): unknown {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    throw new Error("Provider retornou resposta vazia.");
  }

  try {
    return JSON.parse(trimmedInput);
  } catch {
    const fencedMatch = trimmedInput.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

    if (fencedMatch?.[1]) {
      return JSON.parse(fencedMatch[1]);
    }

    const firstBrace = trimmedInput.indexOf("{");
    const lastBrace = trimmedInput.lastIndexOf("}");

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(trimmedInput.slice(firstBrace, lastBrace + 1));
    }

    throw new Error("Provider retornou uma resposta que nao parece JSON.");
  }
}

export function estimateCostCents(input: {
  promptTokens?: number | undefined;
  completionTokens?: number | undefined;
  inputCostCentsPer1k?: number | undefined;
  outputCostCentsPer1k?: number | undefined;
}): number | undefined {
  if (
    input.promptTokens === undefined ||
    input.completionTokens === undefined ||
    input.inputCostCentsPer1k === undefined ||
    input.outputCostCentsPer1k === undefined
  ) {
    return undefined;
  }

  return Math.ceil(
    (input.promptTokens / 1000) * input.inputCostCentsPer1k +
      (input.completionTokens / 1000) * input.outputCostCentsPer1k
  );
}

export function readOptionalNumberEnv(name: string): number | undefined {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return undefined;
  }

  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) && parsedValue >= 0
    ? parsedValue
    : undefined;
}
