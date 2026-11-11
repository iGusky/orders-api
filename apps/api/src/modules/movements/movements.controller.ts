import { Body, Controller, Get,  Post, Query, UseFilters } from "@nestjs/common";
import { CreateMovementDto } from "./dto/CreateMovementDto.js";
import { MovementsService } from "./movements.service.js";
import { IndexMovementsPaginated } from "./dto/IndexMovementsPaginated.js";
import { Store } from "../../common/decorators/store.decorator.js";
import type { StoreInfo } from "../../common/types/express.js";
@Controller('movements')
export class MovementsController {
    constructor(private readonly service: MovementsService) {}

    @Post()
    async createMovement(@Body() createMovementDto: CreateMovementDto, @Store() store: StoreInfo) {
        try {   
            return await this.service.createMovement(createMovementDto, store.id)
        }catch(e) {
            throw e;
        }
    }

    @Get()
    async getMovementsIndex(@Query() params: IndexMovementsPaginated, @Store() store: StoreInfo) {
        return await this.service.getMovemenetsPaginated(params, store.id);
    }
}