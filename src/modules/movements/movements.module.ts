import { Module } from "@nestjs/common";
import { MovementsController } from "./movements.controller.js";
import { MovementsService } from "./movements.service.js";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { MovementItemService } from "./movementItems.service.js";
import { ProductsService } from "../products/products.service.js";

@Module({
    providers: [MovementsService, MovementItemService, ProductsService],
    controllers: [MovementsController],
    imports: [PrismaModule]
})
export class MovementsModule {}