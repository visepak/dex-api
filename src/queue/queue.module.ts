import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { QueuePublishService } from './queue-publish.service';
import { TelegramService } from '../user/telegram.service';
import { UserModel } from '../user/user.schema';
import { EmailService } from '../user/email.service';
import { QueueEmailConsumeService } from './queue-email-consume.service';
import { QueueTgConsumeService } from './queue-tg-consume.service';

@Module({
  imports: [
    MongooseModule.forFeature([UserModel]),
    BullModule.registerQueue(
      {
        name: 'tgNotifications',
        limiter: {
          max: 1, // Max number of jobs processed
          duration: 3000, // per duration in milliseconds
          bounceBack: false, // When jobs get rate limited, they stay in the waiting queue and are not moved to the delayed queue
        },
      },
      {
        name: 'emailNotifications',
        limiter: {
          max: 1, // Max number of jobs processed
          duration: 1100, // per duration in milliseconds
          bounceBack: false, // When jobs get rate limited, they stay in the waiting queue and are not moved to the delayed queue
        },
      },
    ),
  ],
  providers: [
    QueuePublishService,
    QueueEmailConsumeService,
    QueueTgConsumeService,
    TelegramService,
    EmailService,
  ],
  exports: [QueuePublishService],
})
export class QueueModule {}
