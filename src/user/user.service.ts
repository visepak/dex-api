import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AddEmailReq,
  AddEmailRes,
  ConfirmationEmailCacheData,
  ConfirmEmailReq,
  ConfirmEmailRes,
} from './interface/user-service.interface';
import { EmailService } from './email.service';
import { GetProfileRes } from './dto/get-profile-response.dto';
import {
  BOOKMARK_LABEL,
  NOTIFICATION_CHANNEL,
  User,
  UserDocument,
} from './user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TelegramService } from './telegram.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { randomUUID } from 'crypto';
import { AddUsernameDto } from './dto/add-username.dto';
import { errorCode } from '../utils/error-code';
import { UpdateProfileResDto } from './dto/update-profile-res.dto';
import { UpdateNotificationTypeDto } from './dto/update-notification-type.dto';
import { UpdateNotificationChannelDto } from './dto/update-notification-channel.dto';
import { UpdateWatchBookmarksResDto } from '../watch/dto/update-bookmarks-res.dto';
import { AddWatchBookmarksDto } from '../watch/dto/add-watch-bookmarks.dto';
import { DeleteWatchBookmarksDto } from '../watch/dto/delete-watch-bookmarks.dto';

const confirmationEmailCache: Record<string, ConfirmationEmailCacheData> = {};
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(EmailService)
    private readonly emailService: EmailService,
    @Inject(TelegramService)
    private readonly telegramService: TelegramService,
  ) {}

  async getUserByAddress(address: string) {
    return await this.userModel.findOne({ address }).exec();
  }
  async getProfile(userId: string): Promise<GetProfileRes> {
    const user = await this.userModel.findOne({ address: userId }).exec();
    if (!!user) {
      if (!user.telegramConfirmationCode) {
        user.telegramConfirmationCode = randomUUID();
        await user.save();
      }
      const telegramLink = !user.telegramChatId
        ? this.telegramService.getTelegramLink(user.telegramConfirmationCode)
        : null;
      return {
        telegramLink,
        address: user.address,
        email: user.email,
        emailConfirmed: user.emailConfirmed,
        telegramChatId: user.telegramChatId,
        username: user.username,
        notificationTypes: user.notificationTypes,
        notificationChannels: user.notificationChannels,
      };
    }
    const newUser = new this.userModel({
      address: userId,
      telegramConfirmationCode: randomUUID(),
    });
    await newUser.save();
    const telegramLink = this.telegramService.getTelegramLink(
      newUser.telegramConfirmationCode,
    );
    return {
      telegramLink,
      address: newUser.address,
      notificationTypes: newUser.notificationTypes,
      notificationChannels: newUser.notificationChannels,
    } as GetProfileRes;
    // throw new HttpException('NOT_FOUND', HttpStatus.NOT_FOUND);
  }

  async updateProfile(
    data: UpdateProfileDto & { address: string },
  ): Promise<UpdateProfileResDto> {
    const currentUser = await this.userModel
      .findOne({ address: data.address })
      .exec();
    const user = !!currentUser
      ? currentUser
      : new this.userModel({ address: data.address });
    if (!!data.username) {
      if (data.username !== user.username) {
        const userNameUsed = await this.userModel
          .findOne({
            username: data.username,
          })
          .exec();
        if (!!userNameUsed) {
          return { success: false, message: 'user name already used' };
        }
        user.username = data.username;
      }
    } else {
      user.username = null;
    }
    user.notificationChannels = { ...data.notificationChannels };
    user.notificationTypes = { ...data.notificationTypes };
    await user.save();
    return { success: true };
  }

  async updateNotificationType(
    data: UpdateNotificationTypeDto & { address: string },
  ): Promise<UpdateProfileResDto> {
    const { address, notificationType, state } = data;
    if (!notificationType) {
      return;
    }
    const user = await this.getUserOrCreate(address);
    await this.userModel.updateOne(
      { address },
      {
        notificationTypes: {
          ...user.notificationTypes,
          [notificationType]: !!state,
        },
      },
    );
    return { success: true };
  }

  async updateNotificationChannel(
    data: UpdateNotificationChannelDto & { address: string },
  ): Promise<UpdateProfileResDto> {
    const { address, notificationChannel, state } = data;
    if (!notificationChannel) {
      return { success: false };
    }
    const user = await this.getUserOrCreate(address);
    await this.userModel.updateOne(
      { address },
      {
        notificationChannels: {
          ...user.notificationChannels,
          [notificationChannel]: !!state,
        },
      },
    );
    return { success: true };
  }

  async addUsername(
    data: AddUsernameDto & { address: string },
  ): Promise<UpdateProfileResDto> {
    if (!data.username) {
      return;
    }
    if (data.username.length > 16) {
      return { success: false, ...errorCode['003'] };
    }
    const user = await this.getUserOrCreate(data.address);
    if (!!user.username) {
      return { success: false, ...errorCode['002'] };
    }
    const userNameUsed = await this.userModel
      .findOne({
        username: data.username,
      })
      .exec();
    if (!!userNameUsed) {
      return { success: false, ...errorCode['001'] };
    }
    user.username = data.username;

    await user.save();
    return { success: true };
  }

  private async getUserOrCreate(address: string) {
    const currentUser = await this.userModel.findOne({ address }).exec();
    if (!currentUser) {
      return await new this.userModel({ address }).save();
    }
    return currentUser;
  }

  async addEmail(req: AddEmailReq): Promise<AddEmailRes> {
    const { address, email } = req;
    const user = await this.userModel.findOne({ address }).exec();
    if (!!user && !!user.email && !!user.emailConfirmed) {
      throw new HttpException('ALREADY ADDED', HttpStatus.BAD_REQUEST);
    }
    const updatedUser = !!user
      ? user
      : new this.userModel({
          address,
        });
    updatedUser.email = email;
    updatedUser.emailConfirmed = false;
    await updatedUser.save();

    const confirmationCode = Math.floor(100000 + Math.random() * 900000);
    confirmationEmailCache[address] = {
      email,
      confirmationCode,
      timestamp: Date.now(),
    };
    const { success } = await this.emailService.sendConfirmationToAddEmail({
      email,
      confirmationCode,
    });
    return { success };
  }
  // TODO: add change email, delete email

  async confirmEmail(req: ConfirmEmailReq): Promise<ConfirmEmailRes> {
    const { address, confirmationCode } = req;
    const confirmationEmail = confirmationEmailCache[address];
    const codeExpirationTime = Date.now() - 1000 * 60 * 60;
    if (
      !confirmationEmail ||
      !confirmationEmail.confirmationCode ||
      confirmationEmail.timestamp < codeExpirationTime
    ) {
      throw new HttpException('Code expired', HttpStatus.BAD_REQUEST);
    }
    if (confirmationEmail.confirmationCode !== confirmationCode) {
      throw new HttpException('Wrong code', HttpStatus.BAD_REQUEST);
    }
    const user = await this.userModel.findOne({ address }).exec();
    if (!!user && !!user.email && !!user.emailConfirmed) {
      throw new HttpException('ALREADY ', HttpStatus.BAD_REQUEST);
    }
    user.emailConfirmed = true;
    await user.save();
    return { success: true };
  }

  async deleteEmail(address: string): Promise<ConfirmEmailRes> {
    const user = await this.userModel.findOne({ address }).exec();
    user.notificationChannels = {
      ...user.notificationChannels,
      [NOTIFICATION_CHANNEL.email]: null,
    };
    user.email = null;
    user.emailConfirmed = false;
    await user.save();
    return { success: true };
  }

  async deleteTelegram(address: string): Promise<ConfirmEmailRes> {
    const user = await this.userModel.findOne({ address }).exec();
    user.notificationChannels = {
      ...user.notificationChannels,
      [NOTIFICATION_CHANNEL.telegram]: null,
    };
    user.telegramChatId = null;
    user.telegramConfirmationCode = null;
    await user.save();
    return { success: true };
  }

  async getWatchBookmarks(
    address: string,
  ): Promise<Record<string, BOOKMARK_LABEL[]>> {
    const user = await this.userModel.findOne({ address }).exec();
    return !!user && !!user.watchBookmarks ? user.watchBookmarks : {};
  }

  async addWatchBookmarks(
    req: AddWatchBookmarksDto & { address: string },
  ): Promise<UpdateWatchBookmarksResDto> {
    const { address, watchId, bookmarks } = req;
    const user = await this.userModel.findOne({ address }).exec();
    if (!user || isNaN(+watchId)) {
      return { success: false };
    }
    const newWatchBookmarks = Array.isArray(user.watchBookmarks[watchId])
      ? Array.from(new Set([...user.watchBookmarks[watchId], ...bookmarks]))
      : bookmarks;

    user.watchBookmarks = {
      ...user.watchBookmarks,
      [watchId]: newWatchBookmarks,
    };
    await user.save();
    return { success: true };
  }

  async deleteWatchBookmarks(
    req: DeleteWatchBookmarksDto & { address: string },
  ): Promise<UpdateWatchBookmarksResDto> {
    const { address, watchId, bookmarks } = req;
    const user = await this.userModel.findOne({ address }).exec();
    if (
      !user ||
      !user.watchBookmarks ||
      !user.watchBookmarks[watchId] ||
      !Array.isArray(user.watchBookmarks[watchId])
    ) {
      return { success: true };
    }
    const newWatchBookmarks = user.watchBookmarks[watchId].filter(
      (item) => !bookmarks.includes(item),
    );
    const watchBookmarks = user.watchBookmarks;
    if (newWatchBookmarks.length > 0) {
      watchBookmarks[watchId] = newWatchBookmarks;
    } else {
      delete watchBookmarks[watchId];
    }
    await this.userModel.updateOne(
      { address: user.address },
      { watchBookmarks },
    );
    return { success: true };
  }
}
