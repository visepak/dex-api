import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventOptions, UpdateEventOptions } from './bc-event.interface';
import { ENV } from '../../app.config';
import { BCProvider } from '../provider/bc-provider';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BcEvent, BcEventDocument } from './bc-event.schema';
import { OrdersCacheService } from '../../order/orders-cache.service';
import { WcnEventsTypes } from '../provider/interface/event-types';
import { DealService } from '../../deal/deal.service';
import { AuctionService } from '../../auction/auction.service';
import { WatchesCacheService } from '../../watch/watches-cache.service';
import { ShareService } from '../../share/share.service';
import {
  convertBuySharesEvent,
  convertOrderFilledEvent,
} from './event-converter';

const { START_BLOCK, EVENT_REQ_PAGINATION } = ENV;
@Injectable()
export class BcEventService {
  private readonly logger = new Logger(BcEventService.name);
  private eventOptions: EventOptions = {} as EventOptions;
  private readonly bcprovider = new BCProvider();
  constructor(
    @Inject(DealService) private dealService: DealService,
    @InjectModel(BcEvent.name) private bcEventModel: Model<BcEventDocument>,
    @Inject(OrdersCacheService) private ordersCacheService: OrdersCacheService,
    @Inject(AuctionService) private auctionService: AuctionService,
    @Inject(WatchesCacheService)
    private watchesCacheService: WatchesCacheService,
    @Inject(ShareService) private shareService: ShareService,
  ) {}

  async init() {
    this.eventOptions = { fromBlock: +START_BLOCK, toBlock: 0 };
    const event = await this.bcEventModel
      .findOne({})
      .sort('-blockNumber')
      .exec();
    if (!!event && !!event.blockNumber) {
      this.updateEventOptions({ dbFromBlock: event.blockNumber });
    }
    this.logger.log(
      'startGetEventsLoop from block: ' + this.eventOptions.fromBlock,
    );
    // this.startGetEventsLoop().then(() =>
    //   this.logger.log('BcEventService loop started'),
    // );
  }
  async getEventsFromDB(): Promise<
    Record<WcnEventsTypes.BuyShares | WcnEventsTypes.OrderFilled, BcEvent[]>
  > {
    const eventsFromDb: BcEvent[] = await this.bcEventModel
      .find({ sort: { logIndex: 1, blockNumber: 1 } })
      .exec();
    // if (eventsFromDb.length === 0) return {};
    return eventsFromDb.reduce(
      (acc, event) => {
        if (
          event.type === WcnEventsTypes.BuyShares ||
          event.type === WcnEventsTypes.OrderFilled
        ) {
          acc[event.type].push(event);
        }
        return acc;
      },
      { [WcnEventsTypes.BuyShares]: [], [WcnEventsTypes.OrderFilled]: [] },
    );
  }

  async getEvents() {
    try {
      const lastBlockchainBlock = (
        (await this.bcprovider.getLastBlock()) - 11
      ).toString();
      if (+lastBlockchainBlock - +this.eventOptions.fromBlock < 2) {
        return;
      }
      this.updateEventOptions({ lastBlockchainBlock });
    } catch (e) {
      this.logger.error(e.message);
    }
    try {
      const eventsArray = await this.bcprovider.getWcnEvents(this.eventOptions);
      for (const event of eventsArray) {
        const eventFromDb = await this.bcEventModel.findOne({
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          logIndex: event.logIndex,
        });
        if (!eventFromDb) {
          await new this.bcEventModel(event).save();
          await this.processEvent(event.type as WcnEventsTypes, event);
        }
      }
      this.updateEventOptions({ updateFromBlock: true });
    } catch (e) {
      this.logger.error(e.message);
    }
  }

  private updateEventOptions({
    dbFromBlock,
    lastBlockchainBlock,
    updateFromBlock,
  }: UpdateEventOptions) {
    if (!!dbFromBlock) {
      this.eventOptions.fromBlock = dbFromBlock;
    }
    if (!!lastBlockchainBlock) {
      this.eventOptions.toBlock =
        +lastBlockchainBlock - this.eventOptions.fromBlock >
        +EVENT_REQ_PAGINATION
          ? this.eventOptions.fromBlock + +EVENT_REQ_PAGINATION
          : +lastBlockchainBlock;
    }
    if (!!updateFromBlock) {
      this.eventOptions.fromBlock = this.eventOptions.toBlock + 1;
    }
  }

  private async processEvent(type, event) {
    this.logger.log(`BcEventService processEvent ${type}`);
    switch (type) {
      case WcnEventsTypes.OrderFilled:
        const convertedOrderFilledEvent = convertOrderFilledEvent(
          event.data,
          event.transactionHash,
        );
        const order = await this.ordersCacheService.handleOrderFilledEvent(
          convertedOrderFilledEvent,
        );
        if (!!order && !!order.orderHash) {
          await this.shareService.handleOrderFilledEvent(
            convertedOrderFilledEvent,
            order,
          );
          await this.dealService.updateDeal(convertedOrderFilledEvent);
        }
        break;
      case WcnEventsTypes.OrderCanceled:
        await this.ordersCacheService.handleOrderCanceledEvent(event);
        break;
      case WcnEventsTypes.AddWatch:
        await this.watchesCacheService.handleAddWatchEvent(event);
        break;
      case WcnEventsTypes.EditWatch:
        await this.watchesCacheService.handleEditWatchEvent(event);
        break;
      case WcnEventsTypes.BuyShares:
        const convertedBuySharesEvent = convertBuySharesEvent(event.data);
        await this.watchesCacheService.handleBuySharesEvent(
          convertedBuySharesEvent,
        );
        await this.shareService.handleBuySharesEvent(convertedBuySharesEvent);
        break;
      case WcnEventsTypes.TradeAllowed:
        await this.watchesCacheService.handleTradeAllowedEvent(event);
        break;
      case WcnEventsTypes.RevertFunding:
        await this.watchesCacheService.handleRevertFundingEvent(event);
        break;
      case WcnEventsTypes.ProposalCreated:
        await this.auctionService.handleProposalCreatedEvent(event);
        break;
      case WcnEventsTypes.ProposalCanceled:
        await this.auctionService.handleProposalCanceledEvent(event);
        break;
      case WcnEventsTypes.ProposalAccepted:
        await this.auctionService.handleProposalAcceptedEvent(event);
        break;
      default:
        break;
    }
  }
}
