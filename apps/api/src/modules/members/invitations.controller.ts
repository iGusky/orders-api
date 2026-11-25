import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { StoreRole } from '../../../generated/prisma/enums.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Store } from '../../common/decorators/store.decorator.js';
import type { StoreInfo } from '../../common/types/express.js';
import { MembersService } from './members.service.js';

// Invitaciones pendientes de la tienda activa. Se crean con POST /members; aquí solo se cancelan (RF4).
@Controller('invitations')
@Roles([StoreRole.OWNER])
export class InvitationsController {
  constructor(private readonly service: MembersService) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeInvitation(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Store() store: StoreInfo,
  ) {
    await this.service.revokeInvitation(store.id, id);
  }
}
