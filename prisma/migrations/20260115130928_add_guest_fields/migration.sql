-- DropForeignKey
ALTER TABLE "Inscripcion" DROP CONSTRAINT "Inscripcion_jugadorId_fkey";

-- AlterTable
ALTER TABLE "Inscripcion" ADD COLUMN     "apellidoInvitado" TEXT,
ADD COLUMN     "categoriaDeclarada" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "nombreInvitado" TEXT,
ADD COLUMN     "telefono" TEXT,
ALTER COLUMN "jugadorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_jugadorId_fkey" FOREIGN KEY ("jugadorId") REFERENCES "Jugador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
