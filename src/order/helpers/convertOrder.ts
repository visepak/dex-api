import { OrderResponse } from '../dto/order-response.dto';
import { OrderBookRes } from '../dto/order-book-res.dto';
import { Order, OrderError, OrderState } from '../order.schema';
import { USDC_DECIMALS } from '../../app.config';
import { CheckOrder } from '../dto/new-order-with-shares.dto';
import { fromNativeToNumberUSDC } from '../../utils/decimalsConverter';
import { OrdersCache } from '../interface/order-cache.interface';

const getRemainingShares = (item: Order): number => {
  return Date.now() - (item.remainingSharesUpdatedAt?.getTime() || 0) >
    1000 * 60 * 10
    ? item.remainingSharesEvent
    : item.remainingShares;
};

export const convertToOrderResponse = (order: Order): OrderResponse => {
  return {
    watchId: order.watchId,
    orderType: order.orderType,
    orderHash: order.orderHash,
    createdDateTime: Math.ceil(order.createdAt.getTime() / 1000).toString(),
    signature: order.signature,
    shares: order.shares.toString(),
    price: order.price.toString(),
    state: order.state.toString(),
    orderError: order.orderError.toString(),
    orderData: order.orderData,
  };
};

export const toOrderBookDto = (item: Order): CheckOrder => {
  return {
    orderData: item.orderData,
    signature: item.signature,
    shares: getRemainingShares(item).toString(),
    orderHash: item.orderHash,
  };
};

export const convertToOrderBook = (
  req: OrdersCache & { minSharesAmount: number },
): OrderBookRes => {
  const { sell, buy, minSharesAmount, avgPrice, previousAvgPrice } = req;
  const ordersToSellResponse = sell.map((item: Order) => {
    return toOrderBookDto(item);
  });
  const ordersToBuyResponse = buy.map((item) => {
    return toOrderBookDto(item);
  });
  const ordersToSellFinal = filterNewOrderByMinAmount(
    ordersToSellResponse,
    minSharesAmount,
  );
  const ordersToBuyFinal = filterNewOrderByMinAmount(
    ordersToBuyResponse,
    minSharesAmount,
  );
  const bestBuyPrice =
    ordersToSellFinal.length > 0
      ? fromNativeToNumberUSDC(
          ordersToSellFinal[ordersToSellFinal.length - 1].orderData.price,
        ).toFixed(USDC_DECIMALS)
      : '1.000000';
  const bestSellPrice =
    ordersToBuyFinal.length > 0
      ? fromNativeToNumberUSDC(ordersToBuyFinal[0].orderData.price).toFixed(
          USDC_DECIMALS,
        )
      : '1.000000';
  return {
    ordersToSell: ordersToSellFinal,
    ordersToBuy: ordersToBuyFinal,
    lastPrice: avgPrice.toFixed(USDC_DECIMALS),
    previousPrice: previousAvgPrice.toFixed(USDC_DECIMALS),
    bestBuyPrice,
    bestSellPrice,
  };
};

function filterNewOrderByMinAmount(orders, minSharesAmount): CheckOrder[] {
  const ORDERS_COUNT = 20;
  if (minSharesAmount <= 0) {
    return orders
      .filter((order) => order.shares > 0)
      .slice(0, ORDERS_COUNT - 1);
  }
  return orders
    .filter((order) => order.shares >= minSharesAmount)
    .slice(0, ORDERS_COUNT - 1);
}

export function getOrderStateFromOrderError(
  orderError: OrderError,
): OrderState {
  switch (orderError) {
    case OrderError.NoError:
      return OrderState.ACTIVE;
    case OrderError.UnknownMaker:
    case OrderError.BadOrderAmounts:
    case OrderError.InvalidSignature:
    case OrderError.NotEnoughRemaining:
    case OrderError.InsufficientAllowance:
    case OrderError.AmountExceedsBalance:
    case OrderError.BadWatchStatus:
      return OrderState.ERROR;
    case OrderError.Expired:
      return OrderState.EXPIRED;
    case OrderError.Closed:
      return OrderState.CLOSED;
    default:
      return OrderState.ERROR;
  }
}
