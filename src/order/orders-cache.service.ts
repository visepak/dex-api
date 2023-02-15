import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Order,
  OrderDocument,
  OrderError,
  OrderState,
  OrderType,
} from './order.schema';
import { ChartService } from '../chart/chart.service';
import {
  GetWcnEventsRes,
  OrderCanceledEvent,
} from '../blockchain/provider/interface/event-types';
import { GetOrdersDto } from './dto/get-orders.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NOTIFICATION_EVENT,
  NotificationEventOrderFilled,
} from '../user/interface/notification.interface';
import { FillOrderResponse } from './dto/fill-order-res.dto';
import { WatchService } from '../watch/watch.service';
import { BCProvider } from '../blockchain/provider/bc-provider';
import { getOrderStateFromOrderError } from './helpers/convertOrder';
import { OrdersCheckerService } from '../blockchain/order-checker/orders-checker.service';
import { OrdersCache } from './interface/order-cache.interface';
import { WatchesCacheService } from '../watch/watches-cache.service';
import { ConvertedOrderFilledEvent } from '../blockchain/event/event-converter';

export const COUNT_ORDERS_FOR_AVG_PRICE = 5;
export type WatchId = string;

@Injectable()
export class OrdersCacheService {
  private readonly logger = new Logger(OrdersCacheService.name);
  private ordersCache: Record<WatchId, OrdersCache> = {};
  private readonly bcprovider = new BCProvider();

  constructor(
    private eventEmitter: EventEmitter2,
    @Inject(ChartService) private chartService: ChartService,
    @Inject(WatchService) private readonly watchService: WatchService,
    @Inject(WatchesCacheService)
    private readonly watchesCacheService: WatchesCacheService,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @Inject(OrdersCheckerService)
    private readonly ordersCheckerService: OrdersCheckerService,
  ) {}

  async getOrderCache(watchId: string): Promise<OrdersCache> {
    await this._loadOrdersFromDbByWathId(watchId);
    return this.ordersCache[watchId];
  }

  async publicLoadOrdersFromDbByWathId(watchId: string, update = false) {
    await this._loadOrdersFromDbByWathId(watchId, update);
  }

  private async _loadOrdersFromDbByWathId(watchId: string, update = false) {
    if (
      !!this.ordersCache[watchId] &&
      !update &&
      !!this.ordersCache[watchId].updateTimestamp &&
      Date.now() - this.ordersCache[watchId].updateTimestamp < 1000 * 10
    ) {
      return;
    }
    const activeOrders = await this.orderModel
      .find({
        expiration: { $gte: Date.now() / 1000 + 120 },
        state: OrderState.ACTIVE,
        orderError: OrderError.NoError,
        watchId,
        remainingShares: { $gt: 0 },
      })
      .sort({ price: -1 })
      .exec();
    const activeOrderCache = activeOrders.reduce(
      (acc, val) => {
        val.orderType === OrderType.BuyLimit
          ? acc.buy.push(val)
          : acc.sell.push(val);
        return acc;
      },
      {
        sell: [],
        buy: [],
      } as OrdersCache,
    );
    const { currentAvgPrice, previousAvgPrice } = await this.getStartupPrices(
      watchId,
    );
    const { newAvgPrice, newPreviousAvgPrice } = await this.calcAvgPrice(
      watchId,
      currentAvgPrice,
      previousAvgPrice,
      activeOrderCache,
    );

    const createdOrderCache =
      await this.ordersCheckerService.getCreatedOrdersByWatchId(watchId);

    this.ordersCache[watchId] = {
      avgPrice: newAvgPrice,
      previousAvgPrice: newPreviousAvgPrice,
      updateTimestamp: Date.now(),
      sell: [...activeOrderCache.sell, ...createdOrderCache.sell].sort(
        (a, b) => {
          return b.price - a.price;
        },
      ),
      buy: [...activeOrderCache.buy, ...createdOrderCache.buy].sort((a, b) => {
        return b.price - a.price;
      }),
    };
  }

  private async calcAvgPrice(
    watchId: string,
    currentAvgPrice: number,
    previousAvgPrice: number,
    newOrderCache: OrdersCache,
  ) {
    const updatedAvgPrice = [
      ...newOrderCache.sell.slice(-COUNT_ORDERS_FOR_AVG_PRICE),
      ...newOrderCache.buy.slice(0, COUNT_ORDERS_FOR_AVG_PRICE),
    ].reduce((acc, val, index, array) => {
      if (array.length !== COUNT_ORDERS_FOR_AVG_PRICE * 2) return 0;
      return acc + val.price / array.length;
    }, 0);
    if (currentAvgPrice !== updatedAvgPrice && updatedAvgPrice > 0) {
      const newAvgPrice = updatedAvgPrice;
      const newPreviousAvgPrice = currentAvgPrice;
      const timestamp = Math.floor(Date.now() / 1000);
      // TODO: update chart!
      await this.chartService.addChartTick({
        watchId: watchId,
        price: newAvgPrice,
        timestamp,
      });
      await this.watchesCacheService.addPrice24(watchId, {
        price: newAvgPrice,
        timestamp,
      });
      return { newAvgPrice, newPreviousAvgPrice };
    }
    return {
      newAvgPrice: currentAvgPrice,
      newPreviousAvgPrice: previousAvgPrice,
    };
  }

