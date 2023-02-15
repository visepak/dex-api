import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { API_V1 } from '../app.config';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WatchService } from './watch.service';
import { UserService } from '../user/user.service';
import { AddWatchBookmarksDto } from './dto/add-watch-bookmarks.dto';
import { UpdateWatchBookmarksResDto } from './dto/update-bookmarks-res.dto';
import { DeleteWatchBookmarksDto } from './dto/delete-watch-bookmarks.dto';
import { getPaginationParams } from '../utils/get-pagination-params';
import { GetBookmarkedWatchesDto } from './dto/get-bookmarked-watches.dto';
import { GetBookmarkedWatchesResDto } from './dto/get-bookmarked-watches-res.dto';
import { GetWatchesReply } from './dto/get-watches-response.dto';
import { PaginationRequestDto } from '../utils/dto/pagination-request.dto';

@ApiTags('watch-auth')
@Controller(`${API_V1}/auth/watch`)
export class WatchAuthController {
  private readonly logger = new Logger(WatchAuthController.name);
  constructor(
    @Inject(WatchService)
    private readonly watchService: WatchService,
    @Inject(UserService)
    private userService: UserService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/bookmarks/add')
  @ApiResponse({ type: UpdateWatchBookmarksResDto })
  async addWatchBookmarks(
    @Request() req: any,
    @Body() addWatchBookmarksDto: AddWatchBookmarksDto,
  ): Promise<UpdateWatchBookmarksResDto> {
    try {
      return await this.userService.addWatchBookmarks({
        address: req.user.userId,
        watchId: addWatchBookmarksDto.watchId,
        bookmarks: addWatchBookmarksDto.bookmarks,
      });
    } catch (e) {
      this.logger.error(e);
      return { success: false, message: 'Unknown error' };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/bookmarks/delete')
  @ApiResponse({ type: UpdateWatchBookmarksResDto })
  async deleteWatchBookmarks(
    @Request() req: any,
    @Body() deleteWatchBookmarksDto: DeleteWatchBookmarksDto,
  ): Promise<UpdateWatchBookmarksResDto> {
    try {
      return await this.userService.deleteWatchBookmarks({
        address: req.user.userId,
        watchId: deleteWatchBookmarksDto.watchId,
        bookmarks: deleteWatchBookmarksDto.bookmarks,
      });
    } catch (e) {
      this.logger.error(e);
      return { success: false, message: 'Unknown error' };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('/bookmarked')
  @ApiResponse({ type: GetBookmarkedWatchesResDto })
  async getBookmarkedWatches(
    @Request() req: any,
    @Query() params: GetBookmarkedWatchesDto,
  ): Promise<GetBookmarkedWatchesResDto> {
    try {
      const pagination = getPaginationParams(params);
      const watchBookmarks = await this.userService.getWatchBookmarks(
        req.user.userId,
      );
      return await this.watchService.getBookmarkedWatches({
        ...pagination,
        watchBookmarks,
      });
    } catch (error) {
      this.logger.error(error);
      return {} as GetBookmarkedWatchesResDto;
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('/by-orders')
  @ApiResponse({ type: GetWatchesReply })
  async getWatchesByOrders(
    @Request() req: any,
    @Query() params: PaginationRequestDto,
  ): Promise<GetWatchesReply> {
    try {
      const address = req.user.userId;
      const pagination = getPaginationParams(params);

      return await this.watchService.getWatchesByOrders(address, pagination);
    } catch (error) {
      this.logger.error(error);
      return {} as GetWatchesReply;
    }
  }
}
