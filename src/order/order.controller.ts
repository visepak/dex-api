import { Controller, Get, Inject, Logger, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { API_V1 } from '../app.config';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrderBookRes } from './dto/order-book-res.dto';
import { GetFilteredOrderBookDto } from './dto/auth-get-filtered-order-book.dto';

@ApiTags('order')
@Controller(`${API_V1}/order`)
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(
    @Inject(OrderService)
    private readonly orderService: OrderService,
  ) {}

  @Get(`/order-book`)
  @ApiResponse({ type: OrderBookRes })
  async getOrderBook(
    @Query() params: GetFilteredOrderBookDto,
  ): Promise<OrderBookRes> {
    // TODO: return Not Found Exception or Bad Request Exception if there is no such watchId. Now it returns 500.
    const result = this.orderService.getOrderBook({
      watchId: params.watchId,
      minSharesAmount: params.minSharesAmount,
    });
    return result;
  }
}
