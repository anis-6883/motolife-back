import { Module } from '@nestjs/common';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { AdminUserModule } from './admin-user/admin-user.module';
import { AuthModule } from './admin-auth/auth.module';
import { RoleModule } from './role/role.module';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import { AccessTokenGuard } from 'src/common/guards/access-token.guard';
import { CategoryModule } from './category/category.module';
import { BrandModule } from './brand/brand.module';
import { AttributeModule } from './attributes/attribute.module';
import { BenefitsModule } from './benefit/benefit.module';
import { ProductModule } from './products/product.module';
import { ComboProductModule } from './combo-products/combo-product.module';
import { OrderModule } from './order/order.module';
import { RestockRequestModule } from './restock-request/restock-request.module';
import { ProductUpdateRequestsModule } from './product-update-requests/product-update-requests.module';
import { RefundModule } from './refund/refund.module';
import { SellerModule } from './sellers/sellers.module';
import { WithdrawModule } from './withdraw/withdraw.module';
import { CustomerModule } from './customers/customers.module';
import { ReviewModule } from './review/review.module';
import { OffersModule } from './offers-deals/offers.module';
import { BannerModule } from './banner/banner.module';
import { AnnouncementModule } from './announcement/announcement.module';
import { InhouseModule } from './inhouse/inhouse.module';
import { BusinessSettingsModule } from './business-settings/business-settings.module';
import { SettingsModule } from './settings/settings.module';
import { LandingSectionModule } from './landing-section/landing-section.module';
import { ActivityModule } from './activity/activity.module';
import { DisputeModule } from './dispute/dispute.module';
import { HeroBannerModule } from './hero-banner/hero-banner.module';
import { TempModule } from './temp/temp.module';
import { StockUnitModule } from './stock-units/stock-units.module';
import { ContactModule } from './contact/contact.module';
import { LimitedStockModule } from './limited-stock/limited-stock.module';
import { AppreciationModule } from './appreciation/appreciation.module';
import { ProductQuestionModule } from './product-questions/product-questions.module';
import { CouponModule } from './coupon/coupon.module';
import { WishlistModule } from './wishlist/wishlist.module';

@Module({
  providers: [
    AccessTokenGuard,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
  ],
  imports: [
    AdminUserModule,
    AuthModule,
    RoleModule,
    CategoryModule,
    BrandModule,
    AttributeModule,
    BenefitsModule,
    ProductModule,
    ComboProductModule,
    OrderModule,
    RestockRequestModule,
    ProductUpdateRequestsModule,
    RefundModule,
    SellerModule,
    WithdrawModule,
    CustomerModule,
    ReviewModule,
    OffersModule,
    BannerModule,
    AnnouncementModule,
    InhouseModule,
    BusinessSettingsModule,
    SettingsModule,
    LandingSectionModule,
    ActivityModule,
    DisputeModule,
    HeroBannerModule,
    TempModule,
    LimitedStockModule,
    StockUnitModule,
    ContactModule,
    AppreciationModule,
    ProductQuestionModule,
    CouponModule,
    WishlistModule,
    RouterModule.register([
      {
        path: 'admin',
        module: AdminModule,
        children: [
          { path: 'auth', module: AuthModule },
          { path: 'users', module: AdminUserModule },
          { path: 'roles', module: RoleModule },
          { path: 'categories', module: CategoryModule },
          { path: 'brands', module: BrandModule },
          { path: 'attributes', module: AttributeModule },
          { path: 'benefits', module: BenefitsModule },
          { path: 'products', module: ProductModule },
          { path: 'combo-products', module: ComboProductModule },
          { path: 'orders', module: OrderModule },
          { path: 'restock-requests', module: RestockRequestModule },
          { path: 'limited-stocks', module: LimitedStockModule },
          { path: 'update-requests', module: ProductUpdateRequestsModule },
          { path: 'refunds', module: RefundModule },
          { path: 'sellers', module: SellerModule },
          { path: 'withdraws', module: WithdrawModule },
          { path: 'customers', module: CustomerModule },
          { path: 'reviews', module: ReviewModule },
          { path: 'offers', module: OffersModule },
          { path: 'banners', module: BannerModule },
          { path: 'announcements', module: AnnouncementModule },
          { path: 'inhouse', module: InhouseModule },
          { path: 'business-settings', module: BusinessSettingsModule },
          { path: 'settings', module: SettingsModule },
          { path: 'landing-sections', module: LandingSectionModule },
          { path: 'activities', module: ActivityModule },
          { path: 'disputes', module: DisputeModule },
          { path: 'hero-banners', module: HeroBannerModule },
          { path: 'temp', module: TempModule },
          { path: 'stock-units', module: StockUnitModule },
          { path: 'contact', module: ContactModule },
          { path: 'appreciations', module: AppreciationModule },
          { path: 'product-questions', module: ProductQuestionModule },
          { path: 'coupons', module: CouponModule },
          { path: 'wishlist', module: WishlistModule },
        ],
      },
    ]),
  ],
})
export class AdminModule {}
