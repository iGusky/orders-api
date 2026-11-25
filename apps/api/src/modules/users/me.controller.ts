import { Controller, Get } from '@nestjs/common';
import { StoresService } from '../stores/stores.service.js';
import { User } from '../../common/decorators/user.decorator.js';
import type { CurrentUser, UserInfo } from '../../common/types/express.js';

@Controller('/me')
export class MeController {
  constructor(private readonly storeService: StoresService) {}

  // La persona de la sesión (la cargó el AuthGuard) y todas sus tiendas con su rol (D26).
  @Get()
  async me(@User() user: UserInfo): Promise<CurrentUser> {
    const stores = await this.storeService.getUserStores(user.id);
    return { ...user, stores };
  }
}
