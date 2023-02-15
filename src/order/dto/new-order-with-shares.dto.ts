import { OrderData } from '../order.schema';

export class CheckOrder {
  orderData: OrderData;
  signature: string;
  shares: string;
  orderHash: string;
}
