import { Module } from '@nestjs/common';
import { ProductQuestionController } from './product-questions.controller';
import { ProductQuestionService } from './product-questions.service';
import { RoleModule } from '../role/role.module';

@Module({
  controllers: [ProductQuestionController],
  providers: [ProductQuestionService],
  exports: [ProductQuestionService],
  imports: [RoleModule],
})
export class ProductQuestionModule {}
