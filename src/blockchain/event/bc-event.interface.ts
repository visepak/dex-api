export interface EventOptions {
  fromBlock: number;
  toBlock: number;
}

export interface UpdateEventOptions {
  dbFromBlock?: number;
  lastBlockchainBlock?: string;
  updateFromBlock?: boolean;
}
