import { Controller, Get, Req } from "@nestjs/common";
import { UsersService } from "./users.service.js";

@Controller('/me')
export class MeController {
  constructor(private readonly service: UsersService) {}

  @Get()
  async me(@Req() req) {
    console.log(req.cookies)
  }
}