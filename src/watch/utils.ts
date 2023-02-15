import { GetFilteredWatchesDto } from './dto/get-filtered-watches.dto';
import { WatchStatus } from './watch.schema';
import { TransformWatchDataFromRepoReq } from './interface/watch-item.interface';
import { GetWatchReply } from './dto/get-watches-response.dto';
import { DAY_IN_SECONDS } from '../constants';
import BigNumber from 'bignumber.js';

export function dateDiffInDays(previousDate: Date, currentDate: Date): number {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;

  const utc1 = Date.UTC(
    previousDate.getFullYear(),
    previousDate.getMonth(),
    previousDate.getDate(),
  );
  const utc2 = Date.UTC(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
  );

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

export function getFilterExpr(
  item: TransformWatchDataFromRepoReq,
  params: GetFilteredWatchesDto,
) {
  // By WatchId
  const watchIds = Array.isArray(params.watchIds)
    ? params.watchIds
    : [params.watchIds];
  const watchIdsFilter =
    !params.watchIds || watchIds.includes(item.watch.watchId);

  // By Status
  const statuses: number[] = Array.isArray(params.statuses)
    ? params.statuses.map((status) => WatchStatus[status])
    : [WatchStatus[params.statuses]];
  const statusesFilter =
    !params.statuses || statuses.includes(item.watch.status);

  // By CurrentPrice
  const minPrice = params.minPrice ?? 0;
  const maxPrice = params.maxPrice ?? 1000000000000;
  const priceFilter =
    item.watch.currentPrice >= minPrice && item.watch.currentPrice <= maxPrice;

  // By Brand
  const brands = Array.isArray(params.brands) ? params.brands : [params.brands];
  const brandsFilter = !params.brands || brands.includes(item.cmsData.brand);

  // console.log({ watchIdsFilter, statusesFilter, priceFilter, brandsFilter });
  return watchIdsFilter && statusesFilter && priceFilter && brandsFilter;
}

export function transformWatchDataFromRepo({
  watch,
  cmsData,
}: TransformWatchDataFromRepoReq): GetWatchReply {
  const defaultWatchData = {
    watchId: watch.watchId.toString(),
    status: watch.status,
    initialPrice: watch.initialPrice.toString(),
    ref: watch.ref,
    shares: watch.shares.toString(),
    tradeAllowed: watch.tradeAllowed,
    startTime: watch.startTime.toString(),
    currentPrice:
      watch.currentPrice?.toString() || watch.initialPrice.toString(),
    sharePrice: watch.currentSharePrice.toFixed(6) || '1.000000',
    price24change: '0.00',
    volume24: '0',
    volumeTotal: watch.volumeTotal,
    auctionStatus: watch.auctionStatus,
    cmsData,
    quarterChart: watch.quarterChart,
  };

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const prices = watch.prices24.filter(
    (obj) => currentTimestamp - obj.timestamp < DAY_IN_SECONDS,
  );
  // TODO: need to check and fix
  const previousPriceIndex = watch.prices24.length - prices.length - 1;
  const previousPrice =
    watch.prices24[previousPriceIndex < 0 ? 0 : previousPriceIndex];
  const lastPrice = prices[prices.length - 1];

  const price24change = lastPrice?.price
    ? new BigNumber(lastPrice.price)
        .minus(new BigNumber(previousPrice.price || 1))
        .div(new BigNumber(previousPrice.price || 1))
        .times(100)
        .dp(2)
        .toNumber()
    : 0;
  const volume24 = watch.deals24.reduce((acc, val) => {
    if (currentTimestamp - val.timestamp < DAY_IN_SECONDS) {
      acc = acc + val.usdAmount;
      return acc;
    }
  }, 0);

  return {
    ...defaultWatchData,
    volumeTotal: watch.volumeTotal,
    price24change: price24change.toFixed(2),
    volume24: volume24?.toString() || '0',
  };
}

export function sortWatches(
  watches: TransformWatchDataFromRepoReq[],
  params: GetFilteredWatchesDto,
): TransformWatchDataFromRepoReq[] {
  if (params.sortBy === 'price') {
    if (params.orderBy === 'asc') {
      return watches.sort(
        (a, b) => a.watch.currentPrice - b.watch.currentPrice,
      );
    }
    if (params.orderBy === 'desc') {
      return watches.sort(
        (a, b) => b.watch.currentPrice - a.watch.currentPrice,
      );
    }
  }
  if (params.sortBy === 'date') {
    if (params.orderBy === 'asc') {
      return watches.sort(
        (a, b) => a.watch.createdAt.getTime() - b.watch.createdAt.getTime(),
      );
    }
    if (params.orderBy === 'desc') {
      return watches.sort(
        (a, b) => b.watch.createdAt.getTime() - a.watch.createdAt.getTime(),
      );
    }
  }
  return watches;
}

export function getTotalValueLocked(acc, item) {
  if (+item.shares > 0) {
    return acc.totalValueLocked + (+item.initialPrice - +item.shares) * 1;
  } else {
    return (
      acc.totalValueLocked + +item.initialPrice * (+item.currentSharePrice || 1)
    );
  }
}
