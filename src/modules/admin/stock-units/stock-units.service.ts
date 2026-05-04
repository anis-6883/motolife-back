import {
  BadRequestException,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { CreateStockUnitDto } from './dto/create-stock-unit.dto';
import { UpdateStockUnitDto } from './dto/update-stock-units.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  Model,
  PipelineStage,
  QueryFilter,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { GetStockUnitsQueryDto } from './dto/get-stock-units';
import { StockUnits } from 'src/common/models/stock-units';
import { Product } from 'src/common/models/products.schema';

@Injectable()
export class StockUnitService {
  constructor(
    @InjectModel(StockUnits.name)
    private readonly stockUnitModel: AggregatePaginateModel<StockUnits>,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
  ) {}

  async createDamageUnits(
    productId: string,
    createStockUnitDtos: CreateStockUnitDto[],
  ) {
    const session = await this.productModel.db.startSession();
    session.startTransaction();
    try {
      const productExists = await this.productModel
        .findById(productId)
        .session(session);

      if (!productExists) {
        throw new NotFoundException('Product not found');
      }

      const payloads: Partial<StockUnits>[] = createStockUnitDtos.map((dto) => {
        let parentSku = dto.parentSku;
        const isVariant = !!dto.variation;
        productExists.stockQuantity -= 1;
        if (isVariant) {
          const variant = productExists.variants.find(
            (v) => v.variation === dto.variation,
          );
          if (!variant) {
            throw new NotFoundException('Variant not found');
          }

          variant.stock -= 1;
          parentSku = variant.sku;
        }

        return {
          ...dto,
          productId: productExists._id,
          sellerId: productExists.seller,
          categoryId: productExists.category,
          sellingPrice: productExists.sellingPrice,
          parentSku,
          isDamaged: true,
          ...(isVariant && { variation: dto.variation }),
        };
      });

      await this.stockUnitModel.insertMany(payloads, {
        session,
      });

      await productExists.save({ session });

      await session.commitTransaction();

      return apiResponse({
        message: 'Stock units created successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async getDropdown(query: GetStockUnitsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      productId,
      variation,
      sortBy,
      sortOrder,
      isDamaged,
      p,
    } = query;

    const filters: QueryFilter<StockUnits> = { softDeleted: false };

    if (productId) {
      filters.productId = new Types.ObjectId(productId);
    }
    if (variation) {
      filters.variation = variation;
    }

    if (isDamaged) {
      filters.isDamaged = isDamaged === 'true';
    }

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
      },
      {
        $sort: {
          [sortBy]: sortOrder === 'asc' ? 1 : -1,
        },
      },
      {
        $project: {
          sku: 1,
        },
      },
    ];

    if (p === 'false') {
      const result = await this.stockUnitModel.aggregate(pipeline);

      return apiResponse({
        data: result,
        message: 'Stock units fetched successfully',
      });
    } else {
      const result = await this.stockUnitModel.aggregatePaginate(pipeline, {
        page,
        limit: limit > 50 ? 50 : limit,
      });

      const { docs, ...rest } = result;

      return apiResponse({
        data: { docs, pagination: rest },
        message: 'Stock units fetched successfully',
      });
    }
  }

  async findAll(query: GetStockUnitsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      productId,
      variation,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isDamaged,
      category,
      sku,
      p,
    } = query;

    const filters: QueryFilter<StockUnits> = { softDeleted: false };

    if (productId) {
      filters.productId = new Types.ObjectId(productId);
    }

    if (category) {
      filters.categoryId = new Types.ObjectId(category);
    }

    if (variation) {
      filters.variation = variation;
    }

    if (isDamaged) {
      filters.isDamaged = isDamaged === 'true';
    }

    if (sku) {
      filters.sku = sku;
    }

    if (search) {
      // const product = await this.productModel.findOne({
      //   sku: { $regex: search, $options: 'i' },
      // });

      filters.$or = [
        { parentSku: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
      },
      {
        $sort: {
          [sortBy]: sortOrder === 'asc' ? 1 : -1,
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
          pipeline: [
            {
              $project: {
                name: 1,
                thumbnail: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$product',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
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
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          softDeleted: 0,
          createdAt: 0,
          updatedAt: 0,
          productId: 0,
          categoryId: 0,
          sellerId: 0,
        },
      },
    ];

    if (p === 'false') {
      const result = await this.stockUnitModel.aggregate(pipeline);

      return apiResponse({
        data: result,
        message: 'Stock units fetched successfully',
      });
    } else {
      const result = await this.stockUnitModel.aggregatePaginate(pipeline, {
        page,
        limit: limit > 50 ? 50 : limit,
      });

      const { docs, ...rest } = result;

      return apiResponse({
        data: { docs, pagination: rest },
        message: 'Stock units fetched successfully',
      });
    }
  }

  async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    try {
      const stockUnit = await this.stockUnitModel
        .findById(id)
        .select('-softDeleted');

      if (!stockUnit) {
        throw new NotFoundException('Stock unit not found');
      }
      return apiResponse({
        data: stockUnit,
        message: 'Stock unit fetched successfully',
      });
    } catch (error) {
      throw new RequestTimeoutException(error.message);
    }
  }

  async update(id: string, updateStockUnitDto: UpdateStockUnitDto) {
    const session = await this.stockUnitModel.db.startSession();
    session.startTransaction();

    try {
      const stockUnitExists = await this.stockUnitModel.findById(id);

      if (!stockUnitExists) {
        throw new NotFoundException('Stock unit not found');
      }

      if (updateStockUnitDto.isDamaged && !stockUnitExists.isDamaged) {
        const isVariant = !!stockUnitExists?.variation;

        if (isVariant) {
          await this.productModel.findOneAndUpdate(
            {
              _id: stockUnitExists?.productId,
              variants: {
                $elemMatch: {
                  sku: stockUnitExists?.parentSku,
                  stock: { $gt: 0 },
                },
              },
            },
            {
              $inc: {
                'variants.$.stock': updateStockUnitDto.isDamaged ? -1 : 0,
                stockQuantity: updateStockUnitDto.isDamaged ? -1 : 0,
              },
            },
            { new: true, session },
          );
        } else {
          await this.productModel.findOneAndUpdate(
            {
              _id: stockUnitExists?.productId,
              stockQuantity: { $gt: 0 },
            },
            {
              $inc: {
                stockQuantity: updateStockUnitDto.isDamaged ? -1 : 0,
              },
            },
            { new: true, session },
          );
        }
      }

      const updatedStockUnit = await this.stockUnitModel.findByIdAndUpdate(
        id,
        updateStockUnitDto,
        {
          new: true,
          runValidators: true,
          session,
        },
      );

      await session.commitTransaction();

      return apiResponse({
        data: updatedStockUnit,
        message: 'Stock unit updated successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async updateMany(updateStockUnitsDto: UpdateStockUnitDto[]) {
    const session = await this.stockUnitModel.db.startSession();
    session.startTransaction();

    try {
      const updatedStockUnits = await Promise.all(
        updateStockUnitsDto.map(async (update) => {
          const { _id, ...updateFields } = update;

          if (updateFields.isDamaged === false) {
            throw new BadRequestException(
              'You cannot unmark a damaged stock unit',
            );
          }

          const stockUnitExists = await this.stockUnitModel
            .findById(_id)
            .session(session);

          if (!stockUnitExists) {
            throw new NotFoundException(`Stock unit with id ${_id} not found`);
          }

          if (updateFields.isDamaged && !stockUnitExists.isDamaged) {
            const stockDelta = updateFields.isDamaged ? -1 : 0;
            const isVariant = !!stockUnitExists?.variation;

            if (isVariant) {
              await this.productModel.findOneAndUpdate(
                {
                  _id: stockUnitExists.productId,
                  variants: {
                    $elemMatch: {
                      sku: stockUnitExists?.parentSku,
                      stock: { $gt: 0 },
                    },
                  },
                },
                {
                  $inc: {
                    'variants.$.stock': stockDelta,
                    stockQuantity: stockDelta,
                  },
                },
                { new: true, session },
              );
            } else {
              await this.productModel.findOneAndUpdate(
                { _id: stockUnitExists.productId, stockQuantity: { $gt: 0 } },
                { $inc: { stockQuantity: stockDelta } },
                { new: true, session },
              );
            }
          }

          return this.stockUnitModel.findByIdAndUpdate(_id, updateFields, {
            new: true,
            runValidators: true,
            session,
          });
        }),
      );

      await session.commitTransaction();

      return apiResponse({
        message: `${updatedStockUnits.length} stock units updated successfully`,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async deleteStockUnit(id: string) {
    const session = await this.stockUnitModel.db.startSession();
    session.startTransaction();

    try {
      const deletedStockUnit = await this.stockUnitModel.findByIdAndUpdate(
        id,
        {
          softDeleted: true,
        },
        { new: true, session },
      );

      if (!deletedStockUnit) {
        throw new NotFoundException('Stock unit not found');
      }

      if (!deletedStockUnit.isDamaged) {
        const isVariant = !!deletedStockUnit?.variation;

        if (isVariant) {
          await this.productModel.findOneAndUpdate(
            {
              _id: deletedStockUnit?.productId,
              variants: {
                $elemMatch: {
                  sku: deletedStockUnit?.parentSku,
                  stock: { $gt: 0 },
                },
              },
            },
            {
              $inc: {
                'variants.$.stock': -1,
                stockQuantity: -1,
              },
            },
            { new: true, session },
          );
        } else {
          await this.productModel.findOneAndUpdate(
            {
              _id: deletedStockUnit?.productId,
              stockQuantity: { $gt: 0 },
            },
            {
              $inc: {
                stockQuantity: -1,
              },
            },
            { new: true, session },
          );
        }
      }

      await session.commitTransaction();

      return apiResponse({
        message: 'Stock unit deleted successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
