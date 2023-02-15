import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChartService } from '../chart/chart.service';
import { Watch } from './watch.schema';
import {
  Order,
  OrderDocument,
  OrderState,
  OrderType,
} from '../order/order.schema';
import { GetWatchDto } from './dto/get-watch.dto';
import { GetWatchesReply, GetWatchReply } from './dto/get-watches-response.dto';
import { PaginationRequestDto } from '../utils/dto/pagination-request.dto';
import { Chart, ChartDocument } from '../chart/chart.schema';
import { GetBookmarkedWatchesResDto } from './dto/get-bookmarked-watches-res.dto';
import { GetBookmarkedWatches } from './interface/get-bookmarked-watches.interface';
import { CmsService } from './cms/cms.service';
import {
  getFilterExpr,
  sortWatches,
  transformWatchDataFromRepo,
} from './utils';
import { GetFilteredWatchesDto } from './dto/get-filtered-watches.dto';
import { WatchesCacheService } from './watches-cache.service';
import { TransformWatchDataFromRepoReq } from './interface/watch-item.interface';

@Injectable()
export class WatchService {
  private readonly logger = new Logger(WatchService.name);

  constructor(
    @Inject(WatchesCacheService)
    private readonly watchesCacheService: WatchesCacheService,
    @Inject(ChartService) private chartService: ChartService,
    @Inject(CmsService) private cmsService: CmsService,
    @InjectModel(Chart.name) private chartModel: Model<ChartDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async getWatch(params: GetWatchDto): Promise<GetWatchReply> {
    if (!params.watchId) {
      return null;
    }
    const watch = await this.watchesCacheService.getWatch(params.watchId);
    if (!watch) {
      return null;
    }
    return transformWatchDataFromRepo(watch);
  }

  async getWatchFromDb(watchId: string): Promise<Watch> {
    const watch = await this.watchesCacheService.getWatch(watchId);
    return watch.watch;
  }

  async getFilteredWatches(
    params: GetFilteredWatchesDto,
  ): Promise<GetWatchesReply> {
    const { page, limit } = params;
    const watchCache = await this.watchesCacheService.getWatches();
    const watchesSorted = sortWatches(watchCache.watches, params);

    const filteredBrands = new Set();

    const watchFiltered = watchesSorted.reduce(
      (acc: GetWatchReply[], item: TransformWatchDataFromRepoReq) => {
        if (getFilterExpr(item, params)) {
          acc.push(transformWatchDataFromRepo(item));
          filteredBrands.add(item.cmsData.brand);
        }
        return acc;
      },
      [],
    );
    const watchesPaged = watchFiltered.slice(page * limit, (page + 1) * limit);
    return {
      totalValueLocked: watchCache.totalValueLocked.toString(),
      tradeVolume: watchCache.tradeVolume.toString(),
      soldVolume: watchCache.soldVolume.toString(),
      totalWatches: watchCache.totalWatches.toString(),
      totalSoldWatches: watchCache.totalSoldWatches.toString(),
      brands: [...filteredBrands],
      watches: watchesPaged,
      page,
      limit,
      total: watchFiltered.length,
    } as GetWatchesReply;
  }

  async getBookmarkedWatches(
    params: GetBookmarkedWatches,
  ): Promise<GetBookmarkedWatchesResDto> {
    const { page, limit, watchBookmarks } = params;
    const watchIds = Object.keys(watchBookmarks);
    const watches = await this.getFilteredWatches({ page, limit, watchIds });
    return {
      bookmarks: watchBookmarks,
      watches: watches.watches,
      page: watches.page,
      limit: watches.limit,
      total: watches.total,
    } as GetBookmarkedWatchesResDto;
  }

  async getWatchesByOrders(
    address: string,
    pagination: PaginationRequestDto,
  ): Promise<GetWatchesReply> {
    const userOpenedOrders = await this.orderModel
      .find({ maker: address, state: OrderState.ACTIVE })
      .exec();

    const watchesInOrdersIds = userOpenedOrders.map((order) => order.watchId);

    const watches = await this.getFilteredWatches({
      ...pagination,
      watchIds: watchesInOrdersIds,
    });
    for (let i = 0; i < watches.watches.length; i++) {
      const watch = watches.watches[i];
      const sharesInOrders = userOpenedOrders
        .filter((order) => order.watchId === watch.watchId)
        .reduce(
          (acc, order) => {
            switch (order.orderType) {
              case OrderType.BuyLimit:
                acc.buy += order.shares;
                break;
              case OrderType.SellLimit:
                acc.sell += order.shares;
                break;
              default:
                break;
            }
            return acc;
          },
          { buy: 0, sell: 0 },
        );
      watch.sharesInOrders = sharesInOrders;
    }
    return watches;
  }
}
