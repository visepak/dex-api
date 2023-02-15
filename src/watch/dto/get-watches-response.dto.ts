import { AUCTION_STATUS, WatchStatus } from '../watch.schema';
import { PaginationResponseDto } from '../../utils/dto/pagination-response.dto';
import { CmsWatchAttributes, ICmsChartPoint } from '../cms/cms.interface';

export class GetWatchesReply extends PaginationResponseDto {
  totalValueLocked: string;
  tradeVolume: string;
  totalWatches: string;
  brands: string[]; // TODO: check that all endpoints return brands
  watches: GetWatchReply[];
}

export class GetWatchReply {
  currentPrice: string;
  price24change: string;
  sharePrice: string;
  volume24: string;
  volumeTotal: string;

  watchId: string;
  status: WatchStatus;
  initialPrice: string;
  ref: string;
  shares: string;
  tradeAllowed: boolean;
  startTime: string;
  auctionStatus: AUCTION_STATUS;
  sharesInOrders?: {
    buy: number;
    sell: number;
  };
  cmsData: CmsWatchAttributes;
  quarterChart: ICmsChartPoint[];
}
