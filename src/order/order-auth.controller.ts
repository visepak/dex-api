import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { API_V1 } from '../app.config';
import { FindOrderToFillDto } from './dto/find-order-to-fill.dto';
import { OrderService } from './order.service';
import { AuthCreateOrderDto } from './dto/auth-create-order.dto';
import { AuthGetOrdersDto } from './dto/auth-get-orders.dto';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetOrdersResponse } from './dto/get-order-response.dto';
import { FindOrderToFillRes } from './dto/find-order-to-fill-res.dto';
import { AuthFillOrderDto } from './dto/auth-fill-order.dto';
import { AuthCancelOrderDto } from './dto/auth-cancel-order.dto';
import { DealService } from '../deal/deal.service';
import { getPaginationParams } from '../utils/get-pagination-params';
import { UserService } from '../user/user.service';
import { CreateOrderResponseDto } from './dto/auth-create-order-res.dto';
import { FillOrderResponse } from './dto/fill-order-res.dto';
import { CancelOrderResponse } from './dto/auth-cancel-order-res.dto';
import { ShareService } from '../share/share.service';

@ApiTags('order-auth')
@Controller(`${API_V1}/auth/order`)
export class OrderAuthController {
  private readonly logger = new Logger(OrderAuthController.name);
  constructor(
    @Inject(OrderService)
    private readonly orderService: OrderService,
    @Inject(DealService)
    private readonly dealService: DealService,
    @Inject(UserService)
    private readonly userService: UserService,
    @Inject(ShareService)
    private readonly shareService: ShareService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/create')
  @ApiResponse({ type: CreateOrderResponseDto })
  async createOrder(
    @Request() req: any,
    @Body() createOrderAuthDto: AuthCreateOrderDto,
  ): Promise<CreateOrderResponseDto> {
    try {
      const user = await this.userService.getUserByAddress(req.user.userId);
      const result = this.orderService.createOrder({
        ...createOrderAuthDto,
        maker: req.user.userId,
        makerUsername: user?.username || null,
      });
      return result;
    } catch (error) {
      this.logger.error(error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(`/all`)
  @ApiResponse({ type: GetOrdersResponse })
  async getOrders(
    @Request() req: any,
    @Query() getOrdersAuthDto: AuthGetOrdersDto,
  ): Promise<GetOrdersResponse> {
    try {
      const pagination = getPaginationParams(getOrdersAuthDto);
      return await this.orderService.getOrders({
        watchId: getOrdersAuthDto.watchId,
        state: getOrdersAuthDto.state,
        maker: req.user.userId,
        ...pagination,
      });
    } catch (error) {
      this.logger.error(error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(`/order-to-fill`)
  @ApiResponse({ type: FindOrderToFillRes })
  async findOrderToFill(
    @Request() req: any,
    @Query() params: FindOrderToFillDto,
  ): Promise<FindOrderToFillRes> {
    const result = await this.orderService.findOrderToFill({
      ...params,
      user: req.user.userId,
    });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(`/fill-order`)
  // @ApiOperation({ deprecated: true })
  @ApiResponse({ type: FillOrderResponse })
  async fillOrder(
    @Request() req: any,
    @Body() fillOrderDto: AuthFillOrderDto,
  ): Promise<FillOrderResponse> {
    const address = req.user.userId;
    console.log(`fillOrder - taker - ${address}`);
    const { orderHash } = fillOrderDto;
    try {
      const canUserCreateDeal = await this.dealService.canUserCreateDeal(
        address,
      );
      if (!canUserCreateDeal) {
        return { success: false };
      }
      const user = await this.userService.getUserByAddress(req.user.userId);
      const order = await this.orderService.getOrderByHash(orderHash);
      if (!order) {
        this.logger.error(
          `fillOrder failed, order with error. orderHash: ${orderHash}`,
        );
        return { success: false };
      }
      await this.dealService.createDealWithTxHash(
        address,
        fillOrderDto,
        order,
        user,
      );
      await this.orderService.fillOrder(address, fillOrderDto, order);
      await this.shareService.updateHandleShares(address, fillOrderDto, order);
      return { success: true };
    } catch (error) {
      this.logger.error(error);
      return { success: false };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(`/cancel`)
  @ApiResponse({ type: CancelOrderResponse })
  cancelOrder(
    @Request() req: any,
    @Body() cancelOrderDto: AuthCancelOrderDto,
  ): Promise<CancelOrderResponse> {
    try {
      this.logger.log('cancelOrder ' + JSON.stringify(cancelOrderDto));
      return this.orderService.cancelOrder({
        orderHash: cancelOrderDto.orderHash,
        address: req.user.userId,
      });
    } catch (error) {
      this.logger.error(error);
    }
  }
}
