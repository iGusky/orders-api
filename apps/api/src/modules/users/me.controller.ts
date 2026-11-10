import { Controller, Get, HttpException, HttpStatus, Req, Response, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service.js";
import { SessionsService } from "../sessions/sessions.service.js";
import type { Request } from "express";
import { StoresService } from "../stores/stores.service.js";
import { AuthGuard } from "../../common/guards/auth.guard.js";

@Controller('/me')
export class MeController {
  constructor(private readonly service: UsersService, private readonly sessionService: SessionsService, private readonly storeService: StoresService) {}

  @Get()
  async me(@Req() req: Request) {
    try {
      const session = await this.sessionService.getSessionData(req.cookies.session)
      const user = await this.service.findSessionUserById(session.userId)
      user.store = await this.storeService.getUserStore(session.userId)
      return user
    } catch(e) {
      throw new HttpException('Sesión no encontrada',HttpStatus.UNAUTHORIZED) 
    }
  }
}