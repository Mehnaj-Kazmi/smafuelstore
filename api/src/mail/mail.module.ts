import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

/* Global so any module can send mail without re-importing this one, matching
   how PrismaModule is wired. */
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
