import { IsNotEmpty, IsString } from 'class-validator';

/** Le bibliothécaire scanne le QR Code du livre rendu. */
export class RetourDto {
  @IsString()
  @IsNotEmpty()
  qrCode: string;
}
