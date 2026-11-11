import { Module } from '@nestjs/common';
import { StoresService } from './stores.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { StoresController } from './stores.controller.js';
import { SessionsModule } from '../sessions/sessions.module.js';

@Module({
  imports: [PrismaModule, SessionsModule],
  providers: [StoresService],
  exports: [StoresService],
  controllers: [StoresController]
})
export class StoresModule {}
