import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common/common.module';
import { RoleModule } from '../role/role.module';
import { Product, ProductSchema } from 'src/common/models/products.schema';
import { Brand, BrandSchema } from 'src/common/models/brand.schema';
import { Category, CategorySchema } from 'src/common/models/category.schema';
import { Seller, SellerSchema } from 'src/common/models/seller.schema';
import { Benefits, BenefitsSchema } from 'src/common/models/benefits.schema';
import { CreateProductProvider } from './providers/create-product.provider';
import { GetProductProvider } from './providers/get-products.provider';
import { UpdateProductProvider } from './providers/update-product.provider';

@Module({
  controllers: [ProductController],
  providers: [
    ProductService,
    CreateProductProvider,
    GetProductProvider,
    UpdateProductProvider,
  ],
  exports: [ProductService],
  imports: [
    RoleModule,
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Product.name,
        schema: ProductSchema,
      },
      {
        name: Brand.name,
        schema: BrandSchema,
      },
      {
        name: Category.name,
        schema: CategorySchema,
      },
      {
        name: Seller.name,
        schema: SellerSchema,
      },
      {
        name: Benefits.name,
        schema: BenefitsSchema,
      },
    ]),
  ],
})
export class ProductModule {}
