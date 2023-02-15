import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString } from 'class-validator';
import { PaginationRequestDto } from '../../utils/dto/pagination-request.dto';

export class GetLastDealsDto extends PaginationRequestDto {
  @ApiProperty({ required: true })
  @IsNumberString()
  watchId: string;
}
