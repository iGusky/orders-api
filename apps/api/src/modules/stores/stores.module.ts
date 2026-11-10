import { Module } from '@nestjs/common';
import { StoresService } from './stores.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [StoresService],
  exports: [StoresService]
})
export class StoresModule {}
