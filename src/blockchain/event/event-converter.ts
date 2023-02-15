import {
  BuySharesEvent,
  OrderFilledEvent,
} from '../provider/interface/event-types';

export type ConvertedBuySharesEvent = {
  watchId: string;
  user: string;
  amount: number;
};

export function convertBuySharesEvent(
  data: BuySharesEvent,
): ConvertedBuySharesEvent {
  return { ...data, user: data.user.toLowerCase(), amount: +data.amount };
}

export type ConvertedOrderFilledEvent = {
  taker: string;
  shares: number;
  orderHash: string;
  remaining: number;
  timestamp: number;
  transactionHash: string;
};

export function convertOrderFilledEvent(
  data: OrderFilledEvent,
  transactionHash = '',
): ConvertedOrderFilledEvent {
  return {
    ...data,
    taker: data.taker.toLowerCase(),
    shares: +data.shares,
    remaining: +data.remaining,
    timestamp: +data.timestamp,
    transactionHash: transactionHash,
  };
}
