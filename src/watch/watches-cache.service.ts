import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IPrice24, Watch, WatchDocument, WatchStatus } from './watch.schema';
import { CmsService } from './cms/cms.service';
import { TransformWatchDataFromRepoReq } from './interface/watch-item.interface';
import { dateDiffInDays, getTotalValueLocked } from './utils';
import {
  AddWatchEvent,
  EditWatchEvent,
  GetWcnEventsRes,
} from '../blockchain/provider/interface/event-types';
import { fromNativeToNumberUSDC } from '../utils/decimalsConverter';
import {
  NOTIFICATION_EVENT,
  NotificationEventWatchAdd,
  NotificationEventWatchEdit,
  NotificationEventWatchTrading,
} from '../user/interface/notification.interface';
import BigNumber from 'bignumber.js';
import { DAY_IN_SECONDS } from '../constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Proposal,
  ProposalDocument,
  PROPOSAL_STATE,
} from '../auction/proposal.schema';
import { ConvertedBuySharesEvent } from '../blockchain/event/event-converter';

// TODO: rework watches for one interface
export interface WatchesCache {
  totalValueLocked: number;
  tradeVolume: number;
  soldVolume: number;
  totalWatches: number;
  totalSoldWatches: number;
  watches: TransformWatchDataFromRepoReq[];
}

const CACHE_UPDATE_PERIOD = 1000 * 10;

@Injectable()
export class WatchesCacheService {
  private readonly logger = new Logger(WatchesCacheService.name);
  private watchesCache: WatchesCache = {} as WatchesCache;
  private updateTimestamp = Date.now();

  constructor(
    private eventEmitter: EventEmitter2,
    @Inject(CmsService) private cmsService: CmsService,
    @InjectModel(Watch.name) private watchModel: Model<WatchDocument>, // TODO: move event handlers to this service
    @InjectModel(Proposal.name) private proposalModel: Model<ProposalDocument>,
  ) {}

  async getWatches(): Promise<WatchesCache> {
    await this._loadWatchesFromDb();
    return this.watchesCache;
  }

  async getWatch(watchId: string): Promise<TransformWatchDataFromRepoReq> {
    await this._loadWatchesFromDb();
    return this.watchesCache.watches.find(
      (watch) => watch.watch.watchId === watchId,
    );
  }

  public async loadWatchesFromDb() {
    await this._loadWatchesFromDb(true);
  }

  private async _loadWatchesFromDb(update = false) {
    if (
      !!this.watchesCache &&
      !!this.watchesCache.watches &&
      !!this.watchesCache.watches.length &&
      !update &&
      Date.now() - this.updateTimestamp < CACHE_UPDATE_PERIOD
    ) {
      return;
    }
    const watchesFromDb: Watch[] = await this.watchModel
      .find({
        $or: [
          { status: { $in: [WatchStatus.Trading, WatchStatus.Sold] } },
          {
            $and: [
              { status: { $in: [WatchStatus.Waiting, WatchStatus.Presale] } },
              {
                startTime: {
                  $gt: Date.now() / 1000 - 10 * DAY_IN_SECONDS - 60, // If start time is earlier than 10 days and 1 minute from current moment - we don't show such watches
                },
              },
            ],
          },
        ],
      })
      .sort({ createdAt: -1 })
      .exec();

    const { totalValueLocked, tradeVolume, totalWatches, watches } =
      watchesFromDb.reduce(
        (acc, item) => {
          const cmsData = this.cmsService.getCmsWatch(item.watchId);
          if (!!cmsData) {
            acc.watches.push({
              watch: item,
              cmsData: cmsData,
            });
            if (item.status !== WatchStatus.Sold) {
              acc.totalValueLocked = getTotalValueLocked(acc, item);
              acc.tradeVolume = acc.tradeVolume + +item.volumeTotal;
              acc.totalWatches++;
            }
          }
          return acc;
        },
        {
          totalValueLocked: 0,
          tradeVolume: 0,
          totalWatches: 0,
          watches: [],
        },
      );

    const acceptedProposals = await this.proposalModel
      .find({
        state: PROPOSAL_STATE.ACCEPTED,
      })
      .sort({ createdAt: -1 })
      .exec();

    const { totalSoldWatches, soldVolume } = acceptedProposals.reduce(
      (acc, item) => {
        acc.soldVolume = acc.soldVolume + +item.price;
        acc.totalSoldWatches++;

        return acc;
      },
      {
        totalSoldWatches: 0,
        soldVolume: 0,
      },
    );

    this.watchesCache = {
      ...this.watchesCache,
      totalValueLocked,
      tradeVolume,
      totalWatches,
      watches,
      soldVolume,
      totalSoldWatches,
    };

    this.updateTimestamp = Date.now();
  }

