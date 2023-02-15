import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { NOTIFICATION_CHANNEL, NOTIFICATION_TYPE } from '../user.schema';

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsString()
  username: string;

  @ApiProperty({ required: false })
  notificationTypes: Record<NOTIFICATION_TYPE, boolean>;

  @ApiProperty({ required: false })
  notificationChannels: Record<NOTIFICATION_CHANNEL, boolean>;
}
