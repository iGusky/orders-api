import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { UsersService } from './users.service.js';
import { MeController } from './me.controller.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { StoresService } from '../stores/stores.service.js';
import { StoresModule } from '../stores/stores.module.js';
import { SessionsModule } from '../sessions/sessions.module.js';

@Module({
  imports: [PrismaModule, StoresModule, SessionsModule],
  controllers: [MeController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
