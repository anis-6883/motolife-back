import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Category,
  CategorySchema,
} from '../../../common/models/category.schema';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Category.name,
        schema: CategorySchema,
      },
    ]),
  ],
})
export class CategoryModule {}
