import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetFilteredOrderBookDto {
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  watchId: string;

  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  minSharesAmount: string;
}
