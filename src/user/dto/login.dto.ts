import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Eth address',
    type: 'string',
    pattern: '^0x[a-fA-F0-9]{40}$',
    required: true,
  })
  @IsString()
  address: string;

  @ApiProperty({ required: true })
  @IsString()
  signature: string;

  @ApiProperty({ required: true })
  @IsString()
  message: string;
}
