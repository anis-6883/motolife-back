import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from '../../../common/dtos/products/create-products.dto';
import {
  UpdateProductDto,
  UpdateVariantDto,
} from '../../../common/dtos/products/update-products.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  Model,
  PipelineStage,
  QueryFilter,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { GetProductsQueryDto } from '../../../common/dtos/products/get-products-query.dto';
import { Product } from 'src/common/models/products.schema';
import {
  PRODUCT_STATUS,
  UPDATE_REQUEST_STATUS,
} from 'src/common/enums/products.enum';
import { IActiveUser } from '../auth/interfaces/active-user.interface';
import { UpdateRequests } from 'src/common/models/products-update-requests.schema';
import { Seller } from 'src/common/models/seller.schema';
import { BusinessSettings } from 'src/common/models/business-settings.schema';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: AggregatePaginateModel<Product>,

    @InjectModel(UpdateRequests.name)
    private readonly updateRequestsModel: AggregatePaginateModel<UpdateRequests>,

    @InjectModel(Seller.name)
    private readonly sellerModel: AggregatePaginateModel<Seller>,

    @InjectModel(BusinessSettings.name)
    private readonly businessSettingsModel: Model<BusinessSettings>,
  ) {}

  async create(createProductDto: CreateProductDto, user: IActiveUser) {
    const vendorSettings = await this.businessSettingsModel
      .findOne({})
      .select('vendor')
      .lean();

    if (!vendorSettings?.vendor?.needNewProductApproval) {
      createProductDto.status = PRODUCT_STATUS.APPROVED;
    }

    await this.productModel.create({
      ...createProductDto,
      seller: new Types.ObjectId(user.sub),
    });

    await this.sellerModel.updateOne(
      { _id: new Types.ObjectId(user.sub) },
      { $inc: { totalProducts: 1 } },
    );

    return apiResponse({
      message: 'Product created successfully',
    });
  }

  async findAll(query: GetProductsQueryDto, user: IActiveUser) {
    const {
      page = 1,
      limit = 10,
      search,
      brand,
      category,
      isFeatured,
      isPublished,
      isNew,
      status,
    } = query;

    const filters: QueryFilter<Product> = { softDeleted: false };
    filters.seller = new Types.ObjectId(user.sub);

    if (search) {
      filters.name = { $regex: search, $options: 'i' };
    }

    if (brand) {
      filters.brand = new Types.ObjectId(brand);
    }

    if (isFeatured) {
      filters.isFeatured = isFeatured === 'true';
    }

    if (isPublished) {
      filters.isPublished = isPublished === 'true';
    }

    if (isNew) {
      filters.isNewArrived = isNew === 'true';
    }

    if (status) {
      filters.status = status;
    }

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
          pipeline: [
            {
              $project: {
                name: 1,
                logo: 1,
                slug: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'subCategory',
          foreignField: '_id',
          as: 'subCategory',
          pipeline: [
            {
              $project: {
                name: 1,
                logo: 1,
                slug: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$subCategory',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          ...(category && {
            'category.slug': { $regex: category, $options: 'i' },
          }),
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
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
          path: '$brand',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'benefits',
          localField: 'benefits',
          foreignField: '_id',
          as: 'benefits',
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
          path: '$benefits',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $project: {
          softDeleted: 0,
          updatedAt: 0,
        },
      },
    ];

    const result = await this.productModel.aggregatePaginate(pipeline, {
      page,
      limit: limit > 50 ? 50 : limit,
    });
    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Products fetched successfully',
    });
  }

  public async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    const product = await this.productModel
      .findById(id)
      .select('-softDeleted -updatedAt');
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return apiResponse({
      data: product,
      message: 'Product fetched successfully',
    });
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    user: IActiveUser,
  ) {
    const product = await this.productModel.findOne({
      _id: id,
      seller: new Types.ObjectId(user.sub),
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const updateData: UpdateProductDto = { ...updateProductDto };

    if (updateData.sizeGuide) {
      for (const key in updateData.sizeGuide) {
        updateData[`sizeGuide.${key}`] = updateData.sizeGuide[key];
      }
      delete updateData.sizeGuide;
    }

    const vendorSettings = await this.businessSettingsModel
      .findOne({})
      .select('vendor')
      .lean();

    if (vendorSettings?.vendor?.needUpdateProductApproval) {
      await this.updateRequestsModel.create({
        productId: id,
        sellerId: new Types.ObjectId(user.sub),
        changedData: updateData,
        status: PRODUCT_STATUS.PENDING,
      });
    } else {
      await this.productModel.findByIdAndUpdate(id, updateData, { new: true });
    }

    return apiResponse({
      message: vendorSettings?.vendor?.needUpdateProductApproval
        ? `Product update request submitted successfully`
        : `Product updated successfully`,
    });
  }

  async updateRequest(
    id: string,
    updateProductDto: UpdateProductDto,
    user: IActiveUser,
  ) {
    const product = await this.productModel.findOne({
      _id: id,
      seller: new Types.ObjectId(user.sub),
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${id} not found or unauthorized`,
      );
    }

    const vendorSettings = await this.businessSettingsModel
      .findOne({})
      .select('vendor')
      .lean();

    if (!vendorSettings?.vendor?.needUpdateProductApproval) {
      const updateData: UpdateProductDto = { ...updateProductDto };

      if (updateData.sizeGuide) {
        for (const key in updateData.sizeGuide) {
          updateData[`sizeGuide.${key}`] = updateData.sizeGuide[key];
        }
        delete updateData.sizeGuide;
      }

      await this.productModel.findByIdAndUpdate(id, updateData, {
        new: true,
      });
      return apiResponse({
        message: 'Product updated successfully',
      });
    } else {
      const existingRequest = await this.updateRequestsModel.findOne({
        productId: id,
        status: UPDATE_REQUEST_STATUS.PENDING,
      });

      const changes: Record<string, any> = {};
      const updateData: UpdateProductDto = { ...updateProductDto };

      if (updateData.sizeGuide) {
        for (const key in updateData.sizeGuide) {
          const fieldPath = `sizeGuide.${key}`;
          const oldValue = product.sizeGuide?.[key];
          const newValue = updateData.sizeGuide[key];

          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes[fieldPath] = newValue;
          }
        }
        delete updateData.sizeGuide;
      }

      if (updateData.variants) {
        const skus = updateData.variants.map((v) => v.sku);
        const uniqueSkus = new Set(skus);

        if (skus.length !== uniqueSkus.size) {
          throw new BadRequestException('Duplicate SKUs found in variants');
        }

        if (
          JSON.stringify(product.variants) !==
          JSON.stringify(updateData.variants)
        ) {
          changes.variants = updateData.variants;
        }

        delete updateData.variants;
      }

      for (const [key, value] of Object.entries(updateData)) {
        if (JSON.stringify(product[key]) !== JSON.stringify(value)) {
          changes[key] = value;
        }
      }

      if (Object.keys(changes).length === 0) {
        throw new Error('No changes detected');
      }

      if (existingRequest) {
        existingRequest.changedData = changes;
        await existingRequest.save();
        return apiResponse({
          data: existingRequest,
          message: 'Product update request updated successfully',
        });
      } else {
        await this.updateRequestsModel.create({
          productId: new Types.ObjectId(id),
          sellerId: new Types.ObjectId(user.sub),
          changedData: changes,
        });

        return apiResponse({
          message: 'Product update request submitted for approval',
        });
      }
    }
  }

  async updateVariant(
    productId: string,
    sku: string,
    updateVariantDto: UpdateVariantDto,
  ) {
    const updateFields = {};
    for (const key in updateVariantDto) {
      if (updateVariantDto[key] !== undefined) {
        updateFields[`variants.$.${key}`] = updateVariantDto[key];
      }
    }

    const updatedProduct = await this.productModel
      .findOneAndUpdate(
        { _id: productId, 'variants.sku': sku },
        { $set: updateFields },
        { new: true },
      )
      .exec();

    if (!updatedProduct) {
      const productExists = await this.productModel.exists({ _id: productId });
      if (!productExists) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }
      throw new NotFoundException(
        `Variant with SKU ${sku} not found in this product`,
      );
    }

    return apiResponse({
      data: updatedProduct,
      message: 'Variant updated successfully',
    });
  }

  async remove(id: string) {
    const deletedProduct = await this.productModel.findByIdAndUpdate(
      id,
      { softDeleted: true },
      { new: true },
    );
    if (!deletedProduct) {
      throw new NotFoundException('Product not found');
    }
    await this.sellerModel.updateOne(
      { _id: new Types.ObjectId(deletedProduct.seller) },
      { $inc: { totalProducts: -1 } },
    );

    return apiResponse({
      status: true,
      message: 'Product deleted successfully',
    });
  }

  async updateStatus(id: string, status: PRODUCT_STATUS) {
    const updatedProduct = await this.productModel.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedProduct) {
      throw new NotFoundException('Product not found');
    }
    return apiResponse({
      data: updatedProduct,
      message: 'Product status updated successfully',
    });
  }

  async removeVariant(id: string, sku: string) {
    const deletedProduct = await this.productModel.findOneAndUpdate(
      { _id: id, 'variants.sku': sku },
      { $pull: { variants: { sku } } },
      { new: true },
    );
    if (!deletedProduct) {
      throw new NotFoundException('Variant not found');
    }
    return apiResponse({
      status: true,
      message: 'Variant deleted successfully',
    });
  }
}
