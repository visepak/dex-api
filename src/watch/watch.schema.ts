import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ICmsChartPoint } from './cms/cms.interface';

export type WatchDocument = Watch & Document;
export enum WatchStatus {
  NotExist,
  Waiting,
  Presale,
  Trading,
  Sold,
  Canceled,
}

export enum AUCTION_STATUS {
  NOT_STARTED = 'NOT_STARTED',
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  ACCEPTED = 'ACCEPTED',
}

export interface IDeal24 {
  timestamp: number;
  usdAmount: number;
}

export interface IPrice24 {
  timestamp: number;
  price: number;
}

@Schema({ timestamps: true })
export class Watch {
  @Prop({
    nullable: false,
    unique: true,
  })
  watchId!: string;

  @Prop({ nullable: false, enum: WatchStatus })
  status!: WatchStatus;

  @Prop({ nullable: false })
  initialPrice!: number;

  @Prop({ nullable: false })
  currentPrice!: number;

  @Prop({ nullable: false })
  currentSharePrice: number;

  @Prop({ nullable: false })
  previousSharePrice: number;

  @Prop({ nullable: false, unique: true })
  ref!: string;

  @Prop({ nullable: false })
  shares!: number;

  @Prop({ nullable: false, default: false })
  tradeAllowed!: boolean;

  @Prop({ nullable: false })
  startTime!: number;

  @Prop({
    nullable: false,
    enum: AUCTION_STATUS,
    default: AUCTION_STATUS.NOT_STARTED,
  })
  auctionStatus: AUCTION_STATUS;

  @Prop({ nullable: false, default: [] })
  deals24: IDeal24[];

  @Prop({ nullable: false, default: [] })
  prices24: IPrice24[];

  @Prop({ nullable: false, default: '0' })
  volumeTotal: string;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;

  @Prop()
  quarterChart: ICmsChartPoint[];
}

export const WatchSchema = SchemaFactory.createForClass(Watch).index(
  { watchId: 1, ref: 1 },
  { unique: true },
);
export const WatchModel = { name: Watch.name, schema: WatchSchema };
