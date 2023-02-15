import { OrderState } from '../order.schema';
import { PaginationRequestDto } from '../../utils/dto/pagination-request.dto';
import { IsEnum, IsNotEmpty, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthGetOrdersDto extends PaginationRequestDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsNumberString()
  watchId: string;

  @ApiProperty({ required: false, enum: OrderState })
  @IsEnum(OrderState)
  state?: OrderState = OrderState.ACTIVE;
}
