import { Reflector } from '@nestjs/core';
import type { StoreRole } from '../../../generated/prisma/enums.js';

// Roles que pueden usar un endpoint o un controller (D30). Lo aplica StoreRoleGuard; sin @Roles no se revisa rol.
// En el handler sobrescribe al del controller.
export const Roles = Reflector.createDecorator<StoreRole[]>();
