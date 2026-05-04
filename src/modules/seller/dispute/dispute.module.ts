import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {} from '../../../common/models/brand.schema';
import { CommonModule } from 'src/common/common.module';
import { DisputeController } from './dispute.controller';
import { DisputeService } from './dispute.service';
import { Dispute, DisputeSchema } from 'src/common/models/dispute.schema';

@Module({
  controllers: [DisputeController],
  providers: [DisputeService],
  exports: [DisputeService],
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Dispute.name,
        schema: DisputeSchema,
      },
    ]),
  ],
})
export class DisputeModule {}
