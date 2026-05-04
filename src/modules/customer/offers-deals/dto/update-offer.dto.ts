import { PartialType } from '@nestjs/mapped-types';
import { CreateOffersDto } from './create-offer.dto';

export class UpdateOffersDto extends PartialType(CreateOffersDto) {}
