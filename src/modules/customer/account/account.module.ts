import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { CreateCustomerProvider } from './providers/create-account.provider';

@Module({
  providers: [AccountService, CreateCustomerProvider],
  controllers: [AccountController],
  exports: [AccountService],
  imports: [],
})
export class AccountModule {}
