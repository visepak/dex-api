import { PaginationResponseDto } from '../../utils/dto/pagination-response.dto';
import { GetWatchReply } from './get-watches-response.dto';
import { BOOKMARK_LABEL } from '../../user/user.schema';

export class GetBookmarkedWatchesResDto extends PaginationResponseDto {
  watches: GetWatchReply[];
  bookmarks: Record<string, BOOKMARK_LABEL[]>;
}
