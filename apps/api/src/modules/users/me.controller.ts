import { Controller, Get, HttpException, HttpStatus, Req, Response } from "@nestjs/common";
import { UsersService } from "./users.service.js";
import { SessionsService } from "../sessions/sessions.service.js";
import type { Request } from "express";

@Controller('/me')
export class MeController {
  constructor(private readonly service: UsersService, private readonly sessionService: SessionsService) {}

  @Get()
  async me(@Req() req: Request) {
    try {
      const session = await this.sessionService.getSessionData(req.cookies.session)
      return await this.service.findSessionUserById(session.id)
    } catch(e) {
      throw new HttpException('Sesión no encontrada',HttpStatus.UNAUTHORIZED) 
    }
  }
}