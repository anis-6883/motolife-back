import {
  Controller,
  Get,
  Body,
  Param,
  Post,
  HttpCode,
  HttpStatus,
  Query,
  Delete,
  UseGuards,
  Put,
} from '@nestjs/common';
import { ProductQuestionService } from './product-questions.service';
import { CreateProductQuestionDto } from './dto/create-question.dto';
import { GetProductQuestionQueryDto } from './dto/get-questions.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from 'src/common/enums/auth-type.enum';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { type IActiveUser } from '../auth/interfaces/active-user.interface';
import { IdentityGuard } from 'src/common/guards/identity.guard';
import { type UserIdentity } from 'src/common/interfaces/identity.interface';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Controller()
@Auth(AuthType.None)
export class ProductQuestionController {
  constructor(private readonly reviewService: ProductQuestionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(IdentityGuard)
  create(
    @ActiveUser() user: UserIdentity,
    @Body() createProductQuestionDto: CreateProductQuestionDto,
  ) {
    return this.reviewService.createProductQuestion(
      user,
      createProductQuestionDto,
    );
  }

  @Get('/product/:id')
  findAll(@Param('id') id: string, @Query() query: GetProductQuestionQueryDto) {
    return this.reviewService.getProductQuestionsByProductId(id, query);
  }

  @Put(':id')
  @Auth(AuthType.Bearer)
  update(
    @ActiveUser() user: IActiveUser,
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.reviewService.updateProductQuestion(user, id, dto);
  }

  @Delete(':id')
  @Auth(AuthType.Bearer)
  remove(@ActiveUser() user: IActiveUser, @Param('id') id: string) {
    return this.reviewService.removeProductQuestion(user, id);
  }
}
