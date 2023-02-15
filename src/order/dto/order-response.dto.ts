import { OrderData, OrderType } from '../order.schema';

export class OrderResponse {
  watchId: string;
  orderType: OrderType;
  orderHash: string;
  createdDateTime: string;
  signature: string;
  shares: string;
  price: string;
  state: string;
  orderError: string;
  orderData: OrderData;
}
