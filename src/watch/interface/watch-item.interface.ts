import { Watch } from '../watch.schema';
import { CmsWatchAttributes } from '../cms/cms.interface';

export interface TransformWatchDataFromRepoReq {
  watch: Watch;
  cmsData: CmsWatchAttributes;
}
