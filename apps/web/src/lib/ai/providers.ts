import {
  quoteDraftMaxCatalogHints,
  quoteDraftMaxGeneratedItems,
  quoteDraftOutputSchemaVersion,
  quoteDraftPromptVersion,
  quoteDraftSupportedCurrencies,
  type AiQuoteDraftProvider
} from "./quoteDraft";
import { createLocalQuoteDraftProvider } from "./localProvider";
import {
  createGeminiQuoteDraftProvider,
  hasGeminiQuoteDraftConfiguration
} from "./geminiProvider";
import {
  createOpenAiQuoteDraftProvider,
  hasOpenAiQuoteDraftConfiguration
} from "./openaiProvider";

export interface QuoteDraftProviderCapability {
  providerName: string;
  mode: "local" | "external";
  description: string;
  maxCatalogHints: number;
  maxGeneratedItems: number;
}

export interface QuoteDraftProviderCapabilities {
  isEnabled: boolean;
  promptVersion: typeof quoteDraftPromptVersion;
  outputSchemaVersion: typeof quoteDraftOutputSchemaVersion;
  supportedCurrencies: string[];
  providers: QuoteDraftProviderCapability[];
}

function getConfiguredProviderModes(): string[] {
  return (
    process.env.AI_QUOTE_DRAFT_PROVIDER?.split(/[,+\s]+/)
      .map((mode) => mode.trim().toLowerCase())
      .filter(Boolean) ?? []
  );
}

function buildProviderCapability(input: {
  providerName: string;
  mode: QuoteDraftProviderCapability["mode"];
  description: string;
}): QuoteDraftProviderCapability {
  return {
    ...input,
    maxCatalogHints: quoteDraftMaxCatalogHints,
    maxGeneratedItems: quoteDraftMaxGeneratedItems
  };
}

/**
 * Centraliza a montagem dos providers de IA sem inicializar SDKs em module scope.
 */
export function getConfiguredQuoteDraftProviders(): AiQuoteDraftProvider[] {
  const providers: AiQuoteDraftProvider[] = [];

  for (const mode of getConfiguredProviderModes()) {
    if (mode === "openai" && hasOpenAiQuoteDraftConfiguration()) {
      providers.push(createOpenAiQuoteDraftProvider());
      continue;
    }

    if (mode === "gemini" && hasGeminiQuoteDraftConfiguration()) {
      providers.push(createGeminiQuoteDraftProvider());
      continue;
    }

    if (mode === "local") {
      providers.push(createLocalQuoteDraftProvider());
    }
  }

  return providers;
}

/**
 * Expoe quais providers estao disponiveis sem revelar segredos ou configuracao sensivel.
 */
export function getQuoteDraftProviderCapabilities(): QuoteDraftProviderCapabilities {
  const providers: QuoteDraftProviderCapability[] = [];

  for (const mode of getConfiguredProviderModes()) {
    if (mode === "openai" && hasOpenAiQuoteDraftConfiguration()) {
      providers.push(
        buildProviderCapability({
          providerName: "openai",
          mode: "external",
          description: "Provider externo OpenAI para drafts estruturados."
        })
      );
      continue;
    }

    if (mode === "gemini" && hasGeminiQuoteDraftConfiguration()) {
      providers.push(
        buildProviderCapability({
          providerName: "gemini",
          mode: "external",
          description: "Provider externo Gemini para drafts estruturados."
        })
      );
      continue;
    }

    if (mode === "local") {
      providers.push(
        buildProviderCapability({
          providerName: "local-deterministic",
          mode: "local",
          description: "Provider deterministico para desenvolvimento e demos."
        })
      );
    }
  }

  return {
    isEnabled: providers.length > 0,
    promptVersion: quoteDraftPromptVersion,
    outputSchemaVersion: quoteDraftOutputSchemaVersion,
    supportedCurrencies: [...quoteDraftSupportedCurrencies],
    providers
  };
}
