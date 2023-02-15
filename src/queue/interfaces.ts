export interface ITgNotification {
  telegramChatId: string;
  message: string;
}

export interface IEmailNotification {
  email: string;
  message: string;
  subject: string;
}
