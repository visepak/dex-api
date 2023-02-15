import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum EChartTimeframe {
  day = 'day',
  week = 'week',
  month = 'month',
  all = 'all',
}

export class GetChartDataDto {
  @ApiProperty({
    description: 'Watch Id',
    type: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  watchId: string;

  @ApiProperty({
    description: 'Timeframe for chart data',
    enum: EChartTimeframe,
    required: false,
  })
  @IsEnum(EChartTimeframe)
  timeframe: EChartTimeframe = EChartTimeframe.all;
}
