import {
  Controller,
  Get,
  Body,
  Param,
  Query,
  Delete,
  Put,
} from '@nestjs/common';
import { ProductQuestionService } from './product-questions.service';
import { GetProductQuestionQueryDto } from './dto/get-questions.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { type IActiveUser } from '../auth/interfaces/active-user.interface';

@Controller()
export class ProductQuestionController {
  constructor(private readonly reviewService: ProductQuestionService) {}

  @Get()
  findAll(
    @ActiveUser() user: IActiveUser,
    @Query() query: GetProductQuestionQueryDto,
  ) {
    return this.reviewService.getProductQuestions(user, query);
  }

  @Put(':id')
  update(
    @ActiveUser() user: IActiveUser,
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.reviewService.updateProductQuestion(user, id, dto);
  }

  @Delete(':id')
  remove(@ActiveUser() user: IActiveUser, @Param('id') id: string) {
    return this.reviewService.removeProductQuestion(user, id);
  }
}
