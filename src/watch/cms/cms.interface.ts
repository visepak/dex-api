export interface WatchesResponse {
  data: WatchCmsData[];
  meta: {
    pagination: {
      start: number;
      limit: number;
      total: number;
    };
  };
}

export interface WatchCmsData {
  id: number;
  attributes: CmsWatchAttributes;
}

export interface ICmsChartPoint {
  id?: number;
  value: string;
  timestamp: string;
}
export interface ICmsWatchImageData {
  id: number;
  attributes: {
    name: string;
    alternativeText: string;
    caption: string;
    width: number;
    height: number;
    formats: {
      small: WatchImage;
      medium: WatchImage;
      large: WatchImage;
      thumbnail: WatchImage;
    };
  };
}

export interface ICmsWatchCharacteristics {
  id: number;
  brand: string;
  model: string;
  mechanizm: string;
  reference: string;
  caseDiameter: string;
  caseMaterial: string;
  braceletMaterial: string;
  yearOfManufacture: string;
}

export interface CmsWatchAttributes {
  pid: number;
  brand: string;
  name: string;
  videoLink: string;
  custodyAddress: string;
  winHash: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  images?: {
    data: ICmsWatchImageData[];
  };
  mainImage?: {
    data: ICmsWatchImageData;
  };
  characteristics?: ICmsWatchCharacteristics;
  chart?: ICmsChartPoint[];
  chartData?: any[];
  api?: any;
}

interface WatchImage {
  ext: string;
  url: string;
  hash: string;
  mime: string;
  name: string;
  path: string;
  size: number;
  width: number;
  height: number;
}
