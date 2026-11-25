import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StoreRole } from '../../../generated/prisma/enums.js';
import { StoreRoleGuard } from '../../common/guards/store-role.guard.js';
import { RoleNotAllowedError } from '../../common/exceptions/RoleNotAllowedError.js';
import { ProductsController } from './products.controller.js';

// RF6 / D32: editar un producto es solo del dueño; crear y leer no piden rol.
function contextFor(
  handler: keyof ProductsController,
  role: StoreRole,
): ExecutionContext {
  const request = {
    storeContext: {
      requestedStoreId: 'store-1',
      membership: { store: { id: 'store-1' }, role },
    },
  };
  return {
    getHandler: () => ProductsController.prototype[handler],
    getClass: () => ProductsController,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('ProductsController permissions', () => {
  const guard = new StoreRoleGuard(new Reflector());

  it('lets the owner update a product', () => {
    expect(
      guard.canActivate(contextFor('updateProduct', StoreRole.OWNER)),
    ).toBe(true);
  });

  it('rejects an employee updating a product with ROLE_NOT_ALLOWED', () => {
    expect(() =>
      guard.canActivate(contextFor('updateProduct', StoreRole.EMPLOYEE)),
    ).toThrow(RoleNotAllowedError);
  });

  it('still lets an employee create and read products', () => {
    for (const handler of [
      'createProduct',
      'getIndex',
      'getProductById',
    ] as const) {
      expect(guard.canActivate(contextFor(handler, StoreRole.EMPLOYEE))).toBe(
        true,
      );
    }
  });
});
