import { OrderType } from '../order.schema';

export interface CreateOrderReq {
  orderType: OrderType;
  orderHash: string;
  signature: string;
  shares: number;
  price: string;
  watchId: string;
  salt: string;
  expiration: string;
  maker: string;
  makerUsername: string;
  taker: string;
}
