import { Body, Controller, HttpException, HttpStatus, Post, Req } from '@nestjs/common';
import { CreateStoreDto } from './dto/CreateStoreDto.js';
import { StoresService } from './stores.service.js';
import { User } from '../../common/decorators/user.decorator.js';
import type { UserInfo } from '../../common/types/express.js';


@Controller('stores')
export class StoresController {

  constructor(private readonly service: StoresService) {}

  @Post()

  async createStore(@Body() data: CreateStoreDto, @User() user: UserInfo){
      return await this.service.createStore(data, user.id)
  }
}
