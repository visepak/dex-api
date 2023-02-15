export class Chart {
  price: number;
  timestamp: number;
}

export class GetChartDataResponse {
  points: Chart[];
}
