import { IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class FillOrderDto {
  @IsNotEmpty()
  @IsString()
  transactionHash;

  @IsNotEmpty()
  @IsString()
  orderHash: string;

  @IsNotEmpty()
  @IsPositive()
  shares: number;

  @IsNotEmpty()
  @IsString()
  price: string;
}
