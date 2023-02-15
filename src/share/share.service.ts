import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetAvgSharePriceReqDto } from './dto/get-avg-share-price-req.dto';
import {
  GetAvgSharePriceItemReplyDto,
  GetAvgSharePricesReplyDto,
} from './dto/get-avg-share-price-res.dto';
import { Order, OrderType } from '../order/order.schema';
import { Share, ShareDocument } from './share.schema';
import {
  ceilDiv,
  fromNativeToNumberUSDC,
  toNativeToStringUSDC,
} from '../utils/decimalsConverter';
import BigNumber from 'bignumber.js';
import { USDC_DECIMALS } from '../app.config';
import {
  ConvertedBuySharesEvent,
  ConvertedOrderFilledEvent,
} from '../blockchain/event/event-converter';
import {
  AvgSharesAll,
  GetNewShareFromEventReq,
  GetNewShareFromEventRes,
  ShareItem,
  ZERO_SHARE_ITEM,
} from './share.interface';
import { FillOrderDto } from '../order/dto/fill-order.dto';

@Injectable()
export class ShareService {
  private readonly logger = new Logger(ShareService.name);

  constructor(
    @InjectModel(Share.name) private shareModel: Model<ShareDocument>,
  ) {}

  async getAvgSharePrices(
    params: GetAvgSharePriceReqDto & { address: string },
  ): Promise<GetAvgSharePricesReplyDto> {
    const shares = await this.shareModel
      .find({ address: params.address })
      .exec();
    if (shares.length === 0) {
      this.logger.log(`No shares for user: ${params.address}`);
      return { avgSharePrices: [] };
    }
    const avgSharePrices: GetAvgSharePriceItemReplyDto[] = shares.reduce(
      (acc, val: Share) => {
        if (this.isWatchIdIbFilter(val.watchId, params.watchIds)) {
          acc.push({
            watchId: val.watchId,
            avgSharePrice: this.getHandleOrEventAvgSharePrice(val).price,
          });
        }
        return acc;
      },
      [],
    );
    return { avgSharePrices };
  }

  isWatchIdIbFilter(watchId: string, watchIds: string | string[]) {
    const watchIdsArr = Array.isArray(watchIds) ? watchIds : [watchIds];
    return !watchIds || watchIdsArr.includes(watchId);
  }

  async updateHandleShares(
    address: string,
    params: FillOrderDto,
    order: Order,
  ) {
    const taker = address.toLowerCase();
    const { shares } = params;
    const { price: priceString, maker, watchId, orderType } = order;
    const price = +priceString;
    const { fee, quoteTokenAmount } = this.calculateFee(shares, price);

    const oldMakerShare: Share = await this.getShareFromDB(maker, watchId);
    const oldTakerShare: Share = await this.getShareFromDB(taker, watchId);

    const { newMakerShare, newTakerShare } = this.getNewShareFromEvent({
      oldMakerShare: this.getHandleOrEventAvgSharePrice(oldMakerShare),
      oldTakerShare: this.getHandleOrEventAvgSharePrice(oldTakerShare),
      orderType,
      shares,
      fee,
      quoteTokenAmount,
    });

    await this.shareModel.updateOne(
      { address: maker.toLowerCase(), watchId },
      {
        handleAmount: newMakerShare.amount,
        handlePrice: newMakerShare.price,
        handleUpdatedAt: new Date(),
      },
    );
    await this.shareModel.updateOne(
      { address: taker.toLowerCase(), watchId },
      {
        handleAmount: newTakerShare.amount,
        handlePrice: newTakerShare.price,
        handleUpdatedAt: new Date(),
      },
    );
  }

  getHandleOrEventAvgSharePrice(share: Share): ShareItem {
    return Date.now() - (share.handleUpdatedAt?.getTime() || 0) > 1000 * 60 * 10
      ? { price: share.eventPrice, amount: share.eventAmount }
      : { price: share.handlePrice, amount: share.handleAmount };
  }

  private getEventAvgSharePrice(share: Share): ShareItem {
    return { amount: share.eventAmount, price: share.eventPrice };
  }

  calculateFee(shares, price) {
    const TRADING_FEE_BP = 35; //0.35%
    const quoteTokenAmount = +shares * +toNativeToStringUSDC(price);
    const fee = fromNativeToNumberUSDC(
      ceilDiv(quoteTokenAmount * TRADING_FEE_BP, 10000),
    );
    return { quoteTokenAmount: fromNativeToNumberUSDC(quoteTokenAmount), fee };
  }

  private async getShareFromDB(
    address: string,
    watchId: string,
  ): Promise<ShareDocument> {
    const shareFromDb = await this.shareModel
      .findOne({ address: address.toLowerCase(), watchId })
      .exec();
    if (shareFromDb) return shareFromDb;
    const newShare = new this.shareModel({
      address: address.toLowerCase(),
      watchId: watchId,
    });
    await newShare.save();
    return newShare;
  }

