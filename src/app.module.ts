import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TelegrafModule } from 'nestjs-telegraf';
import * as Sentry from '@sentry/node';
import '@sentry/tracing';

import { AuthModule } from './auth/auth.module';
import { QueueModule } from './queue/queue.module';
import { OrderController } from './order/order.controller';
import { WatchController } from './watch/watch.controller';
import { ChartController } from './chart/chart.controller';
import { AuctionController } from './auction/auction.controller';
import { UserAuthController } from './user/user-auth.controller';
import { OrderAuthController } from './order/order-auth.controller';
import { DealAuthController } from './deal/deal-auth.controller';
import { WatchAuthController } from './watch/watch-auth.controller';
import { OrderService } from './order/order.service';
import { BcEventService } from './blockchain/event/bc-event.service';
import { OrdersCacheService } from './order/orders-cache.service';
import { WatchService } from './watch/watch.service';
import { EmailService } from './user/email.service';
import { UserService } from './user/user.service';
import { OrdersCheckerService } from './blockchain/order-checker/orders-checker.service';
import { BcLoopService } from './blockchain/bc-loop.service';
import { ChartService } from './chart/chart.service';
import { DealService } from './deal/deal.service';
import { TelegramService } from './user/telegram.service';
import { AuctionService } from './auction/auction.service';
import { NotificationService } from './user/notification.service';
import { BcEventModel } from './blockchain/event/bc-event.schema';
import { ChartModel } from './chart/chart.schema';
import { OrderModel } from './order/order.schema';
import { UserModel } from './user/user.schema';
import { WatchModel } from './watch/watch.schema';
import { DealModel } from './deal/deal.schema';
import { ProposalModel } from './auction/proposal.schema';
import { ThrottlerBehindProxyGuard } from './guards/throttler-behind-proxy.guard';
import { DB_OPTS, DB_URI, ENV, RATE_LIMITS, REDIS } from './app.config';
import { CmsService } from './watch/cms/cms.service';
import { WatchesCacheService } from './watch/watches-cache.service';
import { ShareService } from './share/share.service';
import { ShareAuthController } from './share/share-auth.controller';
import { ShareModel } from './share/share.schema';

@Module({
  imports: [
    // SentryModule.forRoot({
    //   dsn: ENV.SENTRY_DSN,
    //   tracesSampleRate: 1.0,
    //   debug: true,
    //   integrations: [
    //     new Sentry.Integrations.OnUncaughtException({
    //       onFatalError: async (err) => {
    //         if (err.name === 'SentryError') {
    //           console.log(err);
    //         } else {
    //           Sentry.getCurrentHub().getClient().captureException(err);
    //           process.exit(1);
    //         }
    //       },
    //     }),
    //     new Sentry.Integrations.OnUnhandledRejection({ mode: 'warn' }),
    //   ],
    // }),
    MongooseModule.forRoot(DB_URI, DB_OPTS),
    MongooseModule.forFeature([
      BcEventModel,
      ChartModel,
      OrderModel,
      UserModel,
      WatchModel,
      DealModel,
      ProposalModel,
      ShareModel,
    ]),
    TelegrafModule.forRoot({ token: ENV.TG_BOT_TOKEN }),
    BullModule.forRoot({ redis: REDIS }),
    BullModule.registerQueue({
      name: 'create-order',
    }),
    QueueModule,
    ThrottlerModule.forRoot(RATE_LIMITS.COMMON),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    AuthModule,
  ],
  controllers: [
    UserAuthController,
    OrderAuthController,
    OrderController,
    ChartController,
    WatchController,
    DealAuthController,
    AuctionController,
    WatchAuthController,
    ShareAuthController,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
    OrderService,
    OrdersCacheService,
    BcEventService,
    ChartService,
    WatchService,
    WatchesCacheService,
    EmailService,
    UserService,
    DealService,
    TelegramService,
    AuctionService,
    NotificationService,
    OrdersCheckerService,
    BcLoopService,
    CmsService,
    ShareService,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(Sentry.Handlers.requestHandler()).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
