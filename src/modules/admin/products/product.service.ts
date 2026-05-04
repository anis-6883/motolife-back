import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, type AggregatePaginateModel } from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { Product } from 'src/common/models/products.schema';
import { IActiveUser } from 'src/modules/customer/auth/interfaces/active-user.interface';
import { CreateProductDto } from 'src/common/dtos/products/create-products.dto';
import { GetProductsQueryDto } from 'src/common/dtos/products/get-products-query.dto';
import { Seller } from 'src/common/models/seller.schema';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction, ResourceType } from 'src/common/enums/admin.enum';
import { StockUnits } from 'src/common/models/stock-units';
import { CreateProductProvider } from './providers/create-product.provider';
import { GetProductProvider } from './providers/get-products.provider';
import { UpdateProductProvider } from './providers/update-product.provider';
import {
  UpdateProductDto,
  UpdateVariantDto,
} from 'src/common/dtos/products/update-products.dto';
import { Offers } from 'src/common/models/offers&deals.schema';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: AggregatePaginateModel<Product>,
    @InjectModel(Seller.name)
    private readonly sellerModel: Model<Seller>,
    @InjectModel(Offers.name)
    private readonly offerModel: Model<Offers>,
    @InjectModel(StockUnits.name)
    private readonly stockUnitsModel: Model<StockUnits>,

    private readonly activityService: ActivityService,
    private readonly createProductProvider: CreateProductProvider,
    private readonly getProductProvider: GetProductProvider,
    private readonly updateProductProvider: UpdateProductProvider,
  ) {}

  create(createProductDto: CreateProductDto, user: IActiveUser) {
    return this.createProductProvider.create(createProductDto, user);
  }

  findAllInhouse(query: GetProductsQueryDto) {
    return this.getProductProvider.findAllInhouse(query);
  }

  findAllVendorProducts(query: GetProductsQueryDto) {
    return this.getProductProvider.findAllVendorProducts(query);
  }

  findAllProductsForDropdown(query: GetProductsQueryDto) {
    return this.getProductProvider.findAllProductsForDropdown(query);
  }

  async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    const [product] = await this.productModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryData',
          pipeline: [
            {
              $project: {
                name: 1,
                logo: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$categoryData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'subCategory',
          foreignField: '_id',
          as: 'subCategoryData',
          pipeline: [
            {
              $project: {
                name: 1,
                logo: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$subCategoryData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brandData',
          pipeline: [
            {
              $project: {
                name: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$brandData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'benefits',
          localField: 'benefit',
          foreignField: '_id',
          as: 'benefitData',
          pipeline: [
            {
              $project: {
                title: 1,
                benefits: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$benefitData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'sellers',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller',
          pipeline: [
            {
              $project: {
                fullName: 1,
                image: 1,
                phone: 1,
                'store.storeName': 1,
                'store.address': 1,
                'store.logoImage': 1,
                totalProducts: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$seller',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          categoryName: '$categoryData.name',
          subCategoryName: '$subCategoryData.name',
          brandName: '$brandData.name',
        },
      },
      {
        $project: {
          softDeleted: 0,
          updatedAt: 0,
          categoryData: 0,
          subCategoryData: 0,
          brandData: 0,
        },
      },
    ]);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return apiResponse({
      data: product,
      message: 'Product fetched successfully',
    });
  }

  update(
    id: string,
    updateProductDto: UpdateProductDto & {
      _thumbnailUploaded: boolean;
      _deletedImages: string[];
      _deletedSizeGuideImages: string[];
    },
    user: IActiveUser,
  ) {
    return this.updateProductProvider.update(id, updateProductDto, user);
  }

  async updateVariant(
    productId: string,
    sku: string,
    updateVariantDto: UpdateVariantDto,
    user: IActiveUser,
  ) {
    const updateFields = {};
    for (const key in updateVariantDto) {
      if (updateVariantDto[key] !== undefined) {
        updateFields[`variants.$.${key}`] = updateVariantDto[key];
      }
    }

    const updatedProduct = await this.productModel.findOneAndUpdate(
      { _id: productId, 'variants.sku': sku },
      { $set: updateFields },
      { new: true },
    );

    if (!updatedProduct) {
      const productExists = await this.productModel.exists({ _id: productId });
      if (!productExists) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }
      throw new NotFoundException(
        `Variant with SKU ${sku} not found in this product`,
      );
    }

    await this.activityService.createActivity({
      title: 'Product Updated',
      action: ActivityAction.UPDATE,
      resourceType: ResourceType.PRODUCT,
      resourceId: updatedProduct._id,
      user: new Types.ObjectId(user.sub),
      payload: { ...updateVariantDto, sku },
    });

    return apiResponse({
      data: updatedProduct,
      message: 'Product variant updated successfully',
    });
  }

  async remove(id: string, user: IActiveUser) {
    const session = await this.productModel.db.startSession();
    session.startTransaction();
    try {
      const deletedProduct = await this.productModel.findByIdAndUpdate(
        id,
        { softDeleted: true },
        { new: true, session },
      );
      if (!deletedProduct) {
        throw new NotFoundException('Product not found');
      }

      await this.sellerModel.updateOne(
        { _id: new Types.ObjectId(deletedProduct.seller) },
        { $inc: { totalProducts: -1 } },
        {
          session,
        },
      );

      await this.stockUnitsModel.updateMany(
        { productId: deletedProduct._id },
        { softDeleted: true },
        {
          session,
        },
      );

      await this.offerModel.updateMany(
        {},
        {
          $pull: {
            items: { product: deletedProduct._id },
          },
        },
        { session },
      );
      // let imagesToDelete: string[] = [];

      // if (deletedProduct.thumbnail) {
      //   imagesToDelete.push(deletedProduct.thumbnail);
      // }

      // if (deletedProduct.images) {
      //   imagesToDelete.push(...deletedProduct.images);
      // }

      // if (imagesToDelete.length > 0) {
      //   await this.storageService.deleteFilesByUrls(imagesToDelete);
      // }

      await this.activityService.createActivity(
        {
          title: 'Product Deleted',
          action: ActivityAction.DELETE,
          resourceType: ResourceType.PRODUCT,
          resourceId: deletedProduct._id,
          user: new Types.ObjectId(user.sub),
        },
        session,
      );

      await session.commitTransaction();

      return apiResponse({
        status: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async removeVariant(id: string, sku: string, user: IActiveUser) {
    const deletedProduct = await this.productModel.findOneAndUpdate(
      { _id: id, 'variants.sku': sku },
      { $pull: { variants: { sku } } },
      { new: true },
    );
    if (!deletedProduct) {
      throw new NotFoundException('Variant not found');
    }

    await this.activityService.createActivity({
      title: 'Product Variant Deleted',
      action: ActivityAction.DELETE,
      resourceType: ResourceType.PRODUCT,
      resourceId: deletedProduct._id,
      user: new Types.ObjectId(user.sub),
      payload: { sku },
    });

    return apiResponse({
      status: true,
      message: 'Variant deleted successfully',
    });
  }

  async getProductsOfVariant(variation: string) {
    const products = await this.productModel.aggregate([
      {
        $match: {
          'variants.variation': variation,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          productId: 1,
          sellingPrice: 1,
          isDamaged: 1,
          variants: 1,
        },
      },
    ]);

    return apiResponse({
      data: products,
      message: 'Products fetched successfully',
    });
  }
}
