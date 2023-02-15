import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsString } from 'class-validator';
import { OrderType } from '../order.schema';

export class FindOrderToFillDto {
  @ApiProperty({ required: true })
  @IsNumberString()
  watchId: string;

  @ApiProperty({ required: true })
  @IsString()
  shares: string;

  @ApiProperty({ required: true })
  @IsString()
  price: string;

  @ApiProperty({ required: true })
  @IsNumberString(OrderType)
  orderType: string;
}
