export class GetAvgSharePriceItemReplyDto {
  watchId: string;
  avgSharePrice: number;
}

export class GetAvgSharePricesReplyDto {
  avgSharePrices: GetAvgSharePriceItemReplyDto[];
}
