import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { Product, ProductSchema } from './models/products.schema';
import { Customer, CustomerSchema } from './models/customers.schema';
import { StorageService } from './storage/storage.service';
import { StorageController } from './storage/storage.controller';
import { SmsProvider } from './providers/sms/sms.provider';
import { OtpProvider } from './providers/sms/otp.provider';
import { QueryBuilderProvider } from './query-builder/query-builder.provider';
import { PaginationProvider } from './pagination/providers/pagination.provider';
import { AccessTokenGuard } from './guards/access-token.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigType } from '@nestjs/config';
import authConfig from 'src/config/auth.config';
import { Seller, SellerSchema } from './models/seller.schema';
import { HashingProvider } from 'src/modules/admin/admin-auth/providers/hashing.provider';
import { BcryptProvider } from 'src/modules/admin/admin-auth/providers/bcrypt.provider';
import {
  BusinessSettings,
  BusinessSettingsSchema,
} from './models/business-settings.schema';
import { Activity, ActivitySchema } from 'src/common/models/activity.schema';
import { Offers, OffersSchema } from './models/offers&deals.schema';
import {
  ComboProduct,
  ComboProductSchema,
} from './models/combo-products.schema';
import { Temp, TempSchema } from './models/temp.schema';
import { DeliveryService } from './delivery/delivery.service';
import { DeliveryController } from './delivery/delivery.controller';
import { WebhooksService } from './webhooks/webhooks.service';
import { WebhooksController } from './webhooks/webhooks.controller';
import { Order, OrderSchema } from './models/order.schema';
import { OtpTokenProvider } from './providers/sms/otp-token.provider';
import { EmailProvider } from './providers/email/email.provider';
import { NodemailerProvider } from './providers/email/nodemailer.provider';
import { EmailController } from './email/email.controller';
import { EmailService } from './email/email.service';
import {
  LimitedStock,
  LimitedStockSchema,
} from './models/limited-stocks.schema';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ScheduleModule } from '@nestjs/schedule';
import { StockUnits, StockUnitsSchema } from './models/stock-units';
import { ComboBanner, ComboBannerSchema } from './models/combo-banner';
import { AdminUser, AdminUserSchema } from './models/admin-users.schema';
import { YoutubeService } from './youtube/youtube.service';
import { YoutubeController } from './youtube/youtube.controller';
import { Refund, RefundSchema } from './models/refunds.schema';
import { Appreciation, AppreciationSchema } from './models/appreciation.schema';
import {
  ProductQuestion,
  ProductQuestionSchema,
} from './models/product-questions.schema';
import { Coupon, CouponSchema } from './models/coupon.schema';
import { WishList, WishListSchema } from './models/wishlist.schema';
import { Transaction, TransactionSchema } from './models/transaction.schema';
import { TransactionService } from './transaction/transaction.service';
import { TransactionController } from './transaction/transaction.controller';
import { CouponUsage, CouponUsageSchema } from './models/coupon-usage.schema';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [authConfig.KEY],
      useFactory: (config: ConfigType<typeof authConfig>) => ({
        secret: config.secret,
        signOptions: {
          audience: config.audience,
          issuer: config.issuer,
          expiresIn: config.accessTokenTtl,
        },
      }),
    }),
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ComboProduct.name, schema: ComboProductSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Seller.name, schema: SellerSchema },
      { name: BusinessSettings.name, schema: BusinessSettingsSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: Offers.name, schema: OffersSchema },
      { name: Temp.name, schema: TempSchema },
      { name: Order.name, schema: OrderSchema },
      { name: LimitedStock.name, schema: LimitedStockSchema },
      { name: StockUnits.name, schema: StockUnitsSchema },
      { name: ComboBanner.name, schema: ComboBannerSchema },
      { name: AdminUser.name, schema: AdminUserSchema },
      { name: Refund.name, schema: RefundSchema },
      { name: Appreciation.name, schema: AppreciationSchema },
      { name: ProductQuestion.name, schema: ProductQuestionSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: CouponUsage.name, schema: CouponUsageSchema },
      { name: WishList.name, schema: WishListSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    CacheModule.register({
      isGlobal: true,
      ttl: 60 * 60 * 1000,
    }),
    SchedulerModule,
    ScheduleModule.forRoot(),
  ],
  exports: [
    MongooseModule,
    StorageService,
    DeliveryService,
    OtpProvider,
    OtpTokenProvider,
    HashingProvider,
    QueryBuilderProvider,
    PaginationProvider,
    NodemailerProvider,
    EmailService,
    CacheModule,
    YoutubeService,
    TransactionService,
  ],
  controllers: [
    YoutubeController,
    StorageController,
    DeliveryController,
    WebhooksController,
    EmailController,
    TransactionController,
  ],
  providers: [
    AccessTokenGuard,
    StorageService,
    YoutubeService,
    DeliveryService,
    WebhooksService,
    OtpTokenProvider,
    NodemailerProvider,
    QueryBuilderProvider,
    EmailService,
    TransactionService,
    PaginationProvider,
    { provide: OtpProvider, useClass: SmsProvider },
    {
      provide: HashingProvider,
      useClass: BcryptProvider,
    },
    {
      provide: EmailProvider,
      useClass: NodemailerProvider,
    },
  ],
})
export class CommonModule {}
