import { CheckOrder } from './new-order-with-shares.dto';

export class NewOrderBookRes {
  ordersToSell: CheckOrder[];
  ordersToBuy: CheckOrder[];
  lastPrice: string;
  bestBuyPrice: string;
  bestSellPrice: string;
}
