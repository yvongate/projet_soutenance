/*
  Warnings:

  - You are about to drop the column `role` on the `utilisateurs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "utilisateurs" DROP COLUMN "role",
ADD COLUMN     "roles" "Role"[] DEFAULT ARRAY['ETUDIANT']::"Role"[];
