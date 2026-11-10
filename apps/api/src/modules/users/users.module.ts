import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { UsersService } from './users.service.js';
import { MeController } from './me.controller.js';
import { SessionsService } from '../sessions/sessions.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [MeController],
  providers: [UsersService, SessionsService],
  exports: [UsersService],
})
export class UsersModule {}
