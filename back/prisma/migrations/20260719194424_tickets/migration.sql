/*
  Warnings:

  - You are about to drop the column `destinataireId` on the `messages` table. All the data in the column will be lost.
  - Added the required column `ticketId` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatutTicket" AS ENUM ('OUVERT', 'EN_COURS', 'FERME');

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_destinataireId_fkey";

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "destinataireId",
ADD COLUMN     "ticketId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "sujet" TEXT NOT NULL,
    "statut" "StatutTicket" NOT NULL DEFAULT 'OUVERT',
    "prisEnChargeParId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_prisEnChargeParId_fkey" FOREIGN KEY ("prisEnChargeParId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
