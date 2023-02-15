import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString } from 'class-validator';
import { PaginationRequestDto } from '../../utils/dto/pagination-request.dto';

export class GetAuctionHistoryDto extends PaginationRequestDto {
  @ApiProperty({ type: 'string', nullable: false })
  @IsNumberString()
  watchId: string;
}
