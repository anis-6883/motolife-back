import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ClientSession,
  Model,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { Product } from 'src/common/models/products.schema';
import { ActivityAction, ResourceType } from 'src/common/enums/admin.enum';
import { StorageService } from 'src/common/storage/storage.service';
import { Temp } from 'src/common/models/temp.schema';
import { StockUnits } from 'src/common/models/stock-units';
import { ActivityService } from '../../activity/activity.service';
import { IActiveUser } from 'src/modules/customer/auth/interfaces/active-user.interface';
import { UpdateProductDto } from 'src/common/dtos/products/update-products.dto';

@Injectable()
export class UpdateProductProvider {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: AggregatePaginateModel<Product>,
    @InjectModel(Temp.name)
    private readonly tempModel: Model<Temp>,
    @InjectModel(StockUnits.name)
    private readonly stockUnitsModel: Model<StockUnits>,

    private readonly activityService: ActivityService,
    private readonly storageService: StorageService,
  ) {}

  private async updateStockUnits(
    product: Product,
    updateProductDto: UpdateProductDto,
    session: ClientSession,
    isDamaged: boolean = false,
  ): Promise<void> {
    const stockUnits: Partial<StockUnits>[] = [];

    const uniqueBatchSuffix = product._id.toString().slice(-5).toUpperCase();

    const skuCounter: Record<string, number> = {};

    if (updateProductDto.variants && updateProductDto.variants.length > 0) {
      for (const variant of updateProductDto.variants) {
        const matchedVariant = product.variants.find(
          (v) => v.sku === variant.sku,
        );

        if (!skuCounter[variant.sku!]) {
          skuCounter[variant.sku!] = 0;
        }

        let total = variant.stock!;

        if (matchedVariant) {
          if (variant.stock! < matchedVariant.stock) {
            throw new BadRequestException(
              'Please delete stock units for this variant to reduce stock',
            );
          }
          total = variant.stock! - matchedVariant.stock;
        }

        if (total > 0) {
          for (let i = 0; i < total; i++) {
            skuCounter[variant.sku!]++;
            const currentCount = skuCounter[variant.sku!];

            stockUnits.push({
              sellerId: product.seller,
              productId: product._id,
              categoryId: product.category,
              parentSku: variant.sku,
              variation: variant.variation,
              sku: `${variant.sku}-${uniqueBatchSuffix}-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${String((matchedVariant?.stock || 0) + currentCount).padStart(2, '0')}`,
              sellingPrice: variant.variantPrice,
              isDamaged,
            });
          }
        }
      }
    } else {
      const total = updateProductDto.stockQuantity! - product.stockQuantity;
      if (total > 0) {
        for (let i = 0; i < total; i++) {
          stockUnits.push({
            sellerId: product.seller,
            productId: product._id,
            categoryId: product.category,
            parentSku: product.sku,
            sku: `${product.sku}-${uniqueBatchSuffix}-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${String(product.stockQuantity + i + 1).padStart(2, '0')}`,
            sellingPrice: product.sellingPrice,
            isDamaged,
          });
        }
      }
    }

    const deletedVariants = product.variants.filter(
      (v) => !updateProductDto.variants?.some((sv) => sv.sku === v.sku),
    );

    if (deletedVariants && deletedVariants.length > 0) {
      await this.stockUnitsModel.deleteMany(
        {
          productId: product._id,
          variation: { $in: deletedVariants.map((v) => v.variation) },
        },
        { session },
      );
    }

    console.log('stockUnits', stockUnits.length);
    if (stockUnits.length > 0) {
      await this.stockUnitsModel.insertMany(stockUnits, { session });
    }
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto & {
      _thumbnailUploaded: boolean;
      _deletedImages: string[];
      _deletedSizeGuideImages: string[];
    },
    user: IActiveUser,
  ) {
    const session = await this.productModel.db.startSession();
    session.startTransaction();

    try {
      const product = await this.productModel.findById(id).session(session);
      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      if (updateProductDto.stockQuantity) {
        if (updateProductDto.stockQuantity < 0) {
          throw new BadRequestException(
            'Stock quantity must be greater than 0',
          );
        }

        if (updateProductDto.stockQuantity < product.stockQuantity) {
          throw new BadRequestException(
            'Please delete stock units to decrease stock quantity',
          );
        }

        if (updateProductDto.variants && updateProductDto.variants.length > 0) {
          const totalStock = updateProductDto.variants.reduce(
            (acc, variant) => acc + (variant?.stock || 0),
            0,
          );
          if (totalStock !== updateProductDto.stockQuantity) {
            throw new BadRequestException(
              'Total stock quantity must match the sum of all variant stock quantities',
            );
          }
        }
        console.log('prevProduct', { product });
        console.log('updateProduct', { updateProductDto });
        if (updateProductDto.stockQuantity > product.stockQuantity) {
          await this.updateStockUnits(
            product,
            updateProductDto,
            session,
            updateProductDto.isDamaged || false,
          );
        }
      }

      if (updateProductDto._thumbnailUploaded && updateProductDto.thumbnail) {
        await this.storageService.deleteFileByUrl(product.thumbnail);
      }

      if (
        updateProductDto._deletedImages &&
        updateProductDto._deletedImages?.length > 0
      ) {
        await this.storageService.deleteFilesByUrls(
          updateProductDto._deletedImages,
        );
      }

      if (
        updateProductDto._deletedSizeGuideImages &&
        updateProductDto._deletedSizeGuideImages?.length > 0
      ) {
        await this.storageService.deleteFilesByUrls(
          updateProductDto._deletedSizeGuideImages,
        );
      }

      const updateData: UpdateProductDto = { ...updateProductDto };

      if (updateData.benefit) {
        updateData.benefit = new Types.ObjectId(updateData.benefit);
      }

      if (updateData.category) {
        updateData.category = new Types.ObjectId(updateData.category);
      }

      if (updateData.subCategory) {
        updateData.subCategory = new Types.ObjectId(updateData.subCategory);
      }

      if (updateData.brand) {
        updateData.brand = new Types.ObjectId(updateData.brand);
      }

      if (updateData.seller) {
        updateData.seller = new Types.ObjectId(updateData.seller);
      }

      if (updateData.sizeGuide) {
        for (const key in updateData.sizeGuide) {
          updateData[`sizeGuide.${key}`] = updateData.sizeGuide[key];
        }
        delete updateData.sizeGuide;
      }

      // if (
      //   updateData.hasDiscount &&
      //   updateData.discountType &&
      //   updateData.discountValue
      // ) {
      //   let unitPrice = updateData.sellingPrice || product.sellingPrice;

      //   let discountedPrice =
      //     updateData.discountType == DISCOUNT_TYPE.FLAT
      //       ? unitPrice - updateData.discountValue
      //       : unitPrice - (unitPrice * updateData.discountValue) / 100;

      //   if (
      //     updateData.discountPrice &&
      //     updateData.discountPrice !== discountedPrice
      //   ) {
      //     throw new BadRequestException('Invalid discount price!');
      //   }
      //   updateData.discountPrice = Math.floor(discountedPrice);
      // }

      const updatedProduct = await this.productModel
        .findByIdAndUpdate(id, { $set: updateData }, { new: true, session })
        .exec();

      if (!updatedProduct) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      const colorImages = updatedProduct.colorWiseImages?.map((c) => c.image);
      const imagesToCleanup = [
        ...(updatedProduct.images?.length > 0 ? updatedProduct.images : []),
        ...(updatedProduct.thumbnail ? [updatedProduct.thumbnail] : []),
        ...(updatedProduct.sizeGuide?.images?.length > 0
          ? updatedProduct.sizeGuide.images
          : []),
        ...(colorImages?.length > 0 ? colorImages : []),
      ];

      await this.tempModel.deleteMany({ url: { $in: imagesToCleanup } });

      await this.activityService.createActivity(
        {
          title:
            updateProductDto.isDamaged || updateProductDto.damageType
              ? 'Damage Updated'
              : 'Product Updated',
          action: ActivityAction.UPDATE,
          resourceType: ResourceType.PRODUCT,
          resourceId: updatedProduct._id,
          user: new Types.ObjectId(user.sub),
          payload: updateProductDto,
        },
        session,
      );

      await session.commitTransaction();

      return apiResponse({
        message: 'Product updated successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      console.log(error);
    } finally {
      await session.endSession();
    }
  }
}
