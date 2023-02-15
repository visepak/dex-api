import { DealResponse } from './deal-response.dto';
import { PaginationResponseDto } from '../../utils/dto/pagination-response.dto';

export class GetAllDealsResDto extends PaginationResponseDto {
  deals: DealResponse[];
}
