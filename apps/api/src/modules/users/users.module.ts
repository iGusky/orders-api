import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { UsersService } from './users.service.js';
import { MeController } from './me.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [MeController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
