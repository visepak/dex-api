import { OrderType } from '../../order/order.schema';

export class DealResponse {
  watchId: string;
  timestamp: string;
  shares: string;
  price: string;
  orderType: OrderType;
  maker: string;
  taker: string;
  makerUsername?: string;
  takerUsername?: string;
  transactionHash: string;
}
