import { Inject, Injectable } from '@nestjs/common';
import { EmailService } from './email.service';
import { NOTIFICATION_TYPE, User, UserDocument } from './user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TelegramService } from './telegram.service';
import { OnEvent } from '@nestjs/event-emitter';
import {
  NOTIFICATION_EVENT,
  NotificationEventAuctionAccepted,
  NotificationEventAuctionCancelled,
  NotificationEventAuctionCreated,
  NotificationEventAuctionOutbid,
  NotificationEventOrderFilled,
  NotificationEventWatchAdd,
  NotificationEventWatchEdit,
  NotificationEventWatchTrading,
} from './interface/notification.interface';
import { ENV } from '../app.config';
import { getNotificationChannelsForUser } from './helpers/get-notification-channels';
import { QueuePublishService } from '../queue/queue-publish.service';

const { WCN_LINK, TG_EVENT_CHANNEL } = ENV;
@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(EmailService)
    private readonly emailService: EmailService,
    @Inject(TelegramService)
    private readonly telegramService: TelegramService,
    @Inject(QueuePublishService)
    private readonly queuePublishService: QueuePublishService,
  ) {}

  @OnEvent(NOTIFICATION_EVENT.ORDER_FILLED, { async: true })
  async handleNotificationEventOrderFilled(
    payload: NotificationEventOrderFilled,
  ) {
    console.log('handleNotificationEventOrderFilled');
    const { address, watchId, remainingSharesEvent, filledShares } = payload;
    console.log(address);
    const user = await this.userModel.findOne({ address }).exec();
    if (!user) {
      console.log(`User not found: ${address}`);
      return;
    }
    const watchLink = WCN_LINK + '/watches/' + watchId;
    const message = `Watch id ${watchId} - ${watchLink} \nAccount - ${address} \nYour order filled for ${filledShares} shares \nRemaining: ${remainingSharesEvent} shares`;
    const { email, telegramChatId } = getNotificationChannelsForUser(
      user,
      NOTIFICATION_TYPE.Trading,
    );
    if (telegramChatId) {
      await this.queuePublishService.sendTgNotification({
        telegramChatId,
        message,
      });
    }
    if (email) {
      const subject = 'Order filled';
      await this.queuePublishService.sendEmailNotification({
        email,
        message,
        subject,
      });
    }
  }

  @OnEvent(NOTIFICATION_EVENT.WATCH_ADD, { async: true })
  async handleNotificationEventWatchAdd(payload: NotificationEventWatchAdd) {
    const message = `New watch added to funding: pid = ${payload.pid}`;
    await this.queuePublishService.sendTgNotification({
      telegramChatId: TG_EVENT_CHANNEL,
      message,
    });
  }

  @OnEvent(NOTIFICATION_EVENT.WATCH_EDIT, { async: true })
  async handleNotificationEventWatchEdit(payload: NotificationEventWatchEdit) {
    const message = `Watch edited: pid = ${payload.pid}`;
    await this.queuePublishService.sendTgNotification({
      telegramChatId: TG_EVENT_CHANNEL,
      message,
    });
  }

  @OnEvent(NOTIFICATION_EVENT.WATCH_TRADING, { async: true })
  async handleNotificationEventWatchTrading(
    payload: NotificationEventWatchTrading,
  ) {
    const message = `Trading started for watch: pid = ${payload.pid}`;
    await this.queuePublishService.sendTgNotification({
      telegramChatId: TG_EVENT_CHANNEL,
      message,
    });
  }

  @OnEvent(NOTIFICATION_EVENT.AUCTION_CREATED, { async: true })
  async handleNotificationEventAuctionCreated(
    payload: NotificationEventAuctionCreated,
  ) {
    const { watchId, price } = payload;
    const watchLink = WCN_LINK + '/watches/' + watchId;
    const message = `Auction created for watch id ${watchId} - ${watchLink}.\nPrice - ${price}`;
    await this.queuePublishService.sendTgNotification({
      telegramChatId: TG_EVENT_CHANNEL,
      message,
    });
  }

  @OnEvent(NOTIFICATION_EVENT.AUCTION_OUTBID, { async: true })
  async handleNotificationEventAuctionOutbid(
    payload: NotificationEventAuctionOutbid,
  ) {
    const { watchId, price, oldProposer } = payload;
    const watchLink = WCN_LINK + '/watches/' + watchId;
    const message = `Auction outbid for watch id ${watchId} - ${watchLink}.\nNew price - ${price}`;
    await this.queuePublishService.sendTgNotification({
      telegramChatId: TG_EVENT_CHANNEL,
      message,
    });
    const user = await this.userModel.findOne({ address: oldProposer }).exec();
    if (!user) {
      console.log(`User not found: ${oldProposer}`);
      return;
    }
    const { email, telegramChatId } = getNotificationChannelsForUser(
      user,
      NOTIFICATION_TYPE.Auction,
    );
    if (telegramChatId) {
      await this.queuePublishService.sendTgNotification({
        telegramChatId,
        message,
      });
    }
    if (email) {
      const subject = 'Auction outbid';
      await this.queuePublishService.sendEmailNotification({
        email,
        message,
        subject,
      });
    }
  }

  @OnEvent(NOTIFICATION_EVENT.AUCTION_CANCELLED, { async: true })
  async handleNotificationEventAuctionCancelled(
    payload: NotificationEventAuctionCancelled,
  ) {
    const { watchId, price, shares } = payload;
    const watchLink = WCN_LINK + '/watches/' + watchId;
    const message = `Auction cancelled for watch id ${watchId} - ${watchLink}.\nPrice - ${price}.\nShares - ${shares}`;
    await this.queuePublishService.sendTgNotification({
      telegramChatId: TG_EVENT_CHANNEL,
      message,
    });
  }

  @OnEvent(NOTIFICATION_EVENT.AUCTION_ACCEPTED, { async: true })
  async handleNotificationEventAuctionAccepted(
    payload: NotificationEventAuctionAccepted,
  ) {
    const { watchId, price, proposer } = payload;
    const watchLink = WCN_LINK + '/watches/' + watchId;
    const message = `Auction accepted for watch id ${watchId} - ${watchLink}.\nPrice - ${price}`;
    await this.queuePublishService.sendTgNotification({
      telegramChatId: TG_EVENT_CHANNEL,
      message,
    });
    const user = await this.userModel.findOne({ address: proposer }).exec();
    if (!user) {
      console.log(`User not found: ${proposer}`);
      return;
    }
    const { email, telegramChatId } = getNotificationChannelsForUser(
      user,
      NOTIFICATION_TYPE.Auction,
    );
    if (telegramChatId) {
      await this.queuePublishService.sendTgNotification({
        telegramChatId,
        message,
      });
    }
    if (email) {
      const subject = 'Auction accepted';
      await this.queuePublishService.sendEmailNotification({
        email,
        message,
        subject,
      });
    }
  }
}
