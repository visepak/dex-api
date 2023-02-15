export interface EIP712TypedData {
  types: EIP712Types;
  domain: EIP712Object;
  message: EIP712Object;
  primaryType: string;
}

export interface EIP712Types {
  [key: string]: EIP712Parameter[];
}

export interface EIP712Parameter {
  name: string;
  type: string;
}

export declare type EIP712ObjectValue = string | number | EIP712Object;

export interface EIP712Object {
  [key: string]: EIP712ObjectValue;
}

export interface MessageTypes {
  [additionalProperties: string]: MessageTypeProperty[];
  EIP712Domain: MessageTypeProperty[];
}

export interface MessageTypeProperty {
  name: string;
  type: string;
}

export type LimitOrderSignature = string;
export type LimitOrderHash = string;

export enum LimitOrderType {
  BuyLimit = '0',
  SellLimit = '1',
}

export interface LimitOrderData {
  _orderType: LimitOrderType;
  _watchId: string;
  _maker: string;
  _taker: string;
  _shares: string;
  _price: string;
  _expiration: string;
}

export interface LimitOrder extends EIP712Object {
  salt: string;
  orderType: string;
  watchId: string;
  maker: string;
  taker: string;
  shares: string;
  price: string;
  expiration: string;
}

export interface ReadyLimitOrder extends LimitOrder {
  signature: LimitOrderSignature;
  orderHash: LimitOrderHash;
}
