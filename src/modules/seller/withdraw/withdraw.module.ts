import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common/common.module';
import { WithdrawController } from './withdraw.controller';
import { WithdrawService } from './withdraw.service';
import { Withdraw, WithdrawSchema } from 'src/common/models/withdraw.schema';

@Module({
  controllers: [WithdrawController],
  providers: [WithdrawService],
  exports: [WithdrawService],
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Withdraw.name,
        schema: WithdrawSchema,
      },
    ]),
  ],
})
export class WithdrawModule {}
