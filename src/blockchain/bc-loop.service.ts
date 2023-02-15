import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ShareService } from '../share/share.service';
import { BcEventService } from './event/bc-event.service';
import { OrdersCheckerService } from './order-checker/orders-checker.service';
import { AvgSharesAll, ZERO_SHARE_ITEM } from '../share/share.interface';
import {
  BuySharesEvent,
  OrderFilledEvent,
} from './provider/interface/event-types';
import { BcEvent } from './event/bc-event.schema';
import { DealService } from 'src/deal/deal.service';
import { Order } from '../order/order.schema';
import {
  convertBuySharesEvent,
  convertOrderFilledEvent,
} from './event/event-converter';
import { ENV } from '../app.config';

@Injectable()
export class BcLoopService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BcLoopService.name);

  constructor(
    @Inject(BcEventService) private bcEventService: BcEventService,
    @Inject(OrdersCheckerService)
    private ordersCheckerService: OrdersCheckerService,
    @Inject(ShareService)
    private shareService: ShareService,
    @Inject(DealService)
    private dealService: DealService,
  ) {}

  async onApplicationBootstrap() {
    await this.bcEventService.init();
    this.logger.log('BcLoopService loop started');
    await this.rescanAvgPrice();
    this.startBcLoop();
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  private async startBcLoop() {
    await this.ordersCheckerService.checkActiveOrders();
    await this.ordersCheckerService.checkCreatedOrders();
    await this.bcEventService.getEvents();
  }

  private async rescanAvgPrice() {
    // const NEED_RESCAN = true; //TODO: make with env var
    if (ENV.RESCAN_ALL_AVGSHAREPRICE) {
      const events = await this.bcEventService.getEventsFromDB();
      const buySharesAll: AvgSharesAll = this.getRescanBuyShareEvent(
        events.BuyShares,
      );
      // console.log(buySharesAll);
      const avgSharesAll: AvgSharesAll = await this.getRescanOrderFilledEvent(
        events.OrderFilled,
        buySharesAll,
      );
      // console.log(avgSharesAll);

      // request and map all events
      // request orders, if order not exist try to request from deals
      await this.shareService.updateAllAvgPrices(avgSharesAll);
    }
  }

  private async getRescanOrderFilledEvent(
    events: BcEvent[],
    buySharesAll: AvgSharesAll,
  ): Promise<AvgSharesAll> {
    const orders = await this.dealService.getOrdersFromDeals();
    const avgSharesAll: AvgSharesAll = buySharesAll;
    for (const event of events) {
      const { taker, shares, orderHash } = convertOrderFilledEvent(
        event.data as OrderFilledEvent,
      );

      const eventOrder: Order = orders[orderHash];
      if (!eventOrder) continue;
      const { price: priceString, maker, watchId, orderType } = eventOrder;
      const price = +priceString;
      const { fee, quoteTokenAmount } = this.shareService.calculateFee(
        shares,
        price,
      );
      avgSharesAll[watchId][maker] ??= ZERO_SHARE_ITEM;
      avgSharesAll[watchId][taker] ??= ZERO_SHARE_ITEM;

      const oldMakerShares = { ...avgSharesAll[watchId][maker] };
      const oldTakerShares = { ...avgSharesAll[watchId][taker] };

      const { newMakerShare, newTakerShare } =
        this.shareService.getNewShareFromEvent({
          oldMakerShare: avgSharesAll[watchId][maker],
          oldTakerShare: avgSharesAll[watchId][taker],
          orderType,
          shares,
          fee,
          quoteTokenAmount,
        });
      avgSharesAll[watchId][maker] = newMakerShare;
      avgSharesAll[watchId][taker] = newTakerShare;

      const newMakerShares = { ...avgSharesAll[watchId][maker] };
      const newTakerShares = { ...avgSharesAll[watchId][taker] };

      console.log({
        watchId,
        shares,
        price,
        orderType,
        fee,
        quoteTokenAmount,
        oldMakerShares,
        oldTakerShares,
        newMakerShares,
        newTakerShares,
      });
    }
    return avgSharesAll;
  }

  private getRescanBuyShareEvent(events: BcEvent[]): AvgSharesAll {
    const avgSharesAll: AvgSharesAll = {};
    for (const event of events) {
      const { watchId, user, amount } = convertBuySharesEvent(
        event.data as BuySharesEvent,
      );
      const address = user.toLowerCase();
      avgSharesAll[watchId] = avgSharesAll[watchId] ?? {};
      if (avgSharesAll[watchId][address]) {
        avgSharesAll[watchId][address] = this.shareService.addShare(
          avgSharesAll[watchId][address],
          {
            shares: amount,
            quoteTokenAmount: amount,
          },
        );
      } else {
        avgSharesAll[watchId][address] = {
          amount,
          price: 1,
        };
      }
    }
    return avgSharesAll;
  }
}
