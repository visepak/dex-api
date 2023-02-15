import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsPositive,
  IsString,
} from 'class-validator';
import { OrderType } from '../order.schema';

export class AuthCreateOrderDto {
  @ApiProperty({ required: true, enum: OrderType })
  @IsNotEmpty()
  @IsEnum(OrderType)
  orderType: OrderType;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  orderHash: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  signature: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsPositive()
  shares: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  price: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsNumberString()
  watchId: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  salt: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  expiration: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  taker: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  maker: string;
}
