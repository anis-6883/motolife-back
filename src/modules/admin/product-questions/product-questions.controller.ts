import {
  Controller,
  Get,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
  Put,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductQuestionService } from './product-questions.service';
import { GetProductQuestionQueryDto } from './dto/get-questions.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { CreateProductQuestionDto } from './dto/create-question.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class ProductQuestionController {
  constructor(private readonly reviewService: ProductQuestionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProductQuestionDto: CreateProductQuestionDto) {
    return this.reviewService.createProductQuestion(createProductQuestionDto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  findAll(@Query() query: GetProductQuestionQueryDto) {
    return this.reviewService.getProductQuestions(query);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.reviewService.updateProductQuestion(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  remove(@Param('id') id: string) {
    return this.reviewService.removeProductQuestion(id);
  }
}
