-- CreateTable
CREATE TABLE "CambioMesa" (
    "id" SERIAL NOT NULL,
    "mesaOrigen" INTEGER NOT NULL,
    "mesaDestino" INTEGER NOT NULL,
    "usuario" TEXT NOT NULL DEFAULT '',
    "productos" INTEGER NOT NULL DEFAULT 0,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CambioMesa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CambioMesa_fecha_idx" ON "CambioMesa"("fecha");
