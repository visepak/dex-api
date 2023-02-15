import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class AuthFillOrderDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  transactionHash: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  orderHash: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsPositive()
  shares: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  price: string;
}
