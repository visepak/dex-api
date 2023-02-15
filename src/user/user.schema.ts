import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export type UserDocument = User & Document;
export enum NOTIFICATION_TYPE {
  Trading = 'Trading', // FOR orderFilled
  Auction = 'Auction',
}

export enum NOTIFICATION_CHANNEL {
  email = 'email',
  telegram = 'telegram',
}

export enum BOOKMARK_LABEL {
  // Funding = 'Funding', // TODO: discuss to delete, add one type of bookmark?
  Trading = 'Trading',
  Auction = 'Auction',
  // Lastaction = 'Lastaction', // TODO: discuss - Auto add order create/deal create
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, index: true, unique: true })
  address: string;

  @Prop({ index: true })
  username: string;

  @Prop()
  email: string;

  @Prop({ default: false })
  emailConfirmed: boolean;

  @Prop()
  telegramChatId: string;

  @Prop({ index: true })
  telegramConfirmationCode: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  notificationChannels: Record<NOTIFICATION_CHANNEL, boolean>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  notificationTypes: Record<NOTIFICATION_TYPE, boolean>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  watchBookmarks: Record<string, BOOKMARK_LABEL[]>;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
export const UserModel = { name: User.name, schema: UserSchema };
