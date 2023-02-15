import { CheckOrder } from './new-order-with-shares.dto';

export class OrderBookRes {
  ordersToSell: CheckOrder[];
  ordersToBuy: CheckOrder[];
  lastPrice: string;
  previousPrice: string;
  bestBuyPrice: string;
  bestSellPrice: string;
}
