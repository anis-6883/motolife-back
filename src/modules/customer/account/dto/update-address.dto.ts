import { PartialType } from '@nestjs/mapped-types';
import { AddressDto } from './create-customer.dto';

export class UpdateAddressDto extends PartialType(AddressDto) {}
