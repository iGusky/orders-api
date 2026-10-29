import { Module } from "@nestjs/common";
import { MovementsController } from "./movements.controller.js";
import { MovementsService } from "./movements.service.js";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { MovementItemService } from "./movementItems.service.js";
import { ProductModule } from "../products/products.module.js";

@Module({
    providers: [MovementsService, MovementItemService],
    controllers: [MovementsController],
    imports: [PrismaModule, ProductModule]
})
export class MovementsModule {}