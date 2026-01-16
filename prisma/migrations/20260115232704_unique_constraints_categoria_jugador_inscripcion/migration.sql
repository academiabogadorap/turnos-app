/*
  Warnings:

  - You are about to drop the column `nombre` on the `Categoria` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[genero,nivel,tipo]` on the table `Categoria` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[codigoCancelacion]` on the table `Inscripcion` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Jugador` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[codigo]` on the table `Jugador` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `genero` to the `Categoria` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nivel` to the `Categoria` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo` to the `Categoria` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codigo` to the `Jugador` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Jugador` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Cupo" DROP CONSTRAINT "Cupo_turnoId_fkey";

-- DropForeignKey
ALTER TABLE "Inscripcion" DROP CONSTRAINT "Inscripcion_cupoId_fkey";

-- DropIndex
DROP INDEX "Categoria_nombre_key";

-- AlterTable
ALTER TABLE "Categoria" DROP COLUMN "nombre",
ADD COLUMN     "genero" TEXT NOT NULL,
ADD COLUMN     "nivel" TEXT NOT NULL,
ADD COLUMN     "tipo" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Inscripcion" ADD COLUMN     "codigoCancelacion" TEXT;

-- AlterTable
ALTER TABLE "Jugador" ADD COLUMN     "categoriaId" INTEGER,
ADD COLUMN     "codigo" TEXT NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "telefono" TEXT;

-- CreateTable
CREATE TABLE "ListaEspera" (
    "id" SERIAL NOT NULL,
    "turnoId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "fechaAlta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "ListaEspera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaseSuelta" (
    "id" SERIAL NOT NULL,
    "cupoId" INTEGER NOT NULL,
    "fecha" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'LIBRE',
    "origen" TEXT,
    "tomadoPor" TEXT,

    CONSTRAINT "ClaseSuelta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListaEspera_turnoId_idx" ON "ListaEspera"("turnoId");

-- CreateIndex
CREATE INDEX "ClaseSuelta_fecha_idx" ON "ClaseSuelta"("fecha");

-- CreateIndex
CREATE INDEX "ClaseSuelta_cupoId_idx" ON "ClaseSuelta"("cupoId");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_genero_nivel_tipo_key" ON "Categoria"("genero", "nivel", "tipo");

-- CreateIndex
CREATE INDEX "Cupo_turnoId_idx" ON "Cupo"("turnoId");

-- CreateIndex
CREATE INDEX "Cupo_canchaId_idx" ON "Cupo"("canchaId");

-- CreateIndex
CREATE INDEX "Cupo_estado_idx" ON "Cupo"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Inscripcion_codigoCancelacion_key" ON "Inscripcion"("codigoCancelacion");

-- CreateIndex
CREATE UNIQUE INDEX "Jugador_email_key" ON "Jugador"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Jugador_codigo_key" ON "Jugador"("codigo");

-- CreateIndex
CREATE INDEX "Turno_activo_idx" ON "Turno"("activo");

-- AddForeignKey
ALTER TABLE "Jugador" ADD CONSTRAINT "Jugador_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListaEspera" ADD CONSTRAINT "ListaEspera_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "Turno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaseSuelta" ADD CONSTRAINT "ClaseSuelta_cupoId_fkey" FOREIGN KEY ("cupoId") REFERENCES "Cupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cupo" ADD CONSTRAINT "Cupo_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "Turno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_cupoId_fkey" FOREIGN KEY ("cupoId") REFERENCES "Cupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
