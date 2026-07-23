import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';

class KeysDto {
  @IsString()
  @IsNotEmpty()
  p256dh: string;

  @IsString()
  @IsNotEmpty()
  auth: string;
}

/** Abonnement push envoyé par le navigateur (PushSubscription JSON). */
export class SubscribeDto {
  @IsString()
  @IsNotEmpty()
  endpoint: string;

  @IsObject()
  @ValidateNested()
  @Type(() => KeysDto)
  keys: KeysDto;
}
