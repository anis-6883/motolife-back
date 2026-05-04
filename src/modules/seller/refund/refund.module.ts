import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common/common.module';
import { Refund, RefundSchema } from 'src/common/models/refunds.schema';
import { RefundController } from './refund.controller';
import { RefundService } from './refund.service';

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
export class RefundModule {}
