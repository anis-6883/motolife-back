import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common/common.module';
import { RoleModule } from '../role/role.module';
import { InhouseController } from './inhouse.controller';
import { InhouseService } from './inhouse.service';
import { Seller, SellerSchema } from 'src/common/models/seller.schema';

@Module({
  controllers: [InhouseController],
  providers: [InhouseService],
  exports: [InhouseService],
  imports: [
    RoleModule,
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Seller.name,
        schema: SellerSchema,
      },
    ]),
  ],
})
export class InhouseModule {}
