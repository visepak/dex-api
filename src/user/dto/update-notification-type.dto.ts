import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum } from 'class-validator';
import { NOTIFICATION_TYPE } from '../user.schema';

export class UpdateNotificationTypeDto {
  @ApiProperty({
    required: true,
    enum: NOTIFICATION_TYPE,
  })
  @IsEnum(NOTIFICATION_TYPE)
  notificationType: NOTIFICATION_TYPE;

  @ApiProperty({ required: true })
  @IsBoolean()
  state: boolean;
}
