import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { WithdrawFieldType } from 'src/common/enums/admin.enum';

class WithdrawFieldDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(WithdrawFieldType)
  type?: WithdrawFieldType;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

class WithdrawMethodDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WithdrawFieldDto)
  fields?: WithdrawFieldDto[];

  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateWithdrawMethodsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WithdrawMethodDto)
  withdrawMethods: WithdrawMethodDto[];
}
