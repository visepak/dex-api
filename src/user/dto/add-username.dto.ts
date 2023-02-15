import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AddUsernameDto {
  @ApiProperty({ required: true })
  @IsString()
  @MinLength(1)
  @MaxLength(16)
  username: string;
}
