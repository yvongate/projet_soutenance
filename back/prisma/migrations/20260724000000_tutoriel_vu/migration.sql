-- Mémoriser la visite guidée au niveau du compte (au lieu du localStorage par appareil)
ALTER TABLE "utilisateurs" ADD COLUMN "tutorielVu" BOOLEAN NOT NULL DEFAULT false;
