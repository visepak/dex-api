import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { IEmailNotification, ITgNotification } from './interfaces';
import { EMAIL_NOTIFICATION_JOB, TG_NOTIFICATION_JOB } from '../app.config';

@Injectable()
export class QueuePublishService {
  constructor(
    @InjectQueue('tgNotifications') private tgNotificationsQueue: Queue,
    @InjectQueue('emailNotifications') private emailNotificationsQueue: Queue,
  ) {}

  async sendTgNotification(data: ITgNotification) {
    await this.tgNotificationsQueue.add(TG_NOTIFICATION_JOB, data);
  }

  sendEmailNotification(data: IEmailNotification) {
    this.emailNotificationsQueue.add(EMAIL_NOTIFICATION_JOB, data);
  }
}
