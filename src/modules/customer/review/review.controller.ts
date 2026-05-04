import {
  Controller,
  Get,
  Body,
  Param,
  Post,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { GetProductReviewDto } from './dto/get-product-review.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from 'src/common/enums/auth-type.enum';

@Controller()
@Auth(AuthType.None)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth(AuthType.Bearer)
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.createReview(createReviewDto);
  }

  @Get('product/:id')
  findByProductId(
    @Param('id') id: string,
    @Query() query: GetProductReviewDto,
  ) {
    return this.reviewService.findByProductId(id, query);
  }

  @Get('combo/:comboProductId')
  findByComboProductId(
    @Param('comboProductId') comboProductId: string,
    @Query() query: GetProductReviewDto,
  ) {
    return this.reviewService.findByComboProductId(comboProductId, query);
  }
}
