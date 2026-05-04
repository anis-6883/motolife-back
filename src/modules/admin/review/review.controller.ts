import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewService } from './review.service';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { GetReviewsQueryDto } from './dto/get-review-query.dto';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.createReview(createReviewDto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PRODUCT_REVIEW)
  findAll(@Query() query: GetReviewsQueryDto) {
    return this.reviewService.findAll(query);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_REVIEW)
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewService.update(id, updateReviewDto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_REVIEW)
  remove(@Param('id') id: string) {
    return this.reviewService.remove(id);
  }
}
