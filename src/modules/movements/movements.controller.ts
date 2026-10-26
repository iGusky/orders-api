import { Body, Controller, Get,  Post, Query, UseFilters } from "@nestjs/common";
import { CreateMovementDto } from "./dto/CreateMovementDto.js";
import { MovementsService } from "./movements.service.js";
import { IndexParamsDto } from "../../common/models/IndexParamsDto.js";
import { DomainErrorFilter } from "../../common/filters/domain-error.filter.js";

@Controller('movements')
@UseFilters(DomainErrorFilter)
export class MovementsController {
    constructor(private readonly service: MovementsService) {}

    @Post()
    async createMovement(@Body() createMovementDto: CreateMovementDto) {
        try {   
            return await this.service.createMovement(createMovementDto)
        }catch(e) {
            throw e;
        }
    }

    @Get()
    async getMovementsIndex(@Query() params: IndexParamsDto) {
        return await this.service.getMovemenetsPaginated(params);
    }
}