  getNewShareFromEvent(data: GetNewShareFromEventReq): GetNewShareFromEventRes {
    const {
      oldMakerShare,
      oldTakerShare,
      orderType,
      shares,
      fee,
      quoteTokenAmount,
    } = data;
    if (orderType === OrderType.BuyLimit) {
      const newMakerShare = this.addShare(oldMakerShare, {
        shares,
        quoteTokenAmount,
      });
      // this.logger.log({ oldMakerShare });
      // this.logger.log({ newMakerShare });

      const newTakerShare = this.subShare(oldTakerShare, {
        shares,
        quoteTokenAmount: quoteTokenAmount - fee,
      });
      // this.logger.log({ oldTakerShare });
      // this.logger.log({ newTakerShare });
      return { newMakerShare, newTakerShare };
    } else {
      const newMakerShare = this.subShare(oldMakerShare, {
        shares,
        quoteTokenAmount,
      });
      // this.logger.log({ oldMakerShare });
      // this.logger.log({ newMakerShare });

      const newTakerShare = this.addShare(oldTakerShare, {
        shares,
        quoteTokenAmount: quoteTokenAmount + fee,
      });
      // this.logger.log({ oldTakerShare });
      // this.logger.log({ newTakerShare });
      return { newMakerShare, newTakerShare };
    }
  }

  async handleOrderFilledEvent(data: ConvertedOrderFilledEvent, order: Order) {
    this.logger.log(JSON.stringify(data, null, 2));
    const { taker, shares } = data;
    const { price: priceString, maker, watchId, orderType } = order;
    const price = +priceString;
    const { fee, quoteTokenAmount } = this.calculateFee(shares, price);
    this.logger.log({ fee, quoteTokenAmount });
    const oldMakerShare: Share = await this.getShareFromDB(maker, watchId);
    const oldTakerShare: Share = await this.getShareFromDB(taker, watchId);

    const { newMakerShare, newTakerShare } = this.getNewShareFromEvent({
      oldMakerShare: this.getEventAvgSharePrice(oldMakerShare),
      oldTakerShare: this.getEventAvgSharePrice(oldTakerShare),
      orderType,
      shares,
      fee,
      quoteTokenAmount,
    });

    await this.shareModel.updateOne(
      { address: maker.toLowerCase(), watchId },
      { eventAmount: newMakerShare.amount, eventPrice: newMakerShare.price },
    );
    await this.shareModel.updateOne(
      { address: taker.toLowerCase(), watchId },
      { eventAmount: newTakerShare.amount, eventPrice: newTakerShare.price },
    );
  }

  async handleBuySharesEvent(convertedEvent: ConvertedBuySharesEvent) {
    const { watchId, user, amount } = convertedEvent;
    const address = user.toLowerCase();
    // const share = await this.shareModel.findOne({ address, watchId }).exec();
    const share = await this.getShareFromDB(address, watchId);
    const newShare = this.addShare(
      { amount: share.eventAmount, price: share.eventPrice },
      {
        shares: amount,
        quoteTokenAmount: amount,
      },
    );
    await this.shareModel.updateOne(
      { address, watchId },
      {
        eventAmount: newShare.amount,
        eventPrice: newShare.price,
        handleAmount: newShare.amount,
        handlePrice: newShare.price,
      },
    );
  }

  addShare(
    oldShare: ShareItem,
    { shares, quoteTokenAmount }: { shares: number; quoteTokenAmount: number },
  ): ShareItem {
    const { amount: oldAmount, price: oldPrice } = oldShare;
    // const { shares, quoteTokenAmount } = newShare;
    const price = new BigNumber(oldAmount)
      .times(new BigNumber(oldPrice))
      .plus(new BigNumber(quoteTokenAmount))
      .div(new BigNumber(oldAmount).plus(new BigNumber(shares)))
      .toFixed(USDC_DECIMALS);
    const amount = new BigNumber(oldAmount)
      .plus(new BigNumber(shares))
      .toNumber();
    return { price: +price, amount };
  }

  subShare(
    oldShare: ShareItem,
    { shares }: { shares: number; quoteTokenAmount?: number },
  ): ShareItem {
    const { amount: oldAmount, price: oldPrice } = oldShare;
    if (shares >= oldAmount) {
      return ZERO_SHARE_ITEM;
    }
    // const price = new BigNumber(oldAmount)
    //   .times(new BigNumber(oldPrice))
    //   .minus(new BigNumber(quoteTokenAmount))
    //   .div(new BigNumber(oldAmount).minus(new BigNumber(shares)))
    //   .toFixed(USDC_DECIMALS);
    const amount = new BigNumber(oldAmount)
      .minus(new BigNumber(shares))
      .toNumber();
    return { price: +oldPrice, amount };
  }

  async updateAllAvgPrices(avgSharesAll: AvgSharesAll) {
    await this.shareModel.collection.drop();
    const avgSharesCollection: Share[] = [];
    for (const watchId in avgSharesAll) {
      for (const address in avgSharesAll[watchId]) {
        const share = avgSharesAll[watchId][address];
        avgSharesCollection.push({
          watchId,
          address,
          eventAmount: share.amount,
          eventPrice: share.price,
          handleAmount: share.amount,
          handlePrice: share.price,
        });
      }
    }
    await this.shareModel.insertMany(avgSharesCollection);
  }
}
