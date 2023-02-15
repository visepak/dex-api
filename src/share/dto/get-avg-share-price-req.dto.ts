import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class GetAvgSharePriceReqDto {
  @ApiProperty({
    isArray: true,
    type: 'string',
    required: false,
  })
  @IsOptional()
  watchIds?: string | string[];
}
