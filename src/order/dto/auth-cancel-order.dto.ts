import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthCancelOrderDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  orderHash: string;
}
