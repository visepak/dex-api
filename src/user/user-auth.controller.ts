import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';
import { API_V1 } from '../app.config';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetProfileRes } from './dto/get-profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { LoginStatus } from './interface/login.interface';
import { AddEmailDto } from './dto/add-email.dto';
import { SuccessResponse } from './dto/success-response.dto';
import { LoginResponse } from './dto/login-res.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { LoginDto } from './dto/login.dto';
import { AddUsernameDto } from './dto/add-username.dto';
import { UpdateProfileResDto } from './dto/update-profile-res.dto';
import { UpdateNotificationTypeDto } from './dto/update-notification-type.dto';
import { UpdateNotificationChannelDto } from './dto/update-notification-channel.dto';

@ApiTags('user-auth')
@Controller(`${API_V1}/auth`)
export class UserAuthController {
  private readonly logger = new Logger(UserAuthController.name);
  constructor(
    @Inject(UserService)
    private usersService: UserService,
  ) {}

  // only for swagger
  @Post('/login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    this.logger.log(loginDto);
    return {
      loginStatus: LoginStatus.NOT_AUTH,
      kycAccessToken: null,
      accessToken: null,
      signature: null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('/profile')
  @ApiResponse({ type: GetProfileRes })
  getProfile(@Request() req: any): Promise<GetProfileRes> {
    return this.usersService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ deprecated: true })
  @Post('/profile/update')
  @ApiResponse({ type: UpdateProfileResDto })
  async updateProfile(
    @Request() req: any,
    @Body() updateProfile: UpdateProfileDto,
  ): Promise<UpdateProfileResDto> {
    try {
      return this.usersService.updateProfile({
        username: updateProfile.username.slice(0, 15),
        notificationTypes: updateProfile.notificationTypes,
        notificationChannels: updateProfile.notificationChannels,
        address: req.user.userId,
      });
    } catch (e) {
      this.logger.error(e);
      return { success: false, message: 'Unknown error' };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/profile/notification-type/update')
  @ApiResponse({ type: UpdateProfileResDto })
  async updateNotificationType(
    @Request() req: any,
    @Body() updateNotificationTypeDto: UpdateNotificationTypeDto,
  ): Promise<UpdateProfileResDto> {
    try {
      return this.usersService.updateNotificationType({
        notificationType: updateNotificationTypeDto.notificationType,
        state: updateNotificationTypeDto.state,
        address: req.user.userId,
      });
    } catch (e) {
      this.logger.error(e);
      return { success: false, message: 'Unknown error' };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/profile/notification-channel/update')
  @ApiResponse({ type: UpdateProfileResDto })
  async updateNotificationChannel(
    @Request() req: any,
    @Body() updateNotificationChannelDto: UpdateNotificationChannelDto,
  ): Promise<UpdateProfileResDto> {
    try {
      return this.usersService.updateNotificationChannel({
        notificationChannel: updateNotificationChannelDto.notificationChannel,
        state: updateNotificationChannelDto.state,
        address: req.user.userId,
      });
    } catch (e) {
      this.logger.error(e);
      return { success: false, message: 'Unknown error' };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/profile/username/add')
  @ApiResponse({ type: UpdateProfileResDto })
  async addUsername(
    @Request() req: any,
    @Body() addUsernameDto: AddUsernameDto,
  ): Promise<UpdateProfileResDto> {
    try {
      return this.usersService.addUsername({
        username: addUsernameDto.username,
        address: req.user.userId,
      });
    } catch (e) {
      this.logger.error(e);
      return { success: false, message: 'Unknown error' };
    }
  }

  // TODO: resend confirmation code, del email
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/email/add')
  @ApiResponse({ type: SuccessResponse })
  addEmail(
    @Request() req: any,
    @Body() addEmailDto: AddEmailDto,
  ): Promise<SuccessResponse> {
    return this.usersService.addEmail({
      address: req.user.userId,
      email: addEmailDto.email,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ type: SuccessResponse })
  @Post('/email/confirm')
  confirmEmail(
    @Request() req: any,
    @Body() confirmEmailDto: ConfirmEmailDto,
  ): Promise<SuccessResponse> {
    return this.usersService.confirmEmail({
      address: req.user.userId,
      confirmationCode: confirmEmailDto.confirmationCode,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ type: SuccessResponse })
  @Post('/email/delete')
  async deleteEmail(@Request() req: any): Promise<SuccessResponse> {
    try {
      return this.usersService.deleteEmail(req.user.userId);
    } catch (e) {
      this.logger.error(e);
      return { success: false };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ type: SuccessResponse })
  @Post('/telegram/delete')
  async deleteTelegram(@Request() req: any): Promise<SuccessResponse> {
    try {
      return this.usersService.deleteTelegram(req.user.userId);
    } catch (e) {
      this.logger.error(e);
      return { success: false };
    }
  }
}
