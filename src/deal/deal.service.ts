import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Deal, DealDocument, DealState } from './deal.schema';
import { FillOrderDto } from '../order/dto/fill-order.dto';
import { USDC_DECIMALS } from '../app.config';
import { Order } from '../order/order.schema';
import { GetLastDealsResDto } from './dto/get-last-deals-res.dto';
import BigNumber from 'bignumber.js';
import { GetAllDealsDto } from './dto/get-all-deals.dto';
import { GetAllDealsResDto } from './dto/get-all-deals-response.dto';
import { User } from '../user/user.schema';
import { IDeal24, Watch, WatchDocument } from '../watch/watch.schema';
import { DAY_IN_SECONDS } from '../constants';
import { GetLastDealsDto } from './dto/get-last-deals.dto';
import { WatchesCacheService } from '../watch/watches-cache.service';
import { ConvertedOrderFilledEvent } from '../blockchain/event/event-converter';

const COUNT_DEALS_FOR_USER = 10;

@Injectable()
export class DealService {
  private readonly logger = new Logger(DealService.name);

  constructor(
    @Inject(WatchesCacheService)
    private watchesCacheService: WatchesCacheService,
    @InjectModel(Deal.name) private dealModel: Model<DealDocument>,
    @InjectModel(Watch.name) private watchModel: Model<WatchDocument>,
  ) {}

  async canUserCreateDeal(address: string) {
    const dealsCount = await this.dealModel.count({
      taker: address,
      state: DealState.CREATED,
    });
    if (dealsCount < COUNT_DEALS_FOR_USER) {
      return true;
    }
    throw new HttpException(
      'TOO MUCH UNCONFIRMED DEALS',
      HttpStatus.BAD_REQUEST,
    );
  }

  async createDealWithTxHash(
    address: string,
    params: FillOrderDto,
    order: Order,
    user: User,
  ): Promise<void> {
    const newDeal = new this.dealModel({
      watchId: order.watchId,
      taker: address,
      takerUsername: user?.username || null,
      maker: order.maker,
      makerUsername: order.makerUsername,
      price: params.price,
      shares: params.shares,
      state: DealState.CREATED,
      transactionHash: params.transactionHash,
      order: order,
    });
    await newDeal.save();
  }

  async updateDeal(data: ConvertedOrderFilledEvent) {
    const { taker, timestamp, shares, transactionHash } = data;
    const deal = await this.dealModel.findOne({ transactionHash }).exec();
    if (!deal) {
      return;
    }
    // TODO: discuss do we need add deals not from our frontend
    const usdAmount = new BigNumber(shares)
      .times(new BigNumber(deal.price))
      .toNumber();
    await this.dealModel.updateOne(
      {
        transactionHash,
      },
      {
        state: DealState.CONFIRMED,
        taker: taker.toLowerCase(),
        timestamp,
        usdAmount,
      },
    );

    const watch = await this.watchModel.findOne({ watchId: deal.watchId });
    let watchDeals: IDeal24[] = [];

    if (!watch.deals24.length) {
      const deals24 = await this.dealModel
        .find({
          watchId: deal.watchId,
          timestamp: {
            $gte: +timestamp - DAY_IN_SECONDS,
          },
        })
        .sort('timestamp')
        .exec();

      if (deals24.length) {
        watchDeals = deals24.map((obj) => ({
          timestamp: obj.timestamp,
          usdAmount: obj.usdAmount,
        }));
      }
    } else {
      watchDeals = watch.deals24.filter(
        (obj) => +timestamp - obj.timestamp < DAY_IN_SECONDS,
      );
      watchDeals.push({
        timestamp: +timestamp,
        usdAmount,
      });
    }

    watch.deals24 = watchDeals;

    watch.volumeTotal = new BigNumber(watch.volumeTotal)
      .plus(usdAmount)
      .toString();

    await watch.save();

    await this.watchesCacheService.loadWatchesFromDb();
  }

  async getLastPrice(watchId: string): Promise<string> {
    const lastDeal = await this.dealModel
      .findOne({ watchId, state: DealState.CONFIRMED })
      .sort('-updatedAt')
      .exec();
    const lastPrice = !!lastDeal && !!lastDeal.price ? lastDeal.price : 1;
    return lastPrice.toFixed(USDC_DECIMALS);
  }

  async getLastDeals(req: GetLastDealsDto): Promise<GetLastDealsResDto> {
    const { page, limit, watchId } = req;
    const query: any = { state: DealState.CONFIRMED };
    // TODO: move watchId to query, temporary fix for working frontend
    if (!!watchId) {
      query.watchId = watchId;
    }
    const total = await this.dealModel.count(query).exec();
    const lastDeals = await this.dealModel
      .find(query)
      .sort({ updatedAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .exec();
    const deals = lastDeals.map((deal) => {
      return {
        watchId: deal.watchId,
        timestamp: deal.timestamp.toString(),
        shares: deal.shares.toString(),
        price: deal.order.price.toFixed(USDC_DECIMALS),
        orderType: deal.order.orderType,
        maker: deal.maker,
        makerUsername: deal.makerUsername,
        taker: deal.taker,
        takerUsername: deal.takerUsername,
        transactionHash: deal.transactionHash,
      };
    });
    return { deals, page, limit, total };
  }

  async getAllDeals(
    req: GetAllDealsDto,
    address: string,
  ): Promise<GetAllDealsResDto> {
    const { page, limit } = req;
    const query = {
      state: DealState.CONFIRMED,
      $or: [{ taker: address }, { maker: address }],
    };
    const total = await this.dealModel.count(query).exec();
    const allDeals = await this.dealModel
      .find(query)
      .sort({ updatedAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .exec();
    const deals = allDeals.map((deal) => {
      return {
        watchId: deal.watchId,
        timestamp: deal.timestamp.toString(),
        shares: deal.shares.toString(),
        price: deal.order.price.toFixed(USDC_DECIMALS),
        orderType: deal.order.orderType,
        maker: deal.maker,
        makerUsername: deal.makerUsername,
        taker: deal.taker,
        takerUsername: deal.takerUsername,
        transactionHash: deal.transactionHash,
      };
    });
    return { deals, total, page, limit };
  }

  async getOrdersFromDeals(): Promise<Record<string, Order>> {
    const allDeals = await this.dealModel.find().exec();
    return allDeals.reduce((orders, deal) => {
      return { ...orders, [deal.order.orderHash]: deal.order };
    }, {});
  }
}
