import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {} from '../../../common/models/brand.schema';
import { CommonModule } from 'src/common/common.module';
import { RoleModule } from '../role/role.module';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { Review, ReviewSchema } from 'src/common/models/review.schema';

@Module({
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
  imports: [
    RoleModule,
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Review.name,
        schema: ReviewSchema,
      },
    ]),
  ],
})
export class ReviewModule {}
