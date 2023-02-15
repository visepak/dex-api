import {
  Controller,
  Get,
  Inject,
  Logger,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { API_V1 } from '../app.config';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DealService } from './deal.service';
import { GetLastDealsResDto } from './dto/get-last-deals-res.dto';
import { OrderService } from '../order/order.service';
import { GetAllDealsDto } from './dto/get-all-deals.dto';
import { getPaginationParams } from '../utils/get-pagination-params';
import { GetAllDealsResDto } from './dto/get-all-deals-response.dto';
import { GetLastDealsDto } from './dto/get-last-deals.dto';

@ApiTags('deal-auth')
@Controller(`${API_V1}/auth/deal`)
export class DealAuthController {
  private readonly logger = new Logger(DealAuthController.name);
  constructor(
    @Inject(OrderService)
    private readonly orderService: OrderService,
    @Inject(DealService)
    private readonly dealService: DealService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(`/last-deals`)
  @ApiResponse({ type: GetLastDealsResDto })
  async getLastDeals(
    @Query() getLastDealsDto: GetLastDealsDto,
  ): Promise<GetLastDealsResDto> {
    try {
      const pagination = getPaginationParams(getLastDealsDto);
      return await this.dealService.getLastDeals({
        watchId: getLastDealsDto.watchId,
        ...pagination,
      });
    } catch (error) {
      this.logger.error(error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(`/all`)
  @ApiResponse({ type: GetAllDealsResDto })
  async getAllDeals(
    @Query() params: GetAllDealsDto,
    @Request() req: any,
  ): Promise<GetAllDealsResDto> {
    try {
      const pagination = getPaginationParams(params);
      const address = req.user.userId;
      return await this.dealService.getAllDeals(pagination, address);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
