-- AlterTable
ALTER TABLE "Domicilio" ADD COLUMN     "metodoPago" TEXT NOT NULL DEFAULT 'efectivo',
ADD COLUMN     "referencia" TEXT NOT NULL DEFAULT '';
