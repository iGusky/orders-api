import { Controller, Get, HttpException, HttpStatus, Req, Response, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service.js";
import { SessionsService } from "../sessions/sessions.service.js";
import type { Request } from "express";
import { StoresService } from "../stores/stores.service.js";
import { Store } from "../../../generated/prisma/client.js";
import { UserWithStore } from "../../common/types/express.js";

@Controller('/me')
export class MeController {
  constructor(private readonly service: UsersService, private readonly sessionService: SessionsService, private readonly storeService: StoresService) {}

  @Get()
  async me(@Req() req: Request): Promise<UserWithStore> {
    const session = await this.sessionService.getSessionData(req.cookies.session)
    const user = await this.service.findSessionUserById(session.userId)
    const store =  await this.storeService.getUserStore(session.userId)
    return {
      ...user,
      store: store
    }
  }
}