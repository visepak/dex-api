import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { EmailService } from '../user/email.service';
import { EMAIL_NOTIFICATION_JOB } from '../app.config';
import { IEmailNotification } from './interfaces';
import { Logger } from '@nestjs/common';

@Processor('emailNotifications')
export class QueueEmailConsumeService {
  private readonly logger = new Logger(QueueEmailConsumeService.name);

  constructor(private readonly emailService: EmailService) {}

  @Process(EMAIL_NOTIFICATION_JOB)
  async sendEmailNotification(job: Job) {
    try {
      const data = job.data as IEmailNotification;

      await this.emailService.sendEmailMessage(
        data.email,
        data.message,
        data.subject,
      );
    } catch (error) {
      this.logger.error(error);
    }
  }
}
