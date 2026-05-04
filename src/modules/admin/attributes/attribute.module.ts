import { Module } from '@nestjs/common';
import { AttributeService } from './attribute.service';
import { AttributeController } from './attribute.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Attribute,
  AttributeSchema,
} from '../../../common/models/attributes.schema';
import { CommonModule } from 'src/common/common.module';
import { RoleModule } from '../role/role.module';

@Module({
  controllers: [AttributeController],
  providers: [AttributeService],
  exports: [AttributeService],
  imports: [
    RoleModule,
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Attribute.name,
        schema: AttributeSchema,
      },
    ]),
  ],
})
export class AttributeModule {}
