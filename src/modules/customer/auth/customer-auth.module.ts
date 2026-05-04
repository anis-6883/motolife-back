import { Module } from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { GenerateTokenProvider } from './providers/generate-token.provider';
import { CustomerAuthController } from './customer-auth.controller';
import { AccessTokenGuard } from 'src/common/guards/access-token.guard';

@Module({
  providers: [CustomerAuthService, GenerateTokenProvider, AccessTokenGuard],
  imports: [],
  controllers: [CustomerAuthController],
  exports: [CustomerAuthService],
})
export class CustomerAuthModule {}
