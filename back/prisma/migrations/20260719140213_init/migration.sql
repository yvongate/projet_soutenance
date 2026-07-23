-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ETUDIANT', 'BIBLIOTHECAIRE', 'ADMINISTRATEUR');

-- CreateEnum
CREATE TYPE "StatutExemplaire" AS ENUM ('DISPONIBLE', 'EMPRUNTE', 'RESERVE');

-- CreateEnum
CREATE TYPE "StatutReservation" AS ENUM ('EN_ATTENTE', 'NOTIFIEE', 'ANNULEE', 'SATISFAITE');

-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('BIENVENUE', 'EMPRUNT', 'RAPPEL', 'DISPONIBILITE', 'MESSAGE');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "matricule" TEXT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ETUDIANT',
    "motDePasse" TEXT NOT NULL,
    "premiereConnexion" BOOLEAN NOT NULL DEFAULT true,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "livres" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "auteur" TEXT NOT NULL,
    "isbn" TEXT,
    "categorie" TEXT NOT NULL,
    "description" TEXT,
    "couverture" TEXT,
    "cote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "livres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exemplaires" (
    "id" TEXT NOT NULL,
    "livreId" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "statut" "StatutExemplaire" NOT NULL DEFAULT 'DISPONIBLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exemplaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emprunts" (
    "id" TEXT NOT NULL,
    "exemplaireId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateEmprunt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateRetourPrevue" TIMESTAMP(3) NOT NULL,
    "dateRetourEffective" TIMESTAMP(3),

    CONSTRAINT "emprunts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions_qr" (
    "id" TEXT NOT NULL,
    "exemplaireId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expireAt" TIMESTAMP(3) NOT NULL,
    "utilise" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_qr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "livreId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateReservation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "StatutReservation" NOT NULL DEFAULT 'EN_ATTENTE',
    "position" INTEGER NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "expediteurId" TEXT NOT NULL,
    "destinataireId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TypeNotification" NOT NULL,
    "message" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "dateEnvoi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_matricule_key" ON "utilisateurs"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "exemplaires_qrCode_key" ON "exemplaires"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_qr_token_key" ON "transactions_qr"("token");

-- AddForeignKey
ALTER TABLE "exemplaires" ADD CONSTRAINT "exemplaires_livreId_fkey" FOREIGN KEY ("livreId") REFERENCES "livres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emprunts" ADD CONSTRAINT "emprunts_exemplaireId_fkey" FOREIGN KEY ("exemplaireId") REFERENCES "exemplaires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emprunts" ADD CONSTRAINT "emprunts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions_qr" ADD CONSTRAINT "transactions_qr_exemplaireId_fkey" FOREIGN KEY ("exemplaireId") REFERENCES "exemplaires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions_qr" ADD CONSTRAINT "transactions_qr_userId_fkey" FOREIGN KEY ("userId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_livreId_fkey" FOREIGN KEY ("livreId") REFERENCES "livres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_expediteurId_fkey" FOREIGN KEY ("expediteurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_destinataireId_fkey" FOREIGN KEY ("destinataireId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
