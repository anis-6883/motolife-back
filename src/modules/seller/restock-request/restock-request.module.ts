import { Module } from '@nestjs/common';
import { RestockRequestService } from './restock-request.service';
import { RestockRequestController } from './restock-request.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common/common.module';
import {
  RestockRequest,
  RestockRequestSchema,
} from 'src/common/models/restock-request.schema';

@Module({
  controllers: [RestockRequestController],
  providers: [RestockRequestService],
  exports: [RestockRequestService],
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      {
        name: RestockRequest.name,
        schema: RestockRequestSchema,
      },
    ]),
  ],
})
export class RestockRequestModule {}
