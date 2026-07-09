import type { CustomerResponse } from "./schemas";

export type CustomerContactFilter =
  | "all"
  | "with_email"
  | "with_phone"
  | "with_document"
  | "incomplete";

export type CustomerSortKey = "updated_desc" | "name_asc" | "created_desc";

export interface CustomerWorkbenchFilters {
  contact: CustomerContactFilter;
  sort: CustomerSortKey;
}

export interface CustomerViewModel {
  id: string;
  name: string;
  emailLabel: string;
  phoneLabel: string;
  documentLabel: string;
  contactScore: number;
  contactLabel: string;
  insight: string;
  createdAt: string;
  updatedAt: string;
  searchText: string;
}

export interface CustomerWorkbenchSummary {
  totalCustomers: number;
  visibleCustomers: number;
  customersWithEmail: number;
  customersWithPhone: number;
  customersWithDocument: number;
  incompleteCustomers: number;
}

export const customerContactFilterOptions: Array<{
  value: CustomerContactFilter;
  label: string;
}> = [
  { value: "all", label: "Todos" },
  { value: "with_email", label: "Com e-mail" },
  { value: "with_phone", label: "Com telefone" },
  { value: "with_document", label: "Com documento" },
  { value: "incomplete", label: "Dados incompletos" }
];

export const customerSortOptions: Array<{ value: CustomerSortKey; label: string }> = [
  { value: "updated_desc", label: "Atualizados recentemente" },
  { value: "name_asc", label: "Nome A-Z" },
  { value: "created_desc", label: "Criados recentemente" }
];

export function getDefaultCustomerWorkbenchFilters(): CustomerWorkbenchFilters {
  return {
    contact: "all",
    sort: "updated_desc"
  };
}

function normalizeSearchToken(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function buildContactScore(customer: CustomerResponse): number {
  return [
    customer.email?.trim(),
    customer.phone?.trim(),
    customer.document?.trim()
  ].filter(Boolean).length;
}

function buildContactLabel(score: number): string {
  if (score >= 3) {
    return "Contato completo";
  }

  if (score === 2) {
    return "Contato parcial";
  }

  if (score === 1) {
    return "Contato minimo";
  }

  return "Sem contato";
}

function buildCustomerInsight(customer: CustomerResponse, contactScore: number): string {
  const missingFields = [
    customer.email ? null : "e-mail",
    customer.phone ? null : "telefone",
    customer.document ? null : "documento"
  ].filter(Boolean);

  if (!missingFields.length) {
    return "Cadastro pronto para uso comercial e identificacao do cliente.";
  }

  if (contactScore === 0) {
    return "Complete dados de contato antes de iniciar novos orcamentos.";
  }

  return `Completar ${missingFields.join(", ")} aumenta a qualidade da base.`;
}

export function buildCustomerViewModel(customer: CustomerResponse): CustomerViewModel {
  const contactScore = buildContactScore(customer);
  const emailLabel = customer.email?.trim() || "Sem e-mail informado";
  const phoneLabel = customer.phone?.trim() || "Sem telefone";
  const documentLabel = customer.document?.trim() || "Documento nao informado";

  return {
    id: customer.id,
    name: customer.name,
    emailLabel,
    phoneLabel,
    documentLabel,
    contactScore,
    contactLabel: buildContactLabel(contactScore),
    insight: buildCustomerInsight(customer, contactScore),
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    searchText: [
      customer.name,
      customer.email ?? "",
      customer.phone ?? "",
      customer.document ?? "",
      customer.notes ?? ""
    ]
      .map(normalizeSearchToken)
      .join(" ")
  };
}

export function buildCustomerViewModels(
  customers: CustomerResponse[]
): CustomerViewModel[] {
  return customers.map(buildCustomerViewModel);
}

export function sortCustomerViewModels(
  customers: CustomerViewModel[],
  sort: CustomerSortKey
): CustomerViewModel[] {
  return [...customers].sort((left, right) => {
    if (sort === "name_asc") {
      return left.name.localeCompare(right.name, "pt-BR");
    }

    if (sort === "created_desc") {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

export function filterCustomerViewModels(
  customers: CustomerViewModel[],
  filters: CustomerWorkbenchFilters
): CustomerViewModel[] {
  const filteredCustomers = customers.filter((customer) => {
    if (filters.contact === "with_email") {
      return customer.emailLabel !== "Sem e-mail informado";
    }

    if (filters.contact === "with_phone") {
      return customer.phoneLabel !== "Sem telefone";
    }

    if (filters.contact === "with_document") {
      return customer.documentLabel !== "Documento nao informado";
    }

    if (filters.contact === "incomplete") {
      return customer.contactScore < 3;
    }

    return true;
  });

  return sortCustomerViewModels(filteredCustomers, filters.sort);
}

export function buildCustomerWorkbenchSummary(input: {
  allCustomers: CustomerViewModel[];
  visibleCustomers: CustomerViewModel[];
}): CustomerWorkbenchSummary {
  return {
    totalCustomers: input.allCustomers.length,
    visibleCustomers: input.visibleCustomers.length,
    customersWithEmail: input.visibleCustomers.filter(
      (customer) => customer.emailLabel !== "Sem e-mail informado"
    ).length,
    customersWithPhone: input.visibleCustomers.filter(
      (customer) => customer.phoneLabel !== "Sem telefone"
    ).length,
    customersWithDocument: input.visibleCustomers.filter(
      (customer) => customer.documentLabel !== "Documento nao informado"
    ).length,
    incompleteCustomers: input.visibleCustomers.filter(
      (customer) => customer.contactScore < 3
    ).length
  };
}

export function hasActiveCustomerWorkbenchFilters(
  filters: CustomerWorkbenchFilters
): boolean {
  const defaults = getDefaultCustomerWorkbenchFilters();

  return filters.contact !== defaults.contact || filters.sort !== defaults.sort;
}

export function buildCustomerWorkbenchRecommendations(
  summary: CustomerWorkbenchSummary
): string[] {
  const recommendations: string[] = [];

  if (summary.incompleteCustomers > 0) {
    recommendations.push(
      `${summary.incompleteCustomers} cliente(s) visivel(is) precisam de dados complementares.`
    );
  }

  if (summary.visibleCustomers > 0 && summary.customersWithEmail === 0) {
    recommendations.push("Nenhum cliente visivel possui e-mail cadastrado.");
  }

  if (summary.visibleCustomers > 0 && summary.customersWithDocument === 0) {
    recommendations.push("Cadastre documentos para melhorar identificacao comercial.");
  }

  return recommendations.slice(0, 3);
}

function escapeCsvCell(value: string | number): string {
  const normalizedValue = String(value);

  if (!/[",\n]/.test(normalizedValue)) {
    return normalizedValue;
  }

  return `"${normalizedValue.replace(/"/g, '""')}"`;
}

export function buildCustomerCsvContent(customers: CustomerViewModel[]): string {
  const header = [
    "id",
    "nome",
    "email",
    "telefone",
    "documento",
    "qualidade_contato",
    "atualizado_em"
  ];
  const rows = customers.map((customer) => [
    customer.id,
    customer.name,
    customer.emailLabel,
    customer.phoneLabel,
    customer.documentLabel,
    customer.contactLabel,
    customer.updatedAt
  ]);

  return [header, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");
}
