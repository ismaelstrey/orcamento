import type { AiQuoteDraftProvider } from "./quoteDraft";
import { createLocalQuoteDraftProvider } from "./localProvider";

/**
 * Centraliza a montagem dos providers de IA sem inicializar SDKs em module scope.
 */
export function getConfiguredQuoteDraftProviders(): AiQuoteDraftProvider[] {
  if (process.env.AI_QUOTE_DRAFT_PROVIDER === "local") {
    return [createLocalQuoteDraftProvider()];
  }

  return [];
}