  private async getStartupPrices(watchId: string) {
    if (
      !!this.ordersCache[watchId]?.avgPrice &&
      !!this.ordersCache[watchId]?.previousAvgPrice
    ) {
      return {
        currentAvgPrice: this.ordersCache[watchId].avgPrice,
        previousAvgPrice: this.ordersCache[watchId].previousAvgPrice,
      };
    }
    const watch = await this.watchService.getWatchFromDb(watchId);
    return {
      currentAvgPrice: watch.currentSharePrice,
      previousAvgPrice: watch.previousSharePrice,
    };
  }

  async getAvgPriceByWatchId(watchId: string) {
    await this._loadOrdersFromDbByWathId(watchId);
    return this.ordersCache[watchId].avgPrice;
  }

  async getOderByHash(orderHash: string): Promise<Order | null> {
    const order = await this.orderModel.findOne({ orderHash }).exec();
    const isOrderCorrect = await this.checkOrder(order);
    return !!isOrderCorrect ? order : null;
  }

  async checkOrder(order: Order): Promise<boolean> {
    const orderError = await this.bcprovider.checkOrder(
      order.orderData,
      order.signature,
      order.remainingShares,
    );
    if (orderError === OrderError.NoError) {
      return true;
    }
    await this.orderModel.updateOne(
      { orderHash: order.orderHash },
      {
        orderError,
        state: getOrderStateFromOrderError(order.orderError),
      },
    );
    this.logger.log(`checkOrder order with error: ${order}`);
    await this._loadOrdersFromDbByWathId(order.watchId, true);
    return false;
  }

  async getOrdersByWatchIdAndMaker(getOrdersDto: GetOrdersDto) {
    const { watchId, page, limit, maker } = getOrdersDto;
    const query: any = { maker, state: OrderState.ACTIVE };
    // TODO: move watchId to query, temporary fix for working frontend
    if (!!watchId) {
      query.watchId = watchId;
    }
    // Not need, we use only ACTIVE orders
    // if (!!getOrdersDto.state) {
    //   query.state = { $in: getOrdersDto.state.split(',') };
    // }
    const total = await this.orderModel.count(query).exec();
    const filteredOrders = await this.orderModel
      .find(query)
      .skip(page * limit)
      .limit(limit)
      .exec();
    return { filteredOrders, page, total, limit };
  }

  async getOrdersCountByMaker(maker: string) {
    return await this.orderModel
      .count({ maker, state: OrderState.ACTIVE })
      .exec();
  }

  async handleOrderFilledEvent(
    data: ConvertedOrderFilledEvent,
  ): Promise<Order> {
    const { shares, orderHash, remaining } = data;
    const order = await this.orderModel
      .findOne({
        orderHash,
      })
      .where('remainingSharesEvent') // Check do we need double-check for event and order
      .ne(remaining)
      .exec();
    if (!order) {
      return; // TODO: need to discuss, mb we can add order not created in our frontend to our DB and show it in glass
    }
    order.state = +remaining > 0 ? order.state : OrderState.FILLED;
    order.remainingSharesEvent = +remaining;
    order.remainingShares = Math.min(
      +order.remainingShares,
      +order.remainingSharesEvent,
    );
    order.save().then(() => {
      this.logger.log(
        `handleOrderFilledEvent: Order ${orderHash} filled, remaining: ${remaining}`,
      );
    });
    await this._loadOrdersFromDbByWathId(order.watchId, true);
    const payload: NotificationEventOrderFilled = {
      address: order.maker,
      watchId: order.watchId,
      remainingSharesEvent: order.remainingSharesEvent,
      filledShares: +shares,
    };
    this.eventEmitter.emit(NOTIFICATION_EVENT.ORDER_FILLED, payload);
    return order;
  }

  async handleOrderCanceledEvent(event: GetWcnEventsRes) {
    const { orderHash } = event.data as OrderCanceledEvent;
    try {
      const order = await this.orderModel.findOne({ orderHash }).exec();
      if (!order) {
        return;
      }
      order.orderError = OrderError.Closed;
      if (order.state !== OrderState.CANCELLED) {
        order.state = OrderState.CANCELLED;
        await order.save();
        await this._loadOrdersFromDbByWathId(order.watchId, true);
      }
      await order.save();
    } catch (e) {
      this.logger.error(e);
    }
  }

  async updateOrderRemaining(order: Order, remainingShares: number) {
    await this.orderModel.updateOne(
      { orderHash: order.orderHash },
      { remainingShares, remainingSharesUpdatedAt: new Date() },
    );
    await this._loadOrdersFromDbByWathId(order.watchId, true);
  }

  async cancelOrder(params: {
    orderHash: string;
    address: string;
  }): Promise<FillOrderResponse> {
    const order = await this.orderModel
      .findOne({ orderHash: params.orderHash, maker: params.address })
      .exec();
    this.logger.log({ order });
    if (!order) {
      return { success: false };
    }
    order.state = OrderState.CANCELLED;
    await order.save();
    await this._loadOrdersFromDbByWathId(order.watchId, true);
    return { success: true };
  }
}
