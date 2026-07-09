"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/components/auth/authProvider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/emptyState";
import { FeedbackBanner } from "@/components/ui/feedbackBanner";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/pageHeader";
import { Surface } from "@/components/ui/surface";
import { Textarea } from "@/components/ui/textarea";
import {
  WorkspaceTabs,
  type WorkspaceTabOption
} from "@/components/ui/workspaceTabs";
import { useCustomers } from "@/hooks/useCustomers";
import { useWorkspaceTabUrlState } from "@/hooks/useWorkspaceTabUrlState";
import {
  buildCustomerCsvContent,
  buildCustomerViewModels,
  buildCustomerWorkbenchRecommendations,
  buildCustomerWorkbenchSummary,
  customerContactFilterOptions,
  customerSortOptions,
  filterCustomerViewModels,
  getDefaultCustomerWorkbenchFilters,
  hasActiveCustomerWorkbenchFilters,
  type CustomerContactFilter,
  type CustomerSortKey
} from "@/lib/customers/workbench";
import type {
  CreateCustomerRequest,
  CustomerResponse,
  UpdateCustomerRequest
} from "@/lib/customers/schemas";

interface CustomerFormValues {
  name: string;
  email: string;
  phone: string;
  document: string;
  notes: string;
}

type CustomerWorkspaceTab = "list" | "form";

const customerWorkspaceTabValues = ["list", "form"] as const;

const customerWorkspaceTabs: Array<{
  value: CustomerWorkspaceTab;
  label: string;
  description: string;
}> = [
  {
    value: "list",
    label: "Lista de clientes",
    description: "Pesquise, selecione e acompanhe a base comercial."
  },
  {
    value: "form",
    label: "Cadastro e edicao",
    description: "Crie ou atualize o cliente ativo com mais foco."
  }
];

const initialFormValues: CustomerFormValues = {
  name: "",
  email: "",
  phone: "",
  document: "",
  notes: ""
};

