import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Order } from '../order/order.schema';
import mongoose from 'mongoose';

export type DealDocument = Deal & Document;
export enum DealState {
  CREATED = 'CREATED',
  CONFIRMED = 'CONFIRMED',
}

@Schema({ timestamps: true })
export class Deal {
  @Prop({ required: true, nullable: false, index: true })
  watchId!: string;

  @Prop({ required: true, nullable: false, index: true })
  taker!: string;

  @Prop()
  takerUsername?: string;

  @Prop({ required: true, nullable: false, index: true })
  maker!: string;

  @Prop()
  makerUsername?: string;

  @Prop()
  price: number;

  @Prop()
  shares: number;

  @Prop()
  usdAmount: number;

  @Prop({ nullable: false })
  timestamp!: number;

  @Prop({ required: true, nullable: false, unique: true })
  transactionHash!: string;

  @Prop({ required: true, nullable: false, enum: DealState, index: true })
  state!: DealState;

  @Prop({ required: true, nullable: false, type: mongoose.Schema.Types.Mixed })
  order!: Order;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const DealSchema = SchemaFactory.createForClass(Deal);
export const DealModel = { name: Deal.name, schema: DealSchema };
