import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

/**
 * Génère les images de QR Code (au format Data URL PNG) à partir d'un contenu texte.
 * Utilisé pour l'étiquetage physique des exemplaires (impression).
 */
@Injectable()
export class QrService {
  async toDataURL(contenu: string): Promise<string> {
    return QRCode.toDataURL(contenu, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M',
    });
  }
}
