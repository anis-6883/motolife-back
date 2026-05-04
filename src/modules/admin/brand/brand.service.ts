import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  Model,
  PipelineStage,
  QueryFilter,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { Brand } from '../../../common/models/brand.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { GetBrandsQueryDto } from './dto/get-brands-query.dto';
import { StorageService } from 'src/common/storage/storage.service';
import { Product } from 'src/common/models/products.schema';
import { Temp } from 'src/common/models/temp.schema';

@Injectable()
export class BrandService {
  constructor(
    @InjectModel(Brand.name)
    private readonly brandModel: AggregatePaginateModel<Brand>,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    @InjectModel(Temp.name)
    private readonly tempModel: Model<Temp>,
    private readonly storageService: StorageService,
  ) {}

  async create(createBrandDto: CreateBrandDto) {
    await this.brandModel.create(createBrandDto);
    if (createBrandDto.image) {
      await this.tempModel.deleteOne({ url: createBrandDto.image });
    }
    return apiResponse({
      message: 'Brand created successfully',
    });
  }

  async findAll(query: GetBrandsQueryDto) {
    const { search, status } = query;

    const filters: QueryFilter<Brand> = { softDeleted: false };

    if (search) {
      filters.name = { $regex: search, $options: 'i' };
    }

    if (status) {
      filters.status = status as boolean;
    }

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
      },
      {
        $sort: { position: 1 },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'brand',
          as: 'products',
          pipeline: [
            {
              $match: {
                softDeleted: false,
              },
            },
            {
              $project: {
                _id: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          totalProducts: { $size: '$products' },
        },
      },
      {
        $project: {
          position: 0,
          updatedAt: 0,
          softDeleted: 0,
          products: 0,
          createdAt: 0,
        },
      },
    ];

    const result = await this.brandModel.aggregate(pipeline);

    return apiResponse({
      data: result,
      message: 'Brands fetched successfully',
    });
  }

  public async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    const brand = await this.brandModel
      .findById(id)
      .select('-softDeleted -updatedAt -createdAt');
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    return apiResponse({ data: brand, message: 'Brand fetched successfully' });
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    const brand = await this.brandModel.findById(id);

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    if (updateBrandDto._uploaded && brand.image) {
      await this.storageService.deleteFileByUrl(brand.image);
    }

    const payload = Object.fromEntries(
      Object.entries(updateBrandDto).filter(([_, v]) => v !== undefined),
    );

    const updatedBrand = await this.brandModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    // if (updateBrandDto.status !== undefined) {
    //   await this.productModel.updateMany(
    //     {
    //       brand: new Types.ObjectId(id),
    //       softDeleted: false,
    //     },
    //     {
    //       $set: {
    //         isPublished: updateBrandDto.status,
    //       },
    //     },
    //   );
    // }

    return apiResponse({
      data: updatedBrand,
      message: 'Brand updated successfully',
    });
  }

  async remove(id: string) {
    const session = await this.brandModel.db.startSession();
    session.startTransaction();

    try {
      const deletedBrand = await this.brandModel.findByIdAndUpdate(
        id,
        { softDeleted: true },
        {
          session,
          new: true,
          runValidators: true,
        },
      );
      if (!deletedBrand) {
        throw new NotFoundException('Brand not found');
      }

      if (deletedBrand.image) {
        await this.storageService.deleteFileByUrl(deletedBrand.image);
      }

      await this.productModel.updateMany(
        {
          brand: deletedBrand._id,
          softDeleted: false,
        },
        {
          $set: { softDeleted: true },
        },
        { session },
      );

      await session.commitTransaction();

      return apiResponse({
        status: true,
        message: 'Brand deleted successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updateStatus(id: string, status: boolean) {
    const updatedBrand = await this.brandModel.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedBrand) {
      throw new NotFoundException('Brand not found');
    }
    return apiResponse({
      data: updatedBrand,
      message: 'Brand status updated successfully',
    });
  }

  async sort(sortedIds: string[]) {
    const bulkOps = sortedIds.map((item, index) => ({
      updateOne: {
        filter: { _id: item },
        update: { position: index + 1 },
      },
    }));

    const data = await this.brandModel.bulkWrite(bulkOps, {
      ordered: false,
    });
    return apiResponse({
      data,
      status: true,
      message: 'Brands sorted successfully!',
    });
  }
}
