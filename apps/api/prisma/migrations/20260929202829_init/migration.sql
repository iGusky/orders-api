-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('RESTOCK', 'SALE', 'RETURN', 'SHRINKAGE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "MovementDirectionType" AS ENUM ('IN', 'OUT');

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL CHECK ("priceCents" >= 0),
    "stock" INTEGER NOT NULL DEFAULT 0 CHECK ("stock" >= 0),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movement" (
    "id" UUID NOT NULL,
    "type" "MovementType" NOT NULL,
    "direction" "MovementDirectionType",
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalCents" INTEGER NOT NULL,

    CONSTRAINT "Movement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Movement_direction_check" CHECK (
        ("type" = 'ADJUSTMENT' AND "direction" IS NOT NULL)
        OR
        ("type" <> 'ADJUSTMENT' and "direction" IS NULL)
    )
);

-- CreateTable
CREATE TABLE "MovementItem" (
    "id" UUID NOT NULL,
    "movementId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL CHECK ("quantity" > 0),
    "lineTotalCents" INTEGER NOT NULL CHECK ("lineTotalCents" >= 0),

    CONSTRAINT "MovementItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MovementItem" ADD CONSTRAINT "MovementItem_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "Movement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovementItem" ADD CONSTRAINT "MovementItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
