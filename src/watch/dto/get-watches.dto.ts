import { FilterQuery } from 'mongoose';
import { PaginationRequestDto } from '../../utils/dto/pagination-request.dto';

export class GetWatchesDto extends PaginationRequestDto {
  findParams?: FilterQuery<any> = {};
}
