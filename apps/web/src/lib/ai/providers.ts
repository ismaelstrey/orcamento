import {
  quoteDraftOutputSchemaVersion,
  quoteDraftPromptVersion,
  type AiQuoteDraftProvider
} from "./quoteDraft";
import { createLocalQuoteDraftProvider } from "./localProvider";

export interface QuoteDraftProviderCapability {
  providerName: string;
  mode: "local" | "external";
  description: string;
}

export interface QuoteDraftProviderCapabilities {
  isEnabled: boolean;
  promptVersion: typeof quoteDraftPromptVersion;
  outputSchemaVersion: typeof quoteDraftOutputSchemaVersion;
  providers: QuoteDraftProviderCapability[];
}

function getConfiguredProviderMode(): string {
  return process.env.AI_QUOTE_DRAFT_PROVIDER?.trim().toLowerCase() ?? "";
}

/**
 * Centraliza a montagem dos providers de IA sem inicializar SDKs em module scope.
 */
export function getConfiguredQuoteDraftProviders(): AiQuoteDraftProvider[] {
  if (getConfiguredProviderMode() === "local") {
    return [createLocalQuoteDraftProvider()];
  }

  return [];
}

/**
 * Expõe quais providers estão disponíveis sem revelar segredos ou configuração sensível.
 */
export function getQuoteDraftProviderCapabilities(): QuoteDraftProviderCapabilities {
  if (getConfiguredProviderMode() === "local") {
    return {
      isEnabled: true,
      promptVersion: quoteDraftPromptVersion,
      outputSchemaVersion: quoteDraftOutputSchemaVersion,
      providers: [
        {
          providerName: "local-deterministic",
          mode: "local",
          description: "Provider determinístico para desenvolvimento e demos."
        }
      ]
    };
  }

  return {
    isEnabled: false,
    promptVersion: quoteDraftPromptVersion,
    outputSchemaVersion: quoteDraftOutputSchemaVersion,
    providers: []
  };
}
