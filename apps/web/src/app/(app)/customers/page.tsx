"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/components/auth/authProvider";
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
      } else {
        const createdCustomer = await createCustomer(
          payloadBase as CreateCustomerRequest
        );

        setSubmitMessage("Cliente criado com sucesso.");
        await refreshCustomers(1);
        setAppliedSearch("");
        setSearchInput("");
        await handleSelectCustomer(createdCustomer.id);
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
      <header className="flex flex-col gap-5 rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.32em] text-sky-200">
            Clientes
          </span>
          <h1 className="mt-4 text-4xl leading-tight tracking-tight text-white">
            Base de relacionamento do tenant
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            Cadastre, pesquise e atualize clientes do tenant {tenant?.name} sem
            sair da área autenticada.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-200">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-sky-200/70">
            Capacidade atual
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">{total}</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            cliente(s) identificado(s) na consulta corrente.
          </p>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="grid gap-5">
          <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
                  Consulta
                </p>
                <h2 className="mt-3 text-2xl text-white">
                  Encontre e selecione clientes
                </h2>
              </div>

              <button
                type="button"
                onClick={handleResetForm}
                className="inline-flex w-fit rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Novo cliente
              </button>
            </div>

            <form className="mt-6 flex flex-col gap-3 md:flex-row" onSubmit={handleSearchSubmit}>
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar por nome, e-mail ou documento"
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
              />
              <button
                type="submit"
                className="inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-5 py-3 font-medium text-sky-100 transition hover:bg-sky-400/20"
              >
                Aplicar busca
              </button>
            </form>

            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            <div className="mt-6 grid gap-3">
              {isLoading ? (
                [0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-24 rounded-2xl border border-white/10 bg-white/5"
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
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        isSelected
                          ? "border-sky-300/30 bg-sky-400/15"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-base font-medium text-white">
                            {customer.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-300">
                            {customer.email ?? "Sem e-mail informado"}
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            Documento: {customer.document ?? "Nao informado"}
                          </p>
                        </div>
                        <div className="text-sm text-slate-400">
                          Atualizado em {formatDate(customer.updatedAt)}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6">
                  <p className="text-base text-white">
                    Nenhum cliente encontrado para os filtros atuais.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Ajuste a busca ou cadastre um novo cliente ao lado.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-300">
                Pagina {page} de {totalPages}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={page <= 1 || isLoading}
                  onClick={() => void refreshCustomers(page - 1)}
                  className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Pagina anterior
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => void refreshCustomers(page + 1)}
                  className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Proxima pagina
                </button>
              </div>
            </div>
          </article>
        </section>

        <aside className="grid gap-5">
          <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
              {formTitle}
            </p>
            <h2 className="mt-3 text-2xl text-white">{formTitle}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              {formDescription}
            </p>

            <form className="mt-6 grid gap-4" onSubmit={handleCustomerSubmit}>
              <label className="grid gap-2 text-sm text-slate-200">
                <span>Nome</span>
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(event) =>
                    handleFormFieldChange("name", event.target.value)
                  }
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                  placeholder="Razao social ou nome do contato"
                  required
                />
              </label>

              <label className="grid gap-2 text-sm text-slate-200">
                <span>E-mail</span>
                <input
                  type="email"
                  value={formValues.email}
                  onChange={(event) =>
                    handleFormFieldChange("email", event.target.value)
                  }
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                  placeholder="contato@cliente.com"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-200">
                  <span>Telefone</span>
                  <input
                    type="text"
                    value={formValues.phone}
                    onChange={(event) =>
                      handleFormFieldChange("phone", event.target.value)
                    }
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                    placeholder="11999990000"
                  />
                </label>

                <label className="grid gap-2 text-sm text-slate-200">
                  <span>Documento</span>
                  <input
                    type="text"
                    value={formValues.document}
                    onChange={(event) =>
                      handleFormFieldChange("document", event.target.value)
                    }
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                    placeholder="CNPJ ou identificador interno"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm text-slate-200">
                <span>Observacoes</span>
                <textarea
                  value={formValues.notes}
                  onChange={(event) =>
                    handleFormFieldChange("notes", event.target.value)
                  }
                  className="min-h-32 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                  placeholder="Preferencias comerciais, janelas de contato, alertas internos."
                />
              </label>

              {isLoadingDetail ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  Carregando detalhes do cliente selecionado...
                </div>
              ) : null}

              {submitError ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {submitError}
                </div>
              ) : null}

              {submitMessage ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
                  {submitMessage}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 md:flex-row">
                <button
                  type="submit"
                  disabled={isSubmitting || isLoadingDetail}
                  className="inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-5 py-3 font-medium text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Salvando..."
                    : selectedCustomerId
                      ? "Salvar alteracoes"
                      : "Criar cliente"}
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="inline-flex rounded-full border border-white/10 bg-white/10 px-5 py-3 font-medium text-white transition hover:bg-white/15"
                >
                  Limpar formulario
                </button>
              </div>
            </form>
          </article>
        </aside>
      </div>
    </div>
  );
}
