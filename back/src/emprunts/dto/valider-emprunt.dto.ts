import { IsNotEmpty, IsString } from 'class-validator';

/** Le bibliothécaire scanne le QR de transaction présenté par l'étudiant. */
export class ValiderEmpruntDto {
  @IsString()
  @IsNotEmpty()
  token: string; // jeton du QR de transaction (valable 5 min)
}
