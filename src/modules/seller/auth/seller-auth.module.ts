import { Module } from '@nestjs/common';
import { SellerAuthService } from './seller-auth.service';
import { GenerateTokenProvider } from './providers/generate-token.provider';
import { AccessTokenGuard } from 'src/common/guards/access-token.guard';
import { SellerAuthController } from './seller-auth.controller';

@Module({
  providers: [SellerAuthService, GenerateTokenProvider, AccessTokenGuard],
  imports: [],
  controllers: [SellerAuthController],
  exports: [SellerAuthService],
})
export class SellerAuthModule {}
