import { PartialType } from '@nestjs/mapped-types';
import { CreateBenefitsDto } from './create-benefit.dto';

export class UpdateBenefitsDto extends PartialType(CreateBenefitsDto) {}
