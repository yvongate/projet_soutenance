import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

/** Module global : MailService injectable partout. */
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
