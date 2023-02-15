import { Throttle } from '@nestjs/throttler';
import { Controller, Get, Inject, Logger, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

import { WatchService } from './watch.service';

import { GetWatchDto } from './dto/get-watch.dto';
import { GetWatchesReply, GetWatchReply } from './dto/get-watches-response.dto';
import { GetFilteredWatchesDto } from './dto/get-filtered-watches.dto';

import { getPaginationParams } from '../utils/get-pagination-params';
import { API_V1, RATE_LIMITS } from '../app.config';

@ApiTags('watch')
@Throttle(RATE_LIMITS.WATCHES.limit, RATE_LIMITS.WATCHES.ttl)
@Controller(`${API_V1}/watch`)
export class WatchController {
  private readonly logger = new Logger(WatchController.name);

  constructor(
    @Inject(WatchService)
    private readonly watchService: WatchService,
  ) {}

  @Get()
  @ApiResponse({ type: [GetWatchReply] })
  async getWatch(@Query() params: GetWatchDto): Promise<GetWatchReply[]> {
    try {
      return [await this.watchService.getWatch(params)];
    } catch (error) {
      this.logger.error(error);
      return [];
    }
  }

  @Get('/all')
  @ApiResponse({ type: GetWatchesReply })
  async getWatches(
    @Query() params: GetFilteredWatchesDto,
  ): Promise<GetWatchesReply> {
    try {
      const pagination = getPaginationParams(params);
      // console.log(params);
      return await this.watchService.getFilteredWatches({
        ...params,
        ...pagination,
      });
    } catch (error) {
      this.logger.error(error);
      return {} as GetWatchesReply;
    }
  }
}
