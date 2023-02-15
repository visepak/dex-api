import { NOTIFICATION_CHANNEL, NOTIFICATION_TYPE, User } from '../user.schema';

export const getNotificationChannelsForUser = (
  user: User,
  notificationType: NOTIFICATION_TYPE,
): { email: string | null; telegramChatId: string | null } => {
  const email =
    user.emailConfirmed &&
    !!user.notificationChannels[NOTIFICATION_CHANNEL.email] &&
    !!user.notificationTypes[notificationType]
      ? user.email
      : null;

  const telegramChatId =
    !!user.telegramChatId &&
    !!user.notificationChannels[NOTIFICATION_CHANNEL.telegram] &&
    !!user.notificationTypes[notificationType]
      ? user.telegramChatId
      : null;
  return { email, telegramChatId };
};
