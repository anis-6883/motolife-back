import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { RefundService } from './refund.service';
import { Refund, RefundSchema } from 'src/common/models/refunds.schema';
import { RefundController } from './refund.controller';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  controllers: [RefundController],
  providers: [RefundService],
  exports: [RefundService],
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Refund.name,
        schema: RefundSchema,
      },
    ]),
  ],
})
export class RefundsModule {}
