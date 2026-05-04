import { PartialType } from '@nestjs/mapped-types';
import { CreateProductQuestionDto } from './create-question.dto';

export class UpdateQuestionDto extends PartialType(CreateProductQuestionDto) {}
