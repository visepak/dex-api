import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationRequestDto } from '../../utils/dto/pagination-request.dto';
import { WatchStatus } from '../watch.schema';

export class GetFilteredWatchesDto extends PaginationRequestDto {
  @ApiProperty({
    isArray: true,
    type: 'string',
    required: false,
  })
  @IsOptional()
  watchIds?: string | string[];

  @ApiProperty({
    isArray: true,
    type: 'string',
    required: false,
  })
  @IsOptional()
  statuses?: string | string[]; //WatchStatus[];

  @ApiProperty({
    type: 'number',
    required: false,
  })
  @IsOptional()
  minPrice?: number;

  @ApiProperty({
    type: 'number',
    required: false,
  })
  @IsOptional()
  maxPrice?: number;

  @ApiProperty({
    isArray: true,
    type: 'string',
    required: false,
  })
  @IsOptional()
  brands?: string | string[];

  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsOptional()
  sortBy?: 'price' | 'date';

  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsOptional()
  orderBy?: 'asc' | 'desc';
}
