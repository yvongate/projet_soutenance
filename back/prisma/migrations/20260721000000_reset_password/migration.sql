-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_resetToken_key" ON "utilisateurs"("resetToken");
