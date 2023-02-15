import { Injectable, Logger } from '@nestjs/common';
import { Context, Telegraf } from 'telegraf';

import { ENV } from '../app.config';
import { InjectModel } from '@nestjs/mongoose';
import { NOTIFICATION_CHANNEL, User, UserDocument } from './user.schema';
import { Model } from 'mongoose';
import { Ctx, InjectBot, Start, Update } from 'nestjs-telegraf';
import { SkipThrottle } from '@nestjs/throttler';

const { TG_BOT_NAME, WCN_LINK } = ENV;
@Update()
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectBot() private bot: Telegraf,
  ) {}

  async sendMessage(chatId, message) {
    try {
      // const chatId = '44607534';
      // const message = `Test meassage from sendMessge - ${chatId}`;
      await this.bot.telegram.sendMessage(chatId, message);
    } catch (error) {
      this.logger.error(
        `Sending notification message was failed with error: ${JSON.stringify(
          error,
        )}`,
      );
    }
  }

  @SkipThrottle()
  @Start()
  async onStart(@Ctx() ctx: Context): Promise<string> {
    return this.handleBotStart(ctx);
  }

  private async handleBotStart(ctx): Promise<string> {
    const address = await this.getAddressFromStartPayload(ctx.startPayload);
    if (!address) {
      const link = WCN_LINK + '/account';
      return `Go to ${link} to add notifiations`;
    }
    await this.updateUserTelegram(address, ctx.update.message.chat.id);
    return 'Welcome to WatchChain notificator. Now you subscribed for WatchChain events with your shares. For all events subscribe to https://t.me/watchchain_events';
  }

  getTelegramLink(confirmationCode: string) {
    return `https://t.me/${TG_BOT_NAME}?start=${confirmationCode}`;
  }

  async getAddressFromStartPayload(startPayload) {
    // TODO: add additional validate (check uuid)
    if (!startPayload || typeof startPayload !== 'string') {
      return null;
    }
    const user = await this.userModel
      .findOne({ telegramConfirmationCode: startPayload })
      .exec();
    return !!user ? user.address : null;
  }

  private async updateUserTelegram(address, chatId) {
    const user = await this.userModel.findOne({ address }).exec();
    user.telegramChatId = chatId;
    user.notificationChannels = {
      ...user.notificationChannels,
      [NOTIFICATION_CHANNEL.telegram]: true,
    };
    await user.save();
  }

  // onApplicationBootstrap(): any {
  //   // WatchChainNotificator_test_bot
  //   this.bot.start(this.handleBotStart);
  //   // this.bot.help((ctx) => ctx.reply('Send me a sticker'));
  //   // this.bot.on('sticker', (ctx) => ctx.reply('👍'));
  //   // this.bot.hears('hi', (ctx) => ctx.reply('Hey there'));
  //   // this.bot.on('message', (ctx) => console.log(ctx.update.message));
  //   // GENERATE 6 digits code by request from backend, and link to bot. Then bot.start - message to enter code and check account
  //   //         bot.telegram.sendMessage(element,d+" : "+JSON.stringify(mes));
  //   this.bot.launch();
  // }
}
