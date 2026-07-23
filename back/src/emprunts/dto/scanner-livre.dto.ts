import { IsNotEmpty, IsString } from 'class-validator';

/** L'étudiant scanne le QR Code d'un exemplaire de livre. */
export class ScannerLivreDto {
  @IsString()
  @IsNotEmpty()
  qrCode: string; // code inscrit dans le QR de l'exemplaire (ex : BS-XXXX)
}
