import { DealResponse } from './deal-response.dto';
import { PaginationResponseDto } from '../../utils/dto/pagination-response.dto';

export class GetLastDealsResDto extends PaginationResponseDto {
  deals: DealResponse[];
}
