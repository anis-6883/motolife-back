import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { ProductQuestionController } from './product-questions.controller';
import { ProductQuestionService } from './product-questions.service';

@Module({
  controllers: [ProductQuestionController],
  providers: [ProductQuestionService],
  exports: [ProductQuestionService],
  imports: [CommonModule],
})
export class ProductQuestionModule {}
