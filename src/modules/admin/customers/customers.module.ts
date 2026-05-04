import { Module } from '@nestjs/common';
import { CustomerController } from './customers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common/common.module';
import { RoleModule } from '../role/role.module';
import { CustomerService } from './customers.service';
import { Customer, CustomerSchema } from 'src/common/models/customers.schema';

@Module({
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
  imports: [
    RoleModule,
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Customer.name,
        schema: CustomerSchema,
      },
    ]),
  ],
})
export class CustomerModule {}
