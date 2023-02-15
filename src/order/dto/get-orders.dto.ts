import { OrderState } from '../order.schema';
import { PaginationRequestDto } from '../../utils/dto/pagination-request.dto';

export class GetOrdersDto extends PaginationRequestDto {
  watchId: string;
  maker: string;
  state?: OrderState = OrderState.ACTIVE;
}
