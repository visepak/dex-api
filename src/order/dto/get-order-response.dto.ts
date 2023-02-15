import { OrderResponse } from './order-response.dto';
import { PaginationResponseDto } from '../../utils/dto/pagination-response.dto';

export class GetOrdersResponse extends PaginationResponseDto {
  orders: OrderResponse[];
}
