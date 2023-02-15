import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum } from 'class-validator';
import { NOTIFICATION_CHANNEL } from '../user.schema';

export class UpdateNotificationChannelDto {
  @ApiProperty({
    required: true,
    enum: NOTIFICATION_CHANNEL,
  })
  @IsEnum(NOTIFICATION_CHANNEL)
  notificationChannel: NOTIFICATION_CHANNEL;

  @ApiProperty({ required: true })
  @IsBoolean()
  state: boolean;
}
