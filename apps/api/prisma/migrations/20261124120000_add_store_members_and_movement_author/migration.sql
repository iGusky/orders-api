-- Fase 3: empleados y varias tiendas por persona (modelo-de-datos.md, sección 9).
-- Escrita a mano a partir de `prisma migrate diff`: conserva tiendas y movimientos existentes.

-- CreateEnum
CREATE TYPE "StoreRole" AS ENUM ('OWNER', 'EMPLOYEE');

-- CreateTable
CREATE TABLE "StoreMember" (
    "id" UUID NOT NULL,
    "storeId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "StoreRole" NOT NULL,
    "addedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoreMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreInvitation" (
    "id" UUID NOT NULL,
    "storeId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "invitedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    CONSTRAINT "StoreInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoreMember_userId_idx" ON "StoreMember"("userId");
CREATE UNIQUE INDEX "StoreMember_storeId_userId_key" ON "StoreMember"("storeId", "userId");
CREATE INDEX "StoreInvitation_storeId_idx" ON "StoreInvitation"("storeId");
CREATE INDEX "StoreInvitation_email_idx" ON "StoreInvitation"("email");

-- AddForeignKey
ALTER TABLE "StoreMember" ADD CONSTRAINT "StoreMember_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoreMember" ADD CONSTRAINT "StoreMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoreMember" ADD CONSTRAINT "StoreMember_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StoreInvitation" ADD CONSTRAINT "StoreInvitation_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoreInvitation" ADD CONSTRAINT "StoreInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Datos existentes 1/2: cada tienda tiene su fila OWNER (I17).
-- Los ids nuevos los genera Prisma (uuid v7) en el cliente; aquí, en SQL, se usa gen_random_uuid() (v4).
INSERT INTO "StoreMember" ("id", "storeId", "userId", "role", "createdAt")
SELECT gen_random_uuid(), "id", "ownerId", 'OWNER', "createdAt" FROM "Store";

-- Datos existentes 2/2: Movement.createdById en pasos (expand and contract). Los movimientos anteriores a la fase 3
-- se atribuyen al dueño de su tienda, que era la única persona que podía registrarlos.
ALTER TABLE "Movement" ADD COLUMN "createdById" UUID;

UPDATE "Movement" AS m
SET "createdById" = s."ownerId"
FROM "Store" AS s
WHERE m."storeId" = s."id";

ALTER TABLE "Movement" ALTER COLUMN "createdById" SET NOT NULL;

ALTER TABLE "Movement" ADD CONSTRAINT "Movement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
