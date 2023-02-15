import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type ChartDocument = Chart & Document;

@Schema({ timestamps: true })
export class Chart {
  @Prop({ required: true, nullable: false, index: true })
  watchId!: string;

  @Prop({ nullable: false })
  timestamp!: number;

  @Prop({ nullable: false })
  price!: number;

  // @Prop({ nullable: false })
  // avgPrice!: number;

  @Prop({ nullable: false })
  shares!: number;

  // @Prop({ nullable: false })
  // usdAmount!: number;
}

export const ChartSchema = SchemaFactory.createForClass(Chart);
export const ChartModel = { name: Chart.name, schema: ChartSchema };
