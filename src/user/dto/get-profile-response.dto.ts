import { NOTIFICATION_CHANNEL, NOTIFICATION_TYPE } from '../user.schema';

export class GetProfileRes {
  address: string;
  username?: string;
  email?: string;
  emailConfirmed?: boolean;
  telegramChatId?: string;
  telegramLink: string;
  notificationTypes: Record<NOTIFICATION_TYPE, boolean>;
  notificationChannels: Record<NOTIFICATION_CHANNEL, boolean>;
}
