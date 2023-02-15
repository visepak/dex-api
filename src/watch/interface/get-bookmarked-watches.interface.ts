import { BOOKMARK_LABEL } from '../../user/user.schema';

export interface GetBookmarkedWatches {
  watchBookmarks: Record<string, BOOKMARK_LABEL[]>;
  page: number;
  limit: number;
}
