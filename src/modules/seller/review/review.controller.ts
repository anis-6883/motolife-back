import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewService } from './review.service';
import { GetReviewsQueryDto } from './dto/get-review-query.dto';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import type { IActiveUser } from '../auth/interfaces/active-user.interface';

@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  findAll(@Query() query: GetReviewsQueryDto, @ActiveUser() user: IActiveUser) {
    return this.reviewService.findAll(query, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.reviewService.update(id, updateReviewDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @ActiveUser() user: IActiveUser) {
    return this.reviewService.remove(id, user);
  }
}
