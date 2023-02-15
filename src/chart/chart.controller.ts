import { Controller, Get, Inject, Logger, Query } from '@nestjs/common';
import { ChartService } from './chart.service';
import { API_V1 } from '../app.config';
import { GetChartDataDto } from './dto/get-chart-data.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetChartDataResponse } from './dto/get-chart-data-response.dto';

@ApiTags('chart')
@Controller(`${API_V1}/chart`)
export class ChartController {
  private readonly logger = new Logger(ChartController.name);
  constructor(
    @Inject(ChartService)
    private readonly chartService: ChartService,
  ) {}

  @Get()
  @ApiResponse({ type: GetChartDataResponse })
  async getChartData(
    @Query() params: GetChartDataDto,
  ): Promise<GetChartDataResponse> {
    try {
      return this.chartService.getChartData(params);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
