import { Module } from '@nestjs/common';
import { BenefitsService } from './benefit.service';
import { BenefitsController } from './benefit.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Benefits,
  BenefitsSchema,
} from '../../../common/models/benefits.schema';
import { CommonModule } from 'src/common/common.module';
import { RoleModule } from '../role/role.module';

@Module({
  controllers: [BenefitsController],
  providers: [BenefitsService],
  exports: [BenefitsService],
  imports: [
    RoleModule,
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Benefits.name,
        schema: BenefitsSchema,
      },
    ]),
  ],
})
export class BenefitsModule {}
