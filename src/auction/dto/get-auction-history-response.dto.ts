import { PaginationResponseDto } from '../../utils/dto/pagination-response.dto';

export class GetAuctionHistoryResDto extends PaginationResponseDto {
  history: AuctionHistoryItemDto[];
}

export class AuctionHistoryItemDto {
  price: string;
  shares: string;
  totalShares: string;
  creator: string; // TODO: remove depricated
  proposer: string;
  createdDate: string;
  canceledDate: string;
}
