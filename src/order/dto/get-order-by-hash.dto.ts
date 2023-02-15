import { IsNotEmpty, IsString } from 'class-validator';

export class GetOrderByHashDto {
  @IsNotEmpty()
  @IsString()
  orderHash: string;
}