  async handleAddWatchEvent(event: GetWcnEventsRes) {
    const { watchId, price, ref, startTime } = event.data as AddWatchEvent;
    const watchFromDB = await this.watchModel
      .findOne({ watchId: watchId })
      .exec();
    if (!watchFromDB) {
      const status =
        startTime * 1000 > Date.now()
          ? WatchStatus.Waiting
          : WatchStatus.Presale;
      const priceHr = fromNativeToNumberUSDC(price);
      const newWatch = new this.watchModel({
        watchId,
        ref,
        startTime,
        initialPrice: priceHr,
        currentPrice: priceHr,
        currentSharePrice: 1,
        previousSharePrice: 1,
        shares: priceHr,
        status,
        prices24: [
          {
            timestamp: startTime,
            price: 1.0,
          },
        ],
        quarterChart: [
          {
            timestamp: new Date().toISOString().split('T')[0],
            value: priceHr.toString(),
          },
        ],
      });

      await newWatch.save();
      this.logger.log(
        `handleAddWatchEvent watch save in db: ${JSON.stringify(event.data)}`,
      );
      const payload: NotificationEventWatchAdd = { pid: newWatch.watchId };
      this.eventEmitter.emit(NOTIFICATION_EVENT.WATCH_ADD, payload);

      await this._loadWatchesFromDb(true);
    }
  }

  async handleEditWatchEvent(event: GetWcnEventsRes) {
    const { watchId, price, ref, startTime } = event.data as EditWatchEvent;
    const watchFromDB = await this.watchModel
      .findOne({ watchId: watchId })
      .exec();
    if (!watchFromDB) {
      return;
    }
    const priceHr = fromNativeToNumberUSDC(price);
    watchFromDB.initialPrice = priceHr;
    watchFromDB.shares = priceHr;
    watchFromDB.ref = ref;
    watchFromDB.status =
      startTime * 1000 > Date.now() ? WatchStatus.Waiting : WatchStatus.Presale;
    await watchFromDB.save();
    this.logger.log(
      `handleEditWatchEvent watch save in db: ${JSON.stringify(event.data)}`,
    );
    const payload: NotificationEventWatchEdit = { pid: watchFromDB.watchId };
    this.eventEmitter.emit(NOTIFICATION_EVENT.WATCH_EDIT, payload);
  }

  async handleBuySharesEvent({ watchId, amount }: ConvertedBuySharesEvent) {
    const watchFromDB = await this.watchModel.findOne({ watchId }).exec();
    watchFromDB.shares = new BigNumber(watchFromDB.shares)
      .minus(new BigNumber(amount))
      .toNumber();
    await watchFromDB.save();
    await this._loadWatchesFromDb(true);
  }

  async handleTradeAllowedEvent(event) {
    const watchFromDB = await this.watchModel
      .findOne({ watchId: event.data.watchId })
      .exec();
    watchFromDB.tradeAllowed = true;
    watchFromDB.status = WatchStatus.Trading;
    await watchFromDB.save();
    const payload: NotificationEventWatchTrading = { pid: watchFromDB.watchId };
    this.eventEmitter.emit(NOTIFICATION_EVENT.WATCH_TRADING, payload);

    const timestamp = Math.floor(Date.now() / 1000);

    await this.addPrice24(event.data.watchId, {
      price: 1.0,
      timestamp,
    });
    await this._loadWatchesFromDb(true);
  }

  async handleRevertFundingEvent(event) {
    const watchFromDB = await this.watchModel
      .findOne({ watchId: event.data.watchId })
      .exec();
    watchFromDB.status = WatchStatus.Canceled;
    await watchFromDB.save();
    await this._loadWatchesFromDb(true);
  }

  async addPrice24(watchId: string, newPrice: IPrice24) {
    const watch = await this.watchModel.findOne({ watchId });
    const currentTimestamp = Math.floor(Date.now() / 1000);

    const timestamp24 = currentTimestamp - DAY_IN_SECONDS;

    const prices = watch.prices24?.filter((obj) => obj.timestamp > timestamp24);

    const previous24price = watch.prices24[
      watch.prices24.length - prices.length - 1
    ] || {
      price: 1,
      timestamp: watch.startTime,
    };

    watch.prices24 = [previous24price, ...prices, newPrice];

    watch.previousSharePrice = watch.currentSharePrice;
    watch.currentSharePrice = newPrice.price;
    watch.currentPrice = +(watch.initialPrice * newPrice.price).toFixed(6);

    const currentDate = new Date();
    const previousDate = new Date(
      watch.quarterChart[watch.quarterChart.length - 1]?.timestamp ||
        '1970-01-01', // If there is no items in quarterChart we need to initialize them
    );

    if (dateDiffInDays(previousDate, currentDate) > 90) {
      watch.quarterChart.push({
        timestamp: currentDate.toISOString().split('T')[0],
        value: watch.currentPrice.toString(),
      });
    }

    await watch.save();

    return watch.prices24;
  }
}