function mapCustomerToFormValues(
  customer: CustomerResponse | null
): CustomerFormValues {
  if (!customer) {
    return initialFormValues;
  }

  return {
    name: customer.name,
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    document: customer.document ?? "",
    notes: customer.notes ?? ""
  };
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function CustomersPage() {
  const { accessToken, tenant } = useAuthContext();
  const {
    items,
    page,
    pageSize,
    total,
    isLoading,
    error,
    loadCustomers,
    createCustomer,
    getCustomerById,
    updateCustomer
  } = useCustomers(accessToken);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerWorkbenchFilters, setCustomerWorkbenchFilters] = useState(
    getDefaultCustomerWorkbenchFilters
  );
  const [activeCustomerTab, setActiveCustomerTab] =
    useWorkspaceTabUrlState<CustomerWorkspaceTab>({
      defaultValue: "list",
      values: customerWorkspaceTabValues
    });
  const [formValues, setFormValues] = useState<CustomerFormValues>(initialFormValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
    [pageSize, total]
  );
  const customerViewModels = useMemo(() => buildCustomerViewModels(items), [items]);
  const visibleCustomers = useMemo(
    () => filterCustomerViewModels(customerViewModels, customerWorkbenchFilters),
    [customerViewModels, customerWorkbenchFilters]
  );
  const customerWorkbenchSummary = useMemo(
    () =>
      buildCustomerWorkbenchSummary({
        allCustomers: customerViewModels,
        visibleCustomers
      }),
    [customerViewModels, visibleCustomers]
  );
  const customerRecommendations = useMemo(
    () => buildCustomerWorkbenchRecommendations(customerWorkbenchSummary),
    [customerWorkbenchSummary]
  );
  const hasCustomerWorkbenchFilters =
    hasActiveCustomerWorkbenchFilters(customerWorkbenchFilters);
  const formTitle = selectedCustomerId ? "Editar cliente" : "Novo cliente";
  const formDescription = selectedCustomerId
    ? "Atualize os dados do cliente selecionado sem perder o vínculo com o tenant."
    : "Cadastre um novo cliente para usar nos próximos orçamentos.";

  const customerTabsWithCounts = useMemo<
    Array<WorkspaceTabOption<CustomerWorkspaceTab>>
  >(
    () =>
      customerWorkspaceTabs.map((tab) => ({
        ...tab,
        count: tab.value === "list" ? total : selectedCustomerId ? 1 : 0
      })),
    [selectedCustomerId, total]
  );

  /**
   * Recarrega a listagem de clientes considerando paginação e busca ativa.
   */
  const refreshCustomers = useCallback(
    async (nextPage = 1): Promise<void> => {
      await loadCustomers({
        page: nextPage,
        pageSize: 10,
        ...(appliedSearch ? { search: appliedSearch } : {})
      });
    },
    [appliedSearch, loadCustomers]
  );

  useEffect(() => {
    void refreshCustomers();
  }, [refreshCustomers]);

  /**
   * Busca o detalhe de um cliente para preencher o formulário de edição.
   */
  async function handleSelectCustomer(customerId: string): Promise<void> {
    setSubmitMessage(null);
    setSubmitError(null);
    setIsLoadingDetail(true);

    try {
      const customer = await getCustomerById(customerId);
      setSelectedCustomerId(customer.id);
      setFormValues(mapCustomerToFormValues(customer));
      setActiveCustomerTab("form");
    } catch (selectionError: unknown) {
      setSubmitError(
        selectionError instanceof Error
          ? selectionError.message
          : "Falha ao carregar cliente."
      );
    } finally {
      setIsLoadingDetail(false);
    }
  }

  function handleResetForm(): void {
    setSelectedCustomerId(null);
    setFormValues(initialFormValues);
    setSubmitMessage(null);
    setSubmitError(null);
    setActiveCustomerTab("form");
  }

  function handleFormFieldChange(
    field: keyof CustomerFormValues,
    value: string
  ): void {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value
    }));
  }

  function handleCustomerWorkbenchFilterChange(
    field: "contact" | "sort",
    value: CustomerContactFilter | CustomerSortKey
  ): void {
    setCustomerWorkbenchFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value
    }));
  }

  function handleResetCustomerWorkbenchFilters(): void {
    setCustomerWorkbenchFilters(getDefaultCustomerWorkbenchFilters());
  }

  function handleDownloadCustomerCsv(): void {
    const csvContent = buildCustomerCsvContent(visibleCustomers);
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "clientes-filtrados.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleSearchSubmit(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    setAppliedSearch(searchInput.trim());
  }

  async function handleCustomerSubmit(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);
    setSubmitError(null);

    const payloadBase = {
      name: formValues.name.trim(),
      ...(formValues.email.trim() ? { email: formValues.email.trim() } : {}),
      ...(formValues.phone.trim() ? { phone: formValues.phone.trim() } : {}),
      ...(formValues.document.trim()
        ? { document: formValues.document.trim() }
        : {}),
      ...(formValues.notes.trim() ? { notes: formValues.notes.trim() } : {})
    };

    try {
      if (selectedCustomerId) {
        const updatedCustomer = await updateCustomer(
          selectedCustomerId,
          payloadBase as UpdateCustomerRequest
        );

        setSubmitMessage("Cliente atualizado com sucesso.");
        await refreshCustomers(page);
        await handleSelectCustomer(updatedCustomer.id);
        setActiveCustomerTab("list");
      } else {
        const createdCustomer = await createCustomer(
          payloadBase as CreateCustomerRequest
        );

        setSubmitMessage("Cliente criado com sucesso.");
        await refreshCustomers(1);
        setAppliedSearch("");
        setSearchInput("");
        await handleSelectCustomer(createdCustomer.id);
        setActiveCustomerTab("list");
      }
    } catch (submissionError: unknown) {
      setSubmitError(
        submissionError instanceof Error
          ? submissionError.message
          : "Falha ao salvar cliente."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5">
      <PageHeader
        eyebrow="Clientes"
        title="Base de relacionamento do tenant"
        description={`Cadastre, pesquise e atualize clientes do tenant ${tenant?.name} sem sair da área autenticada, aproveitando melhor a área útil da tela.`}
        summary={
          <Surface as="div" variant="subtle" className="h-full p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-strong)]/70">
              Capacidade atual
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--foreground-strong)]">
              {total}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              cliente(s) identificado(s) na consulta corrente.
            </p>
          </Surface>
        }
      />

      <WorkspaceTabs
        activeValue={activeCustomerTab}
        ariaLabel="Navegacao de clientes"
        columnsClassName="md:grid-cols-2"
        onChange={setActiveCustomerTab}
        options={customerTabsWithCounts}
      />

      <div className="grid gap-5">
        <section hidden={activeCustomerTab !== "list"} className="grid gap-5">
          <Surface as="article" variant="default" className="p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--accent-strong)]/80">
                  Consulta
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground-strong)]">
                  Encontre e selecione clientes
                </h2>
              </div>

              <Button variant="secondary" onClick={handleResetForm}>
                Novo cliente
              </Button>
            </div>

            <form
              className="mt-6 flex flex-col gap-3 md:flex-row"
              onSubmit={handleSearchSubmit}
            >
              <Input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar por nome, e-mail ou documento"
                className="flex-1"
              />
              <Button type="submit" size="lg">
                Aplicar busca
              </Button>
            </form>

            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <Field label="Qualidade do contato" htmlFor="customer-contact-filter">
                <select
                  id="customer-contact-filter"
                  value={customerWorkbenchFilters.contact}
                  onChange={(event) =>
                    handleCustomerWorkbenchFilterChange(
                      "contact",
                      event.target.value as CustomerContactFilter
                    )
                  }
                  className="min-h-11 w-full rounded-[1rem] border border-[var(--border)] bg-[var(--surface-secondary)] px-4 text-sm text-[var(--foreground-strong)] outline-none transition focus:border-[var(--border-strong)]"
                >
                  {customerContactFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Ordenacao" htmlFor="customer-sort">
                <select
                  id="customer-sort"
                  value={customerWorkbenchFilters.sort}
                  onChange={(event) =>
                    handleCustomerWorkbenchFilterChange(
                      "sort",
                      event.target.value as CustomerSortKey
                    )
                  }
                  className="min-h-11 w-full rounded-[1rem] border border-[var(--border)] bg-[var(--surface-secondary)] px-4 text-sm text-[var(--foreground-strong)] outline-none transition focus:border-[var(--border-strong)]"
                >
                  {customerSortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="flex flex-col justify-end gap-2 sm:flex-row lg:flex-col xl:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleResetCustomerWorkbenchFilters}
                  disabled={!hasCustomerWorkbenchFilters}
                >
                  Limpar filtros
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDownloadCustomerCsv}
                  disabled={!visibleCustomers.length}
                >
                  Exportar CSV
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Visiveis",
                  value: customerWorkbenchSummary.visibleCustomers,
                  helper: `de ${customerWorkbenchSummary.totalCustomers} na pagina`
                },
                {
                  label: "Com e-mail",
                  value: customerWorkbenchSummary.customersWithEmail,
                  helper: "prontos para follow-up"
                },
                {
                  label: "Com telefone",
                  value: customerWorkbenchSummary.customersWithPhone,
                  helper: "contato direto disponivel"
                },
                {
                  label: "Incompletos",
                  value: customerWorkbenchSummary.incompleteCustomers,
                  helper: "precisam saneamento"
                }
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[1.2rem] border border-[var(--border)] bg-[var(--surface-secondary)] p-4"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent-strong)]/70">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--foreground-strong)]">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{metric.helper}</p>
                </div>
              ))}
            </div>

            {customerRecommendations.length ? (
              <div className="mt-5 rounded-[1.2rem] border border-[var(--border)] bg-[var(--surface-secondary)] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent-strong)]/70">
                  Recomendacoes
                </p>
                <div className="mt-3 grid gap-2">
                  {customerRecommendations.map((recommendation) => (
                    <p
                      key={recommendation}
                      className="rounded-[0.9rem] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--foreground)]"
                    >
                      {recommendation}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {error ? (
              <FeedbackBanner
                className="mt-5"
                description={error}
                title="Falha ao carregar"
                variant="error"
              />
            ) : null}

            <div className="mt-6 grid gap-3">
              {isLoading ? (
                [0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-24 rounded-[1.4rem] border border-[var(--border)] bg-[var(--surface-secondary)]"
                  />
                ))
              ) : visibleCustomers.length ? (
                visibleCustomers.map((customer) => {
                  const isSelected = customer.id === selectedCustomerId;

                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => void handleSelectCustomer(customer.id)}
                      className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
                        isSelected
                          ? "border-[var(--border-strong)] bg-[linear-gradient(135deg,rgba(56,189,248,0.2),rgba(99,102,241,0.14))]"
                          : "border-[var(--border)] bg-[var(--surface-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)]"
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-base font-medium text-[var(--foreground-strong)]">
                            {customer.name}
                          </p>
                          <p className="mt-1 text-sm text-[var(--foreground)]">
                            {customer.emailLabel}
                          </p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            Documento: {customer.documentLabel}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                            {customer.insight}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 text-sm text-[var(--muted)] md:items-end">
                          <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--foreground)]">
                            {customer.contactLabel}
                          </span>
                          <span>Atualizado em {formatDate(customer.updatedAt)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <EmptyState
                  title={
                    items.length
                      ? "Nenhum cliente passa nos filtros locais."
                      : "Nenhum cliente encontrado para os filtros atuais."
                  }
                  description={
                    items.length
                      ? "Limpe os filtros locais ou ajuste a qualidade de contato para ampliar a consulta."
                      : "Ajuste a busca ou abra a aba de cadastro para criar um novo cliente."
                  }
                />
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-[var(--border)] pt-5 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-[var(--muted)]">
                Pagina {page} de {totalPages}
              </p>
              <div className="flex gap-3">
                <Button
                  disabled={page <= 1 || isLoading}
                  onClick={() => void refreshCustomers(page - 1)}
                  variant="secondary"
                >
                  Pagina anterior
                </Button>
                <Button
                  disabled={page >= totalPages || isLoading}
                  onClick={() => void refreshCustomers(page + 1)}
                  variant="secondary"
                >
                  Proxima pagina
                </Button>
              </div>
            </div>
          </Surface>
        </section>

        <section hidden={activeCustomerTab !== "form"} className="grid gap-5">
          <Surface as="article" variant="default" className="p-6">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--accent-strong)]/80">
              {formTitle}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground-strong)]">
              {formTitle}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              {formDescription}
            </p>

            <form className="mt-6 grid gap-4" onSubmit={handleCustomerSubmit}>
              <Field label="Nome" htmlFor="customer-name">
                <Input
                  id="customer-name"
                  type="text"
                  value={formValues.name}
                  onChange={(event) =>
                    handleFormFieldChange("name", event.target.value)
                  }
                  placeholder="Razao social ou nome do contato"
                  required
                />
              </Field>

              <Field label="E-mail" htmlFor="customer-email">
                <Input
                  id="customer-email"
                  type="email"
                  value={formValues.email}
                  onChange={(event) =>
                    handleFormFieldChange("email", event.target.value)
                  }
                  placeholder="contato@cliente.com"
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Telefone" htmlFor="customer-phone">
                  <Input
                    id="customer-phone"
                    type="text"
                    value={formValues.phone}
                    onChange={(event) =>
                      handleFormFieldChange("phone", event.target.value)
                    }
                    placeholder="11999990000"
                  />
                </Field>

                <Field label="Documento" htmlFor="customer-document">
                  <Input
                    id="customer-document"
                    type="text"
                    value={formValues.document}
                    onChange={(event) =>
                      handleFormFieldChange("document", event.target.value)
                    }
                    placeholder="CNPJ ou identificador interno"
                  />
                </Field>
              </div>

              <Field label="Observacoes" htmlFor="customer-notes">
                <Textarea
                  id="customer-notes"
                  value={formValues.notes}
                  onChange={(event) =>
                    handleFormFieldChange("notes", event.target.value)
                  }
                  placeholder="Preferencias comerciais, janelas de contato, alertas internos."
                />
              </Field>

              {isLoadingDetail ? (
                <FeedbackBanner
                  description="Carregando detalhes do cliente selecionado..."
                  title="Sincronizando dados"
                />
              ) : null}

              {submitError ? (
                <FeedbackBanner
                  description={submitError}
                  title="Falha ao salvar"
                  variant="error"
                />
              ) : null}

              {submitMessage ? (
                <FeedbackBanner
                  description={submitMessage}
                  title="Operação concluída"
                  variant="success"
                />
              ) : null}

              <div className="flex flex-col gap-3 md:flex-row">
                <Button
                  type="submit"
                  disabled={isSubmitting || isLoadingDetail}
                  size="lg"
                >
                  {isSubmitting
                    ? "Salvando..."
                    : selectedCustomerId
                      ? "Salvar alteracoes"
                      : "Criar cliente"}
                </Button>
                <Button variant="secondary" size="lg" onClick={handleResetForm}>
                  Limpar formulario
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setActiveCustomerTab("list")}
                >
                  Voltar para lista
                </Button>
              </div>
            </form>
          </Surface>
        </section>
      </div>
    </div>
  );
}
