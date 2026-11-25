import { Test, TestingModule } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
} from '../../common/constants/index.js';

describe('AuthController logout', () => {
  let controller: AuthController;
  let revokeSession: jest.Mock;
  let res: { clearCookie: jest.Mock };

  beforeEach(async () => {
    revokeSession = jest.fn().mockResolvedValue(undefined);
    res = { clearCookie: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useFactory: (sessions: SessionsService) => ({
            closeSession: (token?: string) =>
              token ? sessions.revokeSession(token) : Promise.resolve(),
          }),
          inject: [SessionsService],
        },
        { provide: SessionsService, useValue: { revokeSession } },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  it('revokes the session of the cookie and clears it with the same attributes it was set with', async () => {
    const req = {
      cookies: { [SESSION_COOKIE]: 'token-123' },
    } as unknown as Request;

    await controller.closeSession(req, res as unknown as Response);

    expect(revokeSession).toHaveBeenCalledWith('token-123');
    expect(res.clearCookie).toHaveBeenCalledWith(
      SESSION_COOKIE,
      SESSION_COOKIE_OPTIONS,
    );
  });

  it('is idempotent: without a cookie it still clears it and does not throw', async () => {
    const req = { cookies: {} } as unknown as Request;

    await expect(
      controller.closeSession(req, res as unknown as Response),
    ).resolves.toBeUndefined();

    expect(revokeSession).not.toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith(
      SESSION_COOKIE,
      SESSION_COOKIE_OPTIONS,
    );
  });
});
