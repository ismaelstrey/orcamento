import { authorizeRoles, type AuthContext } from "@orcamento/auth";
import { prisma } from "@/lib/db/prisma";
import type { DashboardSummaryResponse } from "./schemas";

interface QuoteVersionWithItems {
  versionNumber: number;
  totalCents?: number;
  currency?: string;
  items: Array<{
    productId: string | null;
    productName: string;
    quantity: number;
  }>;
}

interface QuoteWithVersions {
  versions: QuoteVersionWithItems[];
}

function ensureDashboardReadAccess(authContext: AuthContext): void {
  authorizeRoles(authContext, ["owner", "admin", "seller"]);
}

function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function getCurrentQuoteVersion<T extends { versionNumber: number }>(
  versions: T[]
): T | null {
  return (
    [...versions].sort(
      (leftVersion, rightVersion) =>
        rightVersion.versionNumber - leftVersion.versionNumber
    )[0] ?? null
  );
}

/**
 * Agrega os produtos mais usados a partir da versão atual de cada orçamento.
 */
function buildTopProducts(quotes: QuoteWithVersions[]) {
  const productUsageMap = new Map<
    string,
    {
      productId: string | null;
      productName: string;
      uses: number;
    }
  >();

  quotes.forEach((quote) => {
    const currentVersion = getCurrentQuoteVersion(quote.versions);

    if (!currentVersion) {
      return;
    }

    currentVersion.items.forEach((item) => {
      const itemKey = item.productId ?? `manual:${item.productName}`;
      const currentUsage = productUsageMap.get(itemKey);

      if (currentUsage) {
        currentUsage.uses += item.quantity;
        return;
      }

      productUsageMap.set(itemKey, {
        productId: item.productId,
        productName: item.productName,
        uses: item.quantity
      });
    });
  });

  return [...productUsageMap.values()]
    .sort((leftProduct, rightProduct) => rightProduct.uses - leftProduct.uses)
    .slice(0, 5);
}

function mapRecentQuote(quote: {
  id: string;
  title: string;
  status: "draft" | "published" | "archived";
  updatedAt: Date;
  customer: {
    name: string;
  };
  versions: Array<{
    versionNumber: number;
    totalCents: number;
    currency: string;
  }>;
}) {
  const currentVersion = getCurrentQuoteVersion(quote.versions);

  if (!currentVersion) {
    return null;
  }

  return {
    id: quote.id,
    title: quote.title,
    customerName: quote.customer.name,
    status: quote.status,
    versionNumber: currentVersion.versionNumber,
    totalCents: currentVersion.totalCents,
    currency: currentVersion.currency,
    updatedAt: quote.updatedAt.toISOString()
  };
}

/**
 * Retorna os indicadores operacionais mínimos do dashboard do MVP.
 */
export async function getDashboardSummary(
  authContext: AuthContext
): Promise<DashboardSummaryResponse> {
  ensureDashboardReadAccess(authContext);
  const monthStart = getMonthStart();

  const [
    totalQuotes,
    quotesThisMonth,
    activeCustomers,
    publishedLinks,
    quotes,
    recentQuotesSource
  ] = await Promise.all([
      prisma.quote.count({
        where: {
          tenantId: authContext.tenantId
        }
      }),
      prisma.quote.count({
        where: {
          tenantId: authContext.tenantId,
          createdAt: {
            gte: monthStart
          }
        }
      }),
      prisma.customer.count({
        where: {
          tenantId: authContext.tenantId
        }
      }),
      prisma.quoteShareLink.count({
        where: {
          tenantId: authContext.tenantId,
          status: "active"
        }
      }),
      prisma.quote.findMany({
        where: {
          tenantId: authContext.tenantId
        },
        select: {
          versions: {
            select: {
              versionNumber: true,
              items: {
                select: {
                  productId: true,
                  productName: true,
                  quantity: true
                }
              }
            }
          }
        }
      }),
      prisma.quote.findMany({
        where: {
          tenantId: authContext.tenantId
        },
        orderBy: {
          updatedAt: "desc"
        },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
          customer: {
            select: {
              name: true
            }
          },
          versions: {
            select: {
              versionNumber: true,
              totalCents: true,
              currency: true
            }
          }
        }
      })
    ]);

  return {
    totalQuotes,
    quotesThisMonth,
    activeCustomers,
    publishedLinks,
    topProducts: buildTopProducts(quotes),
    recentQuotes: recentQuotesSource
      .map(mapRecentQuote)
      .filter((quote) => quote !== null)
  };
}
