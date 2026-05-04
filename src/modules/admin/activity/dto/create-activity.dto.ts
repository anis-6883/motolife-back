import { Types } from 'mongoose';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsMongoId,
  IsEnum,
} from 'class-validator';
import { ResourceType } from 'src/common/enums/admin.enum';

export class CreateActivityDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsMongoId()
  @IsNotEmpty()
  user: Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  action: string;

  @IsEnum(ResourceType)
  @IsNotEmpty()
  resourceType: ResourceType;

  @IsMongoId()
  @IsOptional()
  resourceId?: Types.ObjectId;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  payload?: Record<string, any>;
}
