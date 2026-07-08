import { describe, expect, it } from "vitest";
import { AiDraftGenerationError } from "@/lib/ai/service";
import { toErrorResponse } from "./errors";

describe("api/errors", () => {
  it("mapeia falha de provider de IA para indisponibilidade temporaria", () => {
    expect(
      toErrorResponse(
        new AiDraftGenerationError(
          "provider_error",
          "Nenhum provider de IA configurado para gerar draft."
        )
      )
    ).toEqual({
      status: 503,
      body: {
        error: "provider_error",
        details: {
          message: "Nenhum provider de IA configurado para gerar draft."
        }
      }
    });
  });

  it("mapeia saida invalida de IA para falha de gateway", () => {
    expect(
      toErrorResponse(
        new AiDraftGenerationError(
          "invalid_provider_output",
          "Provider retornou um draft incompatível com o schema versionado."
        )
      )
    ).toEqual({
      status: 502,
      body: {
        error: "invalid_provider_output",
        details: {
          message: "Provider retornou um draft incompatível com o schema versionado."
        }
      }
    });
  });
});
