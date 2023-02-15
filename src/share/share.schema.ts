import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type ShareDocument = Share & Document;

@Schema({ timestamps: true })
export class Share {
  @Prop({ required: true, nullable: false, index: true })
  address: string;

  @Prop({ required: true, nullable: false, index: true })
  watchId!: string;

  @Prop({ default: 0 })
  eventAmount: number;

  @Prop({ default: 0 })
  eventPrice: number;

  @Prop({ default: 0 })
  handleAmount: number;

  @Prop({ default: 0 })
  handlePrice: number;

  @Prop({ default: new Date() })
  handleUpdatedAt?: Date;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const ShareSchema = SchemaFactory.createForClass(Share).index(
  { watchId: 1, address: 1 },
  { unique: true },
);
export const ShareModel = { name: Share.name, schema: ShareSchema };
