import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

// TODO: validate number 6 digits ceil
export class ConfirmEmailDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsNumber()
  confirmationCode: number;
}
