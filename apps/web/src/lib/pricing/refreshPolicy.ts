import type { PersistedProductOfferInput } from "./persistence";

export type PricingRefreshPriority = "low" | "medium" | "high";

export interface PricingRefreshTask {
  offerId: string;
  productId: string;
  storeId: string;
  priority: PricingRefreshPriority;
  reason: string;
}

export interface PricingRefreshPolicySummary {
  freshnessPercent: number;
  taskCount: number;
  highPriorityCount: number;
  tasks: PricingRefreshTask[];
  nextRunLabel: string;
  recommendations: string[];
}

function daysBetween(left: Date, right: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;

  return Math.floor((left.getTime() - right.getTime()) / msPerDay);
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildTask(input: {
  offer: PersistedProductOfferInput;
  now: Date;
  maxAgeDays: number;
  expireWarningDays: number;
}): PricingRefreshTask | null {
  const observedAt = new Date(input.offer.observedAt);
  const ageDays = daysBetween(input.now, observedAt);

  if (input.offer.expiresAt) {
    const expiresAt = new Date(input.offer.expiresAt);
    const daysUntilExpire = daysBetween(expiresAt, input.now);

    if (daysUntilExpire < 0) {
      return {
        offerId: input.offer.id,
        productId: input.offer.productId,
        storeId: input.offer.storeId,
        priority: "high",
        reason: "Oferta expirada precisa de nova referencia."
      };
    }

    if (daysUntilExpire <= input.expireWarningDays) {
      return {
        offerId: input.offer.id,
        productId: input.offer.productId,
        storeId: input.offer.storeId,
        priority: "medium",
        reason: `Oferta expira em ${daysUntilExpire} dia(s).`
      };
    }
  }

  if (ageDays > input.maxAgeDays) {
    return {
      offerId: input.offer.id,
      productId: input.offer.productId,
      storeId: input.offer.storeId,
      priority: "medium",
      reason: `Preco observado ha ${ageDays} dia(s).`
    };
  }

  return null;
}

export function buildPricingRefreshPolicySummary(input: {
  offers: PersistedProductOfferInput[];
  now?: Date;
  maxAgeDays: number;
  expireWarningDays: number;
}): PricingRefreshPolicySummary {
  const now = input.now ?? new Date();
  const tasks = input.offers
    .map((offer) =>
      buildTask({
        offer,
        now,
        maxAgeDays: input.maxAgeDays,
        expireWarningDays: input.expireWarningDays
      })
    )
    .filter(Boolean) as PricingRefreshTask[];
  const highPriorityCount = tasks.filter((task) => task.priority === "high").length;
  const freshnessPercent =
    input.offers.length > 0
      ? clampPercent(((input.offers.length - tasks.length) / input.offers.length) * 100)
      : 0;

  return {
    freshnessPercent,
    taskCount: tasks.length,
    highPriorityCount,
    tasks: tasks.sort((left, right) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };

      return priorityWeight[right.priority] - priorityWeight[left.priority];
    }),
    nextRunLabel:
      highPriorityCount > 0
        ? "Executar coleta/importacao agora"
        : tasks.length > 0
          ? "Agendar atualizacao no proximo ciclo"
          : "Base de ofertas atualizada",
    recommendations: [
      "Revalidar ofertas expiradas antes de usar em propostas.",
      "Priorizar produtos mais usados no dashboard comercial.",
      "Registrar origem e data de observacao em toda importacao."
    ]
  };
}
