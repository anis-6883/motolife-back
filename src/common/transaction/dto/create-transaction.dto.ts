import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  TransactionDirection,
  TransactionType,
} from '../enums/transaction-type.enum';

export class CreateTransactionDto {
  @IsMongoId()
  userId: string;

  @IsOptional()
  @IsMongoId()
  orderId?: string;

  @IsOptional()
  @IsMongoId()
  vendorId?: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsEnum(TransactionDirection)
  direction: TransactionDirection;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
