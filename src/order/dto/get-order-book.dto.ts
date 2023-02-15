import { IsNotEmpty, IsString } from 'class-validator';

export class GetOrderBookDto {
  @IsString()
  @IsNotEmpty()
  watchId: string;
}
