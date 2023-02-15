import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  convertToOrderBook,
  convertToOrderResponse,
  toOrderBookDto,
} from './helpers/convertOrder';
import { GetOrdersDto } from './dto/get-orders.dto';
import { FindOrderToFillDto } from './dto/find-order-to-fill.dto';
import { FillOrderDto } from './dto/fill-order.dto';
import { GetOrdersResponse } from './dto/get-order-response.dto';
import { OrderResponse } from './dto/order-response.dto';
import { FindOrderToFillRes } from './dto/find-order-to-fill-res.dto';
import { OrderBookRes } from './dto/order-book-res.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument, OrderError, OrderState } from './order.schema';
import { Model } from 'mongoose';
import { CreateOrderReq } from './interface/order.interface';
import { fromNativeToNumberUSDC } from '../utils/decimalsConverter';
import { BCProvider } from '../blockchain/provider/bc-provider';
import { OrdersCacheService } from './orders-cache.service';
import { FillOrderResponse } from './dto/fill-order-res.dto';
import { CreateOrderResponseDto } from './dto/auth-create-order-res.dto';
import { GetFilteredOrderBookDto } from './dto/auth-get-filtered-order-book.dto';
import { checkOrderSignature } from './helpers/check-order-signature';
import { OrdersCheckerService } from '../blockchain/order-checker/orders-checker.service';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  private readonly bcprovider = new BCProvider();

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @Inject(OrdersCacheService)
    private readonly ordersCacheService: OrdersCacheService,
    @Inject(OrdersCheckerService)
    private readonly ordersCheckerService: OrdersCheckerService,
  ) {}

  async createOrder(
    createOrder: CreateOrderReq,
  ): Promise<CreateOrderResponseDto> {
    // TODO: validate orderParams
    // TODO: check possible count of orders for user (15)
    const order: Order = {
      watchId: createOrder.watchId,
      orderType: createOrder.orderType,
      orderHash: createOrder.orderHash,
      signature: createOrder.signature,
      maker: createOrder.maker,
      makerUsername: createOrder.makerUsername,
      taker: createOrder.taker,
      shares: createOrder.shares,
      price: fromNativeToNumberUSDC(createOrder.price),
      remainingShares: createOrder.shares,
      remainingSharesEvent: createOrder.shares,
      state: OrderState.ACTIVE,
      orderError: OrderError.NoError,
      expiration: +createOrder.expiration,
      orderData: {
        salt: createOrder.salt.toString(),
        orderType: createOrder.orderType.toString(),
        watchId: createOrder.watchId.toString(),
        maker: createOrder.maker.toString(),
        taker: createOrder.taker.toString(),
        shares: createOrder.shares.toString(),
        price: createOrder.price.toString(),
        expiration: createOrder.expiration.toString(),
      },
    };
    if (!checkOrderSignature(order.orderData, order.signature)) {
      this.logger.log(
        `createOrder checkOrderSignature failed for ${order.maker}`,
      );
      return { order: { success: false } };
    }
    const orderCount = await this.ordersCacheService.getOrdersCountByMaker(
      order.maker,
    );
    if (orderCount > 200) {
      this.logger.log(
        `To many orders by maker: ${order.maker} , orderCount: ${orderCount}`,
      );
      return { order: { success: false } };
    }
    await this.ordersCheckerService.addCreateOrder(order);
    this.logger.log(`Order with hash=${order.orderHash} add to check queue`);
    await this.ordersCacheService.publicLoadOrdersFromDbByWathId(
      order.watchId,
      true,
    );
    return { order: { success: true } };
  }

  async getOrders(getOrdersDto: GetOrdersDto): Promise<GetOrdersResponse> {
    const { filteredOrders, page, total, limit } =
      await this.ordersCacheService.getOrdersByWatchIdAndMaker(getOrdersDto);
    const orders: OrderResponse[] = filteredOrders.map((order) =>
      convertToOrderResponse(order),
    );
    return { orders, page, total, limit };
  }

  async findOrderToFill(
    params: FindOrderToFillDto & { user: string },
  ): Promise<FindOrderToFillRes> {
    const ORDERS_COUNT = 20;
    const { shares, price, orderType, watchId, user } = params;
    const orderTypeToFind = orderType === '0' ? 'sell' : 'buy';
    const orderBook = await this.ordersCacheService.getOrderCache(watchId);
    const ordersToFill = orderBook[orderTypeToFind]
      .filter(
        (item) =>
          item.maker.toLowerCase() !== user.toLowerCase() &&
          (orderTypeToFind === 'sell'
            ? item.price <= +price
            : item.price >= +price) &&
          item.remainingShares >= +shares,
      )
      .sort((a, b) => {
        return orderTypeToFind === 'sell'
          ? a.price - b.price
          : b.price - a.price;
      });
    if (ordersToFill.length === 0) {
      return { orders: [] } as FindOrderToFillRes;
    }
    const orders = ordersToFill
      .map((item) => {
        return toOrderBookDto(item);
      })
      .slice(0, ORDERS_COUNT - 1);
    return { orders } as FindOrderToFillRes;
  }

  async getOrderBook(req: GetFilteredOrderBookDto): Promise<OrderBookRes> {
    const { watchId, minSharesAmount } = req;
    const orders = await this.ordersCacheService.getOrderCache(watchId);
    const orderBook = convertToOrderBook({
      ...orders,
      minSharesAmount: !isNaN(+minSharesAmount) ? +minSharesAmount : 0,
    });
    return orderBook;
  }

  async fillOrder(address: string, params: FillOrderDto, order: Order) {
    const fillAmount = order.remainingShares - +params.shares;
    const remainingShares = fillAmount >= 0 ? fillAmount : 0;
    try {
      await this.ordersCacheService.updateOrderRemaining(
        order,
        remainingShares,
      );
    } catch (err) {
      this.logger.error('fillOrder ' + JSON.stringify(err));
    }
  }

  async getOrderByHash(orderHash: string): Promise<Order> {
    return await this.ordersCacheService.getOderByHash(orderHash);
  }

  async cancelOrder(params: {
    orderHash: string;
    address: string;
  }): Promise<FillOrderResponse> {
    return this.ordersCacheService.cancelOrder(params);
  }
}
