import { IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetWatchDto {
  @ApiProperty({ type: 'string', nullable: true })
  @IsNumberString()
  watchId: string;
}
