import { Module } from '@nestjs/common';
import { ProductQuestionController } from './product-questions.controller';
import { ProductQuestionService } from './product-questions.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [ProductQuestionController],
  providers: [ProductQuestionService],
  exports: [ProductQuestionService],
  imports: [CommonModule],
})
export class ProductQuestionModule {}
