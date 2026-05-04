import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  UseGuards,
  Query,
  Put,
} from '@nestjs/common';

import { CategoryService } from './category.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from 'src/common/enums/auth-type.enum';

@Controller()
@Auth(AuthType.None)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  findAllCategories(@Query() query: { search: string }) {
    return this.categoryService.findAllCategories(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.categoryService.findById(id);
  }
}
