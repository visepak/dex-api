export enum NOTIFICATION_EVENT {
  ORDER_FILLED = 'ORDER_FILLED',
  WATCH_ADD = 'WATCH_ADD',
  WATCH_EDIT = 'WATCH_EDIT',
  WATCH_TRADING = 'WATCH_TRADING',
  AUCTION_CREATED = 'AUCTION_CREATED',
  AUCTION_OUTBID = 'AUCTION_OUTBID',
  AUCTION_CANCELLED = 'AUCTION_CANCELLED',
  AUCTION_ACCEPTED = 'AUCTION_ACCEPTED',
}

export interface NotificationEventAuctionCreated {
  watchId: string;
  price: number;
}

export interface NotificationEventAuctionOutbid {
  oldProposer: string;
  watchId: string;
  price: number;
}

export interface NotificationEventAuctionCancelled {
  watchId: string;
  price: number;
  shares: number;
}

export interface NotificationEventAuctionAccepted {
  watchId: string;
  price: number;
  proposer: string;
}

export interface NotificationEventOrderFilled {
  watchId: string;
  address: string;
  remainingSharesEvent: number;
  filledShares: number;
}

export interface NotificationEventWatchAdd {
  pid: string | number;
}

export interface NotificationEventWatchEdit {
  pid: string | number;
}

export interface NotificationEventWatchTrading {
  pid: string;
}
