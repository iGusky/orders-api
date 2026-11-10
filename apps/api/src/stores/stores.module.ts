import { Module } from '@nestjs/common';
import { StoresService } from './stores.service.js';

@Module({
  providers: [StoresService]
})
export class StoresModule {}
