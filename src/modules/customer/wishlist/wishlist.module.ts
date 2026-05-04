import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { WishListController } from './wishlist.controller';
import { WishListService } from './wishlist.service';

@Module({
  controllers: [WishListController],
  providers: [WishListService],
  exports: [WishListService],
  imports: [CommonModule],
})
export class WishListModule {}
