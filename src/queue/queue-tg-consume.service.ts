import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { TelegramService } from '../user/telegram.service';
import { TG_NOTIFICATION_JOB } from '../app.config';
import { ITgNotification } from './interfaces';
import { Logger } from '@nestjs/common';

@Processor('tgNotifications')
export class QueueTgConsumeService {
  private readonly logger = new Logger(QueueTgConsumeService.name);

  constructor(private readonly telegramService: TelegramService) {}

  @Process(TG_NOTIFICATION_JOB)
  async sendTgNotification(job: Job) {
    try {
      const data = job.data as ITgNotification;

      await this.telegramService.sendMessage(data.telegramChatId, data.message);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
