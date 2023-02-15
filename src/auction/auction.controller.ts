import { Controller, Get, Inject, Logger, Query } from '@nestjs/common';
import { API_V1 } from '../app.config';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuctionService } from './auction.service';
import { GetAuctionHistoryResDto } from './dto/get-auction-history-response.dto';
import { GetAuctionHistoryDto } from './dto/get-auction-history.dto';
import { getPaginationParams } from '../utils/get-pagination-params';

@ApiTags('auction')
@Controller(`${API_V1}/auction`)
export class AuctionController {
  private readonly logger = new Logger(AuctionController.name);
  constructor(
    @Inject(AuctionService)
    private readonly auctionService: AuctionService,
  ) {}

  @Get('/history')
  @ApiResponse({ type: GetAuctionHistoryResDto })
  async getAuctionHistory(
    @Query() params: GetAuctionHistoryDto,
  ): Promise<GetAuctionHistoryResDto> {
    try {
      const pagination = getPaginationParams(params, 3);
      return await this.auctionService.getAuctionHistory({
        watchId: params.watchId,
        ...pagination,
      });
    } catch (error) {
      this.logger.error(error);
      return {} as GetAuctionHistoryResDto;
    }
  }
}
