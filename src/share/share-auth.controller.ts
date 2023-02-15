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
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetAvgSharePricesReplyDto } from './dto/get-avg-share-price-res.dto';
import { GetAvgSharePriceReqDto } from './dto/get-avg-share-price-req.dto';
import { ShareService } from './share.service';
import { API_V1 } from '../app.config';

@ApiTags('share-auth')
@Controller(`${API_V1}/auth/share`)
export class ShareAuthController {
  private readonly logger = new Logger(ShareAuthController.name);
  constructor(
    @Inject(ShareService)
    private shareService: ShareService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(`/avg-price`)
  @ApiResponse({ type: GetAvgSharePricesReplyDto })
  async getAvgSharePrices(
    @Request() req: any,
    @Query() getAvgSharePriceReqDto: GetAvgSharePriceReqDto,
  ): Promise<GetAvgSharePricesReplyDto> {
    try {
      return await this.shareService.getAvgSharePrices({
        watchIds: getAvgSharePriceReqDto.watchIds,
        address: req.user.userId,
      });
    } catch (error) {
      this.logger.error(error);
    }
  }
}
