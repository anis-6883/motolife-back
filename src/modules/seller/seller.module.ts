import { Module } from '@nestjs/common';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { SellerAuthModule } from './auth/seller-auth.module';
import { SellerAccountModule } from './account/seller-account.module';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import { AccessTokenGuard } from 'src/common/guards/access-token.guard';
import { ProductModule } from './products/product.module';
import { ComboProductModule } from './combo-products/combo-product.module';
import { OrderModule } from './orders/order.module';
import { WithdrawModule } from './withdraw/withdraw.module';
import { ReviewModule } from './review/review.module';
import { OffersModule } from './offers-deals/offers.module';
import { RestockRequestModule } from './restock-request/restock-request.module';
import { RefundModule } from './refund/refund.module';
import { ProductUpdateRequestsModule } from './product-update-requests/product-update-requests.module';
import { DisputeModule } from './dispute/dispute.module';
import { LimitedStockModule } from './limited-stock/limited-stock.module';
import { AppreciationModule } from './appreciation/appreciation.module';
import { ProductQuestionModule } from './product-questions/product-questions.module';

@Module({
  providers: [
    AccessTokenGuard,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
  ],
  imports: [
    SellerAccountModule,
    SellerAuthModule,
    ProductModule,
    ComboProductModule,
    OrderModule,
    WithdrawModule,
    ReviewModule,
    OffersModule,
    RestockRequestModule,
    RefundModule,
    ProductUpdateRequestsModule,
    DisputeModule,
    LimitedStockModule,
    AppreciationModule,
    ProductQuestionModule,
    RouterModule.register([
      {
        path: 'sellers',
        module: SellerModule,
        children: [
          { path: 'account', module: SellerAccountModule },
          { path: 'auth', module: SellerAuthModule },
          { path: 'products', module: ProductModule },
          { path: 'combo-products', module: ComboProductModule },
          { path: 'orders', module: OrderModule },
          { path: 'withdraws', module: WithdrawModule },
          { path: 'reviews', module: ReviewModule },
          { path: 'offers', module: OffersModule },
          { path: 'restock-requests', module: RestockRequestModule },
          { path: 'refunds', module: RefundModule },
          { path: 'update-requests', module: ProductUpdateRequestsModule },
          { path: 'disputes', module: DisputeModule },
          { path: 'limited-stocks', module: LimitedStockModule },
          { path: 'appreciations', module: AppreciationModule },
          { path: 'product-questions', module: ProductQuestionModule },
        ],
      },
    ]),
  ],
})
export class SellerModule {}
