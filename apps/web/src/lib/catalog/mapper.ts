import type {
  Brand,
  Category,
  Product,
  ProductSpecification
} from "@prisma/client";

export function mapCategoryResponse(category: Category) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString()
  };
}

export function mapBrandResponse(brand: Brand) {
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    createdAt: brand.createdAt.toISOString(),
    updatedAt: brand.updatedAt.toISOString()
  };
}

export function mapProductResponse(
  product: Product & {
    specifications: ProductSpecification[];
  }
) {
  return {
    id: product.id,
    categoryId: product.categoryId,
    brandId: product.brandId,
    name: product.name,
    sku: product.sku,
    description: product.description,
    basePriceCents: product.basePriceCents,
    currency: product.currency,
    isActive: product.isActive,
    specifications: product.specifications.map((specification) => ({
      key: specification.key,
      value: specification.value
    })),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString()
  };
}
