import { authorizeRoles, type AuthContext, AuthError } from "@orcamento/auth";
import { prisma } from "@/lib/db/prisma";
import { mapBrandResponse, mapCategoryResponse, mapProductResponse } from "./mapper";
import {
  createBrandRequestSchema,
  createCategoryRequestSchema,
  createProductRequestSchema,
  productParamsSchema,
  updateProductRequestSchema,
  type CreateBrandRequest,
  type CreateCategoryRequest,
  type CreateProductRequest,
  type UpdateProductRequest
} from "./schemas";

function ensureCatalogWriteAccess(authContext: AuthContext): void {
  authorizeRoles(authContext, ["owner", "admin"]);
}

function ensureCatalogReadAccess(authContext: AuthContext): void {
  authorizeRoles(authContext, ["owner", "admin", "seller"]);
}

export async function listCategories(authContext: AuthContext) {
  ensureCatalogReadAccess(authContext);

  const categories = await prisma.category.findMany({
    where: {
      tenantId: authContext.tenantId
    },
    orderBy: {
      name: "asc"
    }
  });

  return categories.map(mapCategoryResponse);
}

export async function createCategory(
  authContext: AuthContext,
  input: CreateCategoryRequest
) {
  ensureCatalogWriteAccess(authContext);
  const parsedInput = createCategoryRequestSchema.parse(input);

  const category = await prisma.category.create({
    data: {
      tenantId: authContext.tenantId,
      name: parsedInput.name,
      slug: parsedInput.slug
    }
  });

  return mapCategoryResponse(category);
}

export async function listBrands(authContext: AuthContext) {
  ensureCatalogReadAccess(authContext);

  const brands = await prisma.brand.findMany({
    where: {
      tenantId: authContext.tenantId
    },
    orderBy: {
      name: "asc"
    }
  });

  return brands.map(mapBrandResponse);
}

export async function createBrand(
  authContext: AuthContext,
  input: CreateBrandRequest
) {
  ensureCatalogWriteAccess(authContext);
  const parsedInput = createBrandRequestSchema.parse(input);

  const brand = await prisma.brand.create({
    data: {
      tenantId: authContext.tenantId,
      name: parsedInput.name,
      slug: parsedInput.slug
    }
  });

  return mapBrandResponse(brand);
}

export async function listProducts(authContext: AuthContext) {
  ensureCatalogReadAccess(authContext);

  const products = await prisma.product.findMany({
    where: {
      tenantId: authContext.tenantId
    },
    include: {
      specifications: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return products.map(mapProductResponse);
}

async function ensureCategoryBelongsToTenant(
  tenantId: string,
  categoryId: string
): Promise<void> {
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      tenantId
    }
  });

  if (!category) {
    throw new AuthError(
      "tenant_scope_error",
      "Categoria não pertence ao tenant autenticado.",
      403
    );
  }
}

async function ensureBrandBelongsToTenant(
  tenantId: string,
  brandId: string
): Promise<void> {
  const brand = await prisma.brand.findFirst({
    where: {
      id: brandId,
      tenantId
    }
  });

  if (!brand) {
    throw new AuthError(
      "tenant_scope_error",
      "Marca não pertence ao tenant autenticado.",
      403
    );
  }
}

export async function createProduct(
  authContext: AuthContext,
  input: CreateProductRequest
) {
  ensureCatalogWriteAccess(authContext);
  const parsedInput = createProductRequestSchema.parse(input);

  await ensureCategoryBelongsToTenant(authContext.tenantId, parsedInput.categoryId);

  if (parsedInput.brandId) {
    await ensureBrandBelongsToTenant(authContext.tenantId, parsedInput.brandId);
  }

  const product = await prisma.product.create({
    data: {
      tenantId: authContext.tenantId,
      categoryId: parsedInput.categoryId,
      brandId: parsedInput.brandId ?? null,
      name: parsedInput.name,
      sku: parsedInput.sku ?? null,
      description: parsedInput.description ?? null,
      basePriceCents: parsedInput.basePriceCents,
      currency: parsedInput.currency,
      specifications: {
        create: parsedInput.specifications.map((specification) => ({
          key: specification.key,
          value: specification.value
        }))
      }
    },
    include: {
      specifications: true
    }
  });

  return mapProductResponse(product);
}

export async function getProductById(
  authContext: AuthContext,
  productId: string
) {
  ensureCatalogReadAccess(authContext);
  const params = productParamsSchema.parse({ productId });

  const product = await prisma.product.findFirst({
    where: {
      id: params.productId,
      tenantId: authContext.tenantId
    },
    include: {
      specifications: true
    }
  });

  return product ? mapProductResponse(product) : null;
}

export async function updateProduct(
  authContext: AuthContext,
  productId: string,
  input: UpdateProductRequest
) {
  ensureCatalogWriteAccess(authContext);
  const params = productParamsSchema.parse({ productId });
  const parsedInput = updateProductRequestSchema.parse(input);

  const currentProduct = await prisma.product.findFirst({
    where: {
      id: params.productId,
      tenantId: authContext.tenantId
    },
    include: {
      specifications: true
    }
  });

  if (!currentProduct) {
    return null;
  }

  if (parsedInput.categoryId) {
    await ensureCategoryBelongsToTenant(authContext.tenantId, parsedInput.categoryId);
  }

  if (parsedInput.brandId) {
    await ensureBrandBelongsToTenant(authContext.tenantId, parsedInput.brandId);
  }

  const product = await prisma.$transaction(async (transaction) => {
    if (parsedInput.specifications) {
      await transaction.productSpecification.deleteMany({
        where: {
          productId: currentProduct.id
        }
      });
    }

    return transaction.product.update({
      where: {
        id: currentProduct.id
      },
      data: {
        ...(parsedInput.categoryId !== undefined
          ? { categoryId: parsedInput.categoryId }
          : {}),
        ...(parsedInput.brandId !== undefined
          ? { brandId: parsedInput.brandId ?? null }
          : {}),
        ...(parsedInput.name !== undefined ? { name: parsedInput.name } : {}),
        ...(parsedInput.sku !== undefined ? { sku: parsedInput.sku ?? null } : {}),
        ...(parsedInput.description !== undefined
          ? { description: parsedInput.description ?? null }
          : {}),
        ...(parsedInput.basePriceCents !== undefined
          ? { basePriceCents: parsedInput.basePriceCents }
          : {}),
        ...(parsedInput.currency !== undefined
          ? { currency: parsedInput.currency }
          : {}),
        ...(parsedInput.specifications
          ? {
              specifications: {
                create: parsedInput.specifications.map((specification) => ({
                  key: specification.key,
                  value: specification.value
                }))
              }
            }
          : {})
      },
      include: {
        specifications: true
      }
    });
  });

  return mapProductResponse(product);
}
