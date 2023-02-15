import { OrderType } from 'src/order/order.schema';

export type WatchId = string;
export type Address = string;
export type ShareItem = { amount: number; price: number };
export type AvgSharesAll = Record<WatchId, Record<Address, ShareItem>>;

export const ZERO_SHARE_ITEM = {
  amount: 0,
  price: 0,
};

export interface GetNewShareFromEventReq {
  oldMakerShare: ShareItem;
  oldTakerShare: ShareItem;
  orderType: OrderType;
  shares: number;
  fee: number;
  quoteTokenAmount: number;
}

export interface GetNewShareFromEventRes {
  newMakerShare: ShareItem;
  newTakerShare: ShareItem;
}
