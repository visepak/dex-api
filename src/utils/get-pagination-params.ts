import { PaginationRequestDto } from './dto/pagination-request.dto';

export const getPaginationParams = (
  query: PaginationRequestDto,
  defaultLimit = 10,
) => {
  return {
    page: +query.page || 0,
    limit: +query.limit || defaultLimit,
  };
};
