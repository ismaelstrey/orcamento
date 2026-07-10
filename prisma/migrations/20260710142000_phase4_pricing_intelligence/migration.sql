-- CreateEnum
CREATE TYPE "ProductOfferSource" AS ENUM ('manual', 'imported', 'crawler_future');

-- CreateTable
CREATE TABLE "PriceStore" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceStore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductOffer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "source" "ProductOfferSource" NOT NULL DEFAULT 'manual',
    "observedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "url" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriceStore_tenantId_slug_key" ON "PriceStore"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "PriceStore_tenantId_name_idx" ON "PriceStore"("tenantId", "name");

-- CreateIndex
CREATE INDEX "PriceStore_tenantId_isActive_idx" ON "PriceStore"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "ProductOffer_tenantId_productId_observedAt_idx" ON "ProductOffer"("tenantId", "productId", "observedAt");

-- CreateIndex
CREATE INDEX "ProductOffer_tenantId_storeId_idx" ON "ProductOffer"("tenantId", "storeId");

-- CreateIndex
CREATE INDEX "ProductOffer_tenantId_source_idx" ON "ProductOffer"("tenantId", "source");

-- CreateIndex
CREATE INDEX "ProductOffer_productId_priceCents_idx" ON "ProductOffer"("productId", "priceCents");

-- AddForeignKey
ALTER TABLE "PriceStore" ADD CONSTRAINT "PriceStore_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "PriceStore"("id") ON DELETE CASCADE ON UPDATE CASCADE;
