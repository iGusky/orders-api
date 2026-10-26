import {  Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { CreateMovementDto } from "./dto/CreateMovementDto.js";
import { MovementItemService } from "./movementItems.service.js";
import { IndexParamsDto } from "../../common/models/IndexParamsDto.js";

@Injectable()
export class MovementsService {
    constructor(
        private prisma: PrismaService, 
        private movementItermsService: MovementItemService
    ) {}

    async createMovement(data: CreateMovementDto){
        var totalCents = 0;
        data.items.forEach((i) => {
            totalCents += i.lineTotalCents
        })

        const movement = await this.prisma.movement.create({
            data: {
                type: data.type,
                direction: data.direction,
                totalCents: totalCents,
                occurredAt: data.ocurredAt ?? new Date()
            }
        })
        try {           
            for(const item of data.items){
                await this.movementItermsService.createAndAppendItem(item, movement)
            }

            return(movement)
        } catch(e) {
            throw(e)
        }
    }

    async getMovemenetsPaginated({perPage, page, search}: IndexParamsDto) {
        const itemsToSkip = perPage * (page - 1)
        
        const [movements, totalItems] = await Promise.all([
            this.prisma.movement.findMany({
                orderBy: {id: 'desc'},
                take: perPage,
                skip: itemsToSkip
                }),
            this.prisma.movement.count()
        ])
        
        return {
            page: page,
            perPage: perPage,
            totalItems: totalItems,
            totalPages: Math.ceil(totalItems/perPage),
            data: movements,
        }
    }

    
}