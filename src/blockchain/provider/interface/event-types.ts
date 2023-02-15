export type AddWatch = {
  watchId: number;
  price: number;
  ref: string;
};

export enum WcnEventsTypes {
  // Funding events:
  AddWatch = 'AddWatch',
  EditWatch = 'EditWatch',
  BuyShares = 'BuyShares',
  TradeAllowed = 'TradeAllowed',
  RevertFunding = 'RevertFunding',
  // Trading events:
  OrderFilled = 'OrderFilled',
  OrderCanceled = 'OrderCanceled',
  // Auction events:
  ProposalCreated = 'ProposalCreated',
  ProposalCanceled = 'ProposalCanceled',
  ProposalAccepted = 'ProposalAccepted',
  // Not used
  ReadyToSell = 'ReadyToSell',
  SaleCanceled = 'SaleCanceled',
  // Not used
  SwapToUSDT = 'SwapToUSDT',
  NewFee = 'NewFee',
  NewProposalFeeBP = 'NewProposalFeeBP',
  KycVerif = 'KycVerif',
}

export interface GetWcnEventsRequest {
  fromBlock: number;
  toBlock: number;
}
export type OrderFilledEvent = {
  taker: string;
  shares: string;
  orderHash: string;
  remaining: string;
  timestamp: string;
};

export type OrderCanceledEvent = {
  maker: string;
  orderHash: string;
};

export type ProposalCreatedEvent = {
  watchId: number;
  proposalId: number;
  proposer: string;
  price: number;
};

export type ProposalCanceledEvent = {
  watchId: number;
  proposalId: number;
  shares: number;
};

export type ProposalAcceptedEvent = {
  watchId: number;
  proposalId: number;
  price: number;
  proposer: string;
};

export type AddWatchEvent = {
  watchId: number;
  price: number;
  ref: string;
  startTime: number;
};

export type EditWatchEvent = {
  watchId: number;
  price: number;
  ref: string;
  startTime: number;
};

export type BuySharesEvent = {
  watchId: string;
  user: string;
  amount: string;
};

export type RevertFunding = {
  watchId: number;
  user: string;
  shares: number;
};

export interface GetWcnEventsRes {
  blockNumber: number;
  logIndex: number;
  address: string;
  type: WcnEventsTypes;
  data:
    | AddWatchEvent
    | EditWatchEvent
    | BuySharesEvent
    | OrderFilledEvent
    | OrderCanceledEvent
    | ProposalCreatedEvent
    | ProposalCanceledEvent
    | ProposalAcceptedEvent
    | RevertFunding;
  transactionHash: string;
  log: Record<string, unknown>;
}
