import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { SessionsService } from './sessions.service.js';

@Module({
  imports: [PrismaModule],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
