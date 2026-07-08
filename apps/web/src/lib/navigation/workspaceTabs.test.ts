import { describe, expect, it } from "vitest";
import {
  buildWorkspaceTabHref,
  resolveWorkspaceTabValue
} from "./workspaceTabs";

const quoteTabs = ["list", "import", "ai", "create"] as const;

describe("navigation/workspaceTabs", () => {
  it("resolve a aba ativa a partir de um valor permitido na query string", () => {
    expect(
      resolveWorkspaceTabValue({
        defaultValue: "list",
        searchParams: "tab=ai",
        values: quoteTabs
      })
    ).toBe("ai");
  });

  it("retorna a aba padrao quando a query string tem valor invalido", () => {
    expect(
      resolveWorkspaceTabValue({
        defaultValue: "list",
        searchParams: "tab=unknown",
        values: quoteTabs
      })
    ).toBe("list");
  });

  it("remove o parametro quando a aba selecionada volta para o valor padrao", () => {
    expect(
      buildWorkspaceTabHref({
        defaultValue: "list",
        pathname: "/quotes",
        searchParams: "tab=ai",
        value: "list",
        values: quoteTabs
      })
    ).toBe("/quotes");
  });

  it("preserva parametros existentes ao trocar a aba", () => {
    expect(
      buildWorkspaceTabHref({
        defaultValue: "list",
        pathname: "/quotes",
        searchParams: "quoteId=q_123&tab=list",
        value: "import",
        values: quoteTabs
      })
    ).toBe("/quotes?quoteId=q_123&tab=import");
  });

  it("aceita um nome de parametro customizado", () => {
    expect(
      buildWorkspaceTabHref({
        defaultValue: "products",
        paramName: "section",
        pathname: "/catalog",
        searchParams: "section=brands&tenant=bootstrap",
        value: "categories",
        values: ["products", "categories", "brands"] as const
      })
    ).toBe("/catalog?section=categories&tenant=bootstrap");
  });
});
