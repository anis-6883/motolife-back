import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AccountModule } from './account/account.module';
import { CustomerAuthModule } from './auth/customer-auth.module';
import { AccessTokenGuard } from 'src/common/guards/access-token.guard';
import { ProductModule } from './products/product.module';
import { ComboProductModule } from './combo-products/combo-product.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { CategoryModule } from './category/category.module';
import { ReviewModule } from './review/review.module';
import { OthersModule } from './others/others.module';
import { SellersModule } from './sellers/sellers.module';
import { RefundsModule } from './refunds/refund.module';
import { HeroBannerModule } from './hero-banner/hero-banner.module';
import { BrandModule } from './brand/brand.module';
import { BannerModule } from './banner/banner.module';
import { OffersModule } from './offers-deals/offers.module';
import { ContactModule } from './contact/contact.module';
import { AnnouncementModule } from './announcement/announcement.module';
import { WishListModule } from './wishlist/wishlist.module';
import { ProductQuestionModule } from './product-questions/product-questions.module';
import { CouponModule } from './coupon/coupon.module';

@Module({
  providers: [AccessTokenGuard],
  imports: [
    AccountModule,
    CustomerAuthModule,
    ProductModule,
    ComboProductModule,
    CartModule,
    OrderModule,
    CategoryModule,
    ReviewModule,
    OthersModule,
    SellersModule,
    RefundsModule,
    HeroBannerModule,
    BrandModule,
    BannerModule,
    OffersModule,
    ContactModule,
    AnnouncementModule,
    WishListModule,
    ProductQuestionModule,
    CouponModule,
    RouterModule.register([
      {
        path: 'customers',
        module: CustomerModule,
        children: [
          { path: 'account', module: AccountModule },
          { path: 'auth', module: CustomerAuthModule },
          { path: 'products', module: ProductModule },
          { path: 'combo-products', module: ComboProductModule },
          { path: 'cart', module: CartModule },
          { path: 'orders', module: OrderModule },
          { path: 'categories', module: CategoryModule },
          { path: 'reviews', module: ReviewModule },
          { path: 'others', module: OthersModule },
          { path: 'sellers', module: SellersModule },
          { path: 'refunds', module: RefundsModule },
          { path: 'hero-banners', module: HeroBannerModule },
          { path: 'brands', module: BrandModule },
          { path: 'banners', module: BannerModule },
          { path: 'offers', module: OffersModule },
          { path: 'contact', module: ContactModule },
          { path: 'announcements', module: AnnouncementModule },
          { path: 'wishlist', module: WishListModule },
          { path: 'product-questions', module: ProductQuestionModule },
          { path: 'coupons', module: CouponModule },
        ],
      },
    ]),
  ],
})
export class CustomerModule {}
