import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { UsersService } from './users.service.js';
import { MeController } from './me.controller.js';
import { StoresModule } from '../stores/stores.module.js';

@Module({
  imports: [PrismaModule, StoresModule],
  controllers: [MeController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
