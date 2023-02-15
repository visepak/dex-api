import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export type OrderDocument = Order & Document;
export enum OrderType {
  BuyLimit,
  SellLimit,
}
export enum OrderState {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  FILLED = 'FILLED',
  CLOSED = 'CLOSED',
  EXPIRED = 'EXPIRED',
  ERROR = 'ERROR',
}

export enum OrderError {
  NoError,
  UnknownMaker,
  Expired,
  Closed,
  BadOrderAmounts,
  InvalidSignature,
  NotEnoughRemaining,
  InsufficientAllowance,
  AmountExceedsBalance,
  BadWatchStatus,
}

export interface OrderData {
  salt: string;
  orderType: string;
  watchId: string;
  maker: string;
  taker: string;
  shares: string;
  price: string;
  expiration: string;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, nullable: false, enum: OrderType, index: true })
  orderType!: OrderType;

  @Prop({ nullable: false, index: true })
  price!: number;

  @Prop({ nullable: false, enum: OrderState, index: true })
  state!: OrderState;

  @Prop({ required: true, nullable: false, enum: OrderError })
  orderError!: OrderError;

  @Prop({ nullable: false, index: true })
  expiration!: number;

  @Prop({ nullable: false, unique: true, index: true })
  orderHash!: string;

  @Prop({ nullable: false, index: true })
  maker!: string;

  @Prop()
  makerUsername?: string;

  @Prop({ nullable: false, index: true })
  taker!: string;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;

  @Prop({ nullable: false })
  signature: string;

  @Prop({ nullable: false })
  shares!: number;

  @Prop({ nullable: false, index: true })
  remainingShares!: number;

  @Prop({ default: new Date() })
  remainingSharesUpdatedAt?: Date;

  @Prop({ nullable: false, index: true })
  remainingSharesEvent!: number;

  @Prop({ nullable: false, index: true })
  watchId!: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, nullable: false })
  orderData: OrderData;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  orderCheckData?: Record<string, any>;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
export const OrderModel = { name: Order.name, schema: OrderSchema };
