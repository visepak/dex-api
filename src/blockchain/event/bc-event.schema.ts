import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { WcnEventsTypes } from '../provider/interface/event-types';

export type BcEventDocument = BcEvent & Document;

@Schema({ timestamps: true })
export class BcEvent {
  @Prop({
    nullable: false,
  })
  blockNumber!: number;

  @Prop({
    nullable: false,
  })
  logIndex!: number;

  @Prop({ nullable: false })
  address!: string;

  @Prop({ nullable: false, enum: WcnEventsTypes })
  type!: WcnEventsTypes;

  @Prop({ type: mongoose.Schema.Types.Mixed, nullable: false })
  data!: Record<string, unknown>;

  @Prop({ nullable: false })
  transactionHash!: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, nullable: false })
  log!: Record<string, unknown>;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const BcEventSchema = SchemaFactory.createForClass(BcEvent).index(
  { transactionHash: 1, logIndex: 1 },
  { unique: true },
);
export const BcEventModel = { name: BcEvent.name, schema: BcEventSchema };
