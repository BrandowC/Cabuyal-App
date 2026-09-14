-- DropForeignKey
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_menuId_fkey";

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "menuDiaId" INTEGER,
ALTER COLUMN "menuId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "MenuDia" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "precio" DOUBLE PRECISION NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuDia_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Plato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_menuDiaId_fkey" FOREIGN KEY ("menuDiaId") REFERENCES "MenuDia"("id") ON DELETE SET NULL ON UPDATE CASCADE;
