import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { StoreRole } from '../../../generated/prisma/enums.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Store } from '../../common/decorators/store.decorator.js';
import { User } from '../../common/decorators/user.decorator.js';
import type { StoreInfo, UserInfo } from '../../common/types/express.js';
import { AddMemberDto } from './dto/AddMemberDto.js';
import { MembersService } from './members.service.js';

// Equipo de la tienda activa (X-Store-Id). Solo el dueño (D30), salvo salir de la tienda.
@Controller('members')
@Roles([StoreRole.OWNER])
export class MembersController {
  constructor(private readonly service: MembersService) {}

  @Get()
  async getTeam(@Store() store: StoreInfo) {
    return this.service.getTeam(store.id);
  }

  @Post()
  async addMember(
    @Body() dto: AddMemberDto,
    @Store() store: StoreInfo,
    @User() user: UserInfo,
  ) {
    return this.service.addByEmail(store.id, dto.email, user.id);
  }

  // RF5. Declarada antes de ':userId' para que "me" no se tome como un id.
  @Delete('me')
  @Roles([StoreRole.OWNER, StoreRole.EMPLOYEE])
  @HttpCode(HttpStatus.NO_CONTENT)
  async leaveStore(@Store() store: StoreInfo, @User() user: UserInfo) {
    await this.service.removeMember(store.id, user.id);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Store() store: StoreInfo,
  ) {
    await this.service.removeMember(store.id, userId);
  }
}
