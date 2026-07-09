import { describe, expect, it } from "vitest";
import {
  buildAiDraftBudgetInsight,
  buildAiDraftPromptExcerpt,
  buildAiDraftPromptMetrics,
  buildAiDraftWorkbench,
  parseAiDraftBudgetInput
} from "./workbench";

const readyInput = {
  customerId: "cus_1",
  userText:
    "Preciso de tres notebooks corporativos para equipe comercial em visitas externas, com SSD, boa bateria, garantia comercial e entrega ainda nesta semana.",
  budgetMaxCents: "12.000,00",
  hasProvider: true,
  isLoadingCapabilities: false,
  capabilitiesError: null,
  customerCount: 3,
  productCount: 12
};

describe("ai/workbench", () => {
  it("normaliza budget digitado em formatos brasileiros e internacionais", () => {
    expect(parseAiDraftBudgetInput("12000,00")).toBe(1200000);
    expect(parseAiDraftBudgetInput("12.000,00")).toBe(1200000);
    expect(parseAiDraftBudgetInput("12000.00")).toBe(1200000);
    expect(parseAiDraftBudgetInput("R$ 12,50")).toBe(1250);
    expect(parseAiDraftBudgetInput("")).toBeNull();
  });

  it("marca budget invalido sem confundir com campo opcional vazio", () => {
    expect(buildAiDraftBudgetInsight("").state).toBe("missing");
    expect(buildAiDraftBudgetInsight("-10").state).toBe("invalid");
    expect(buildAiDraftBudgetInsight("abc").state).toBe("invalid");
  });

  it("extrai metricas de briefing que a UI usa para orientar o usuario", () => {
    const metrics = buildAiDraftPromptMetrics(readyInput.userText);

    expect(metrics.words).toBeGreaterThanOrEqual(18);
    expect(metrics.hasQuantitySignal).toBe(true);
    expect(metrics.hasUseCaseSignal).toBe(true);
    expect(metrics.hasConstraintSignal).toBe(true);
    expect(metrics.hasUrgencySignal).toBe(true);
    expect(metrics.densityLabel).toMatch(/Briefing/);
  });

  it("gera workbench pronto quando provider, cliente e briefing estao coerentes", () => {
    const workbench = buildAiDraftWorkbench(readyInput);

    expect(workbench.readiness.tone).toBe("success");
    expect(workbench.readiness.score).toBeGreaterThanOrEqual(82);
    expect(workbench.readiness.blockers).toEqual([]);
    expect(workbench.budget.valueInCents).toBe(1200000);
    expect(workbench.preview.catalogHintsLabel).toBe(
      "12 pista(s) enviadas de 12 produto(s)"
    );
    expect(workbench.checklist.every((item) => item.status !== "blocked")).toBe(
      true
    );
  });

  it("bloqueia geracao quando provider esta ausente ou briefing e curto", () => {
    const workbench = buildAiDraftWorkbench({
      ...readyInput,
      customerId: "",
      userText: "notebook",
      budgetMaxCents: "abc",
      hasProvider: false,
      customerCount: 1,
      productCount: 0
    });

    expect(workbench.readiness.tone).toBe("danger");
    expect(workbench.readiness.blockers).toEqual([
      "Nenhum provider de IA ativo para gerar o draft.",
      "Selecione o cliente que recebera o orcamento.",
      "Descreva o briefing com pelo menos 10 palavras.",
      "Corrija o budget maximo ou deixe o campo vazio."
    ]);
    expect(workbench.checklist.filter((item) => item.status === "blocked")).toHaveLength(
      5
    );
    expect(workbench.suggestions.map((suggestion) => suggestion.id)).toContain(
      "add-context"
    );
  });

  it("mantem estado neutro enquanto capacidades ainda estao carregando", () => {
    const workbench = buildAiDraftWorkbench({
      ...readyInput,
      hasProvider: false,
      isLoadingCapabilities: true
    });

    expect(workbench.readiness.tone).toBe("muted");
    expect(workbench.readiness.label).toBe("Verificando provider");
    expect(workbench.checklist.find((item) => item.id === "provider")?.status).toBe(
      "warning"
    );
  });

  it("inclui sugestoes acionaveis quando faltam sinais comerciais", () => {
    const workbench = buildAiDraftWorkbench({
      ...readyInput,
      userText:
        "Preciso avaliar computadores para uma compra futura da empresa.",
      budgetMaxCents: ""
    });

    expect(workbench.suggestions.map((suggestion) => suggestion.id)).toEqual([
      "add-context",
      "add-quantity",
      "add-constraints",
      "add-budget"
    ]);
  });

  it("resume briefing longo sem quebrar visualizacao compacta", () => {
    const excerpt = buildAiDraftPromptExcerpt("A".repeat(220));

    expect(excerpt).toHaveLength(160);
    expect(excerpt.endsWith("...")).toBe(true);
  });
});
