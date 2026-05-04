import { Module } from '@nestjs/common';
import { SellerAccountController } from './seller-account.controller';
import { SellerAccountService } from './seller-account.service';
import { CreateSellerProvider } from './providers/create-account.provider';
import { AccessTokenGuard } from 'src/common/guards/access-token.guard';

@Module({
  providers: [SellerAccountService, CreateSellerProvider, AccessTokenGuard],
  controllers: [SellerAccountController],
  exports: [SellerAccountService],
  imports: [],
})
export class SellerAccountModule {}
