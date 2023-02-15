import { Order } from '../order.schema';

export interface OrdersCache {
  sell: Order[];
  buy: Order[];
  avgPrice: number;
  previousAvgPrice: number;
  updateTimestamp: number;
}
