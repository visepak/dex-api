import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Point, SimplifyTo } from 'curvereduce';
import { ChartDocument } from './chart.schema';
import { Chart, GetChartDataResponse } from './dto/get-chart-data-response.dto';
import { EChartTimeframe, GetChartDataDto } from './dto/get-chart-data.dto';
import { USDC_DECIMALS } from '../app.config';

@Injectable()
export class ChartService {
  private readonly logger = new Logger(ChartService.name);
  private readonly POINTS_FOR_APPROXIMATION = 20;

  constructor(
    @InjectModel(Chart.name) private chartModel: Model<ChartDocument>,
  ) {}

  async getChartData(params: GetChartDataDto): Promise<GetChartDataResponse> {
    const oneDay = 1000 * 60 * 60 * 24;
    const endTimestamp = Date.now();

    let startTimestamp: number;

    switch (params.timeframe) {
      case EChartTimeframe.day:
        startTimestamp = endTimestamp - oneDay;
        break;
      case EChartTimeframe.week:
        startTimestamp = endTimestamp - oneDay * 7;
        break;
      case EChartTimeframe.month:
        startTimestamp = endTimestamp - oneDay * 30;
        break;
      case EChartTimeframe.all:
        break;
    }

    const timestampForSearching =
      (startTimestamp && Math.floor(startTimestamp / 1000)) || 0;

    const chart: Chart[] = await this.chartModel
      .find({
        watchId: params.watchId,
        // timestamp: {
        //   $gte: timestampForSearching,
        // },
      })
      .sort('+timestamp')
      .select('price timestamp -_id')
      // .limit(30) // Trading view lib
      .exec();

    let index;
    let resultPointsArray: Point[] = [];

    // Checking if any charts points exists
    if (chart.length) {
      // Looking for index which will show the first element with timestamp fallen in the frame
      for (let i = 0; i < chart.length; i++) {
        if (chart[i].timestamp >= timestampForSearching) {
          index = i;
          break;
        }
      }

      if (index >= 0) {
        // If index was found we are splitting array
        // timeframePoints - array with points inside frame (for last day for example)
        // previousPoints - array with points before frame
        const timeframePoints = chart.splice(index);
        const previousPoints = [...chart];

        // If there are no points outside frame - we addint point with price = 1 to resulting data
        if (!previousPoints.length) {
          resultPointsArray.push({
            x:
              timeframePoints[0]?.timestamp - 1000 ||
              Math.floor(endTimestamp / 1000),
            y: 1,
          });
        }

        // If there are points inside frame - we add them to result data
        if (timeframePoints.length) {
          resultPointsArray = [
            ...resultPointsArray,
            ...timeframePoints.map((point) => ({
              x: point.timestamp,
              y: point.price,
            })),
          ];
          // Manually adding last point with current price and timestamp (last point in the chart)
          resultPointsArray.push({
            x: Math.floor(endTimestamp / 1000),
            y: timeframePoints[timeframePoints.length - 1].price,
          });
        }
      } else {
        // if index wasn't found (it means there are no points inside the frame) - we just return two points with current price
        const timestamp = Math.floor(endTimestamp / 1000);
        resultPointsArray = [
          {
            x: timestamp - 1000,
            y: chart[chart.length - 1].price,
          },
          {
            x: timestamp,
            y: chart[chart.length - 1].price,
          },
        ];
      }
    } else {
      // If any charts points exists return 2 points with price = 1
      const timestamp = Math.floor(endTimestamp / 1000);
      resultPointsArray = [
        {
          x: timestamp - 1000,
          y: 1,
        },
        {
          x: timestamp,
          y: 1,
        },
      ];
    }

    const simplifiedPoints = SimplifyTo(
      resultPointsArray,
      this.POINTS_FOR_APPROXIMATION,
    ).map((point) => ({
      timestamp: point.x,
      price: +point.y.toFixed(USDC_DECIMALS),
    }));

    return { points: simplifiedPoints ?? [] };
  }

  async addChartTick({ watchId, price, timestamp }) {
    // const last4Deals = await this.chartModel
    //   .find({ watchId: watchId })
    //   .sort('-timestamp')
    //   .limit(4)
    //   .select('price')
    //   .exec();
    // const avgPrice = [...last4Deals, { price }].reduce((acc, val) => {
    //   return new BigNumber(val.price)
    //     .div(last4Deals.length + 1)
    //     .plus(acc)
    //     .toFixed(USDC_DECIMALS);
    // }, '0');
    const newChartTik = new this.chartModel({
      watchId: watchId,
      price,
      timestamp: timestamp,
      // avgPrice,
    });
    await newChartTik.save();
  }
}
