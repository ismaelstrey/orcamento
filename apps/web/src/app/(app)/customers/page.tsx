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
import { useCustomers } from "@/hooks/useCustomers";
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
  const [activeCustomerTab, setActiveCustomerTab] =
    useState<CustomerWorkspaceTab>("list");
  const [formValues, setFormValues] = useState<CustomerFormValues>(initialFormValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
    [pageSize, total]
  );
  const formTitle = selectedCustomerId ? "Editar cliente" : "Novo cliente";
  const formDescription = selectedCustomerId
    ? "Atualize os dados do cliente selecionado sem perder o vínculo com o tenant."
    : "Cadastre um novo cliente para usar nos próximos orçamentos.";

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

      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-2">
        <div
          role="tablist"
          aria-label="Navegacao de clientes"
          className="grid gap-2 md:grid-cols-2"
        >
          {customerWorkspaceTabs.map((tab) => {
            const isActive = activeCustomerTab === tab.value;
            const count = tab.value === "list" ? total : selectedCustomerId ? 1 : 0;

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCustomerTab(tab.value)}
                className={`rounded-[1.35rem] border px-4 py-3 text-left transition ${
                  isActive
                    ? "border-[var(--border-strong)] bg-[linear-gradient(135deg,rgba(56,189,248,0.18),rgba(99,102,241,0.12))] text-[var(--foreground-strong)]"
                    : "border-transparent bg-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
                }`}
              >
                <span className="flex items-center justify-between gap-3 text-sm font-semibold">
                  {tab.label}
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] px-2 py-0.5 font-mono text-[11px] text-[var(--accent)]">
                    {count}
                  </span>
                </span>
                <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                  {tab.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

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
              ) : items.length ? (
                items.map((customer) => {
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
                            {customer.email ?? "Sem e-mail informado"}
                          </p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            Documento: {customer.document ?? "Nao informado"}
                          </p>
                        </div>
                        <div className="text-sm text-[var(--muted)]">
                          Atualizado em {formatDate(customer.updatedAt)}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <EmptyState
                  title="Nenhum cliente encontrado para os filtros atuais."
                  description="Ajuste a busca ou abra a aba de cadastro para criar um novo cliente."
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
