import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category } from '../../../common/models/category.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { Product } from 'src/common/models/products.schema';
import { StorageService } from 'src/common/storage/storage.service';
import { GetCategoryQueryDto } from './dto/get-category-query.dto';
import { Temp } from 'src/common/models/temp.schema';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    @InjectModel(Temp.name)
    private readonly tempModel: Model<Temp>,
    private readonly storageService: StorageService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const session = await this.categoryModel.db.startSession();
    session.startTransaction();

    const imagesToCleanup: string[] = [];
    if (createCategoryDto.image) imagesToCleanup.push(createCategoryDto.image);

    if (createCategoryDto.subCategories) {
      createCategoryDto.subCategories.forEach((sub) => {
        if (sub.image) imagesToCleanup.push(sub.image);
      });
    }

    try {
      const { subCategories, ...rest } = createCategoryDto;

      const [parentCategory] = await this.categoryModel.create([{ ...rest }], {
        session,
      });

      if (subCategories && subCategories.length > 0) {
        const subcategoriesData = subCategories.map((item) => ({
          ...item,
          parent: parentCategory._id,
        }));

        await this.categoryModel.insertMany(subcategoriesData, { session });
      }

      await this.tempModel.deleteMany(
        { url: { $in: imagesToCleanup } },
        { session },
      );

      await session.commitTransaction();

      return apiResponse({
        message: 'Category created successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      if (imagesToCleanup.length > 0) {
        await Promise.all(
          imagesToCleanup.map((url) =>
            this.storageService.deleteFileByUrl(url),
          ),
        ).catch((s3Err) => console.error('S3 Cleanup Failed:', s3Err));
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findAllCategories(query: GetCategoryQueryDto) {
    const { search, status } = query;

    const categories = await this.categoryModel.aggregate([
      {
        $match: {
          ...(search && { name: { $regex: search, $options: 'i' } }),
          ...(status !== undefined && { status }),
          softDeleted: false,
          parent: null,
        },
      },
      {
        $sort: {
          position: 1,
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: 'parent',
          as: 'subCategories',
          pipeline: [
            {
              $match: {
                softDeleted: false,
              },
            },
            {
              $sort: { position: 1 },
            },
            {
              $project: {
                position: 0,
                updatedAt: 0,
                // softDeleted: 0,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',
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
          totalSubCategories: { $size: '$subCategories' },
          totalProducts: { $size: '$products' },
        },
      },
      {
        $project: {
          position: 0,
          updatedAt: 0,
          softDeleted: 0,
          products: 0,
        },
      },
    ]);

    return apiResponse({
      data: categories,
      message: 'Categories fetched successfully',
    });
  }

  public async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    const [category] = await this.categoryModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(id),
          parent: null,
          softDeleted: false,
        },
      },
      {
        $sort: {
          position: 1,
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: 'parent',
          as: 'subCategories',
          pipeline: [
            {
              $match: {
                softDeleted: false,
              },
            },
            {
              $sort: { position: 1 },
            },
            {
              $project: {
                position: 0,
                updatedAt: 0,
                softDeleted: 0,
              },
            },
          ],
        },
      },
      {
        $project: {
          position: 0,
          updatedAt: 0,
          softDeleted: 0,
        },
      },
    ]);

    if (!category) {
      throw new NotFoundException('Category not found');
    }
    if (category.softDeleted) {
      throw new BadRequestException('Category not found');
    }
    return apiResponse({
      data: category,
      message: 'Category fetched successfully',
    });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const session = await this.categoryModel.db.startSession();
    session.startTransaction();

    try {
      const { subCategories, ...rest } = updateCategoryDto;

      const existingCategory = await this.categoryModel.findById(id);

      if (!existingCategory) {
        throw new NotFoundException('Category not found');
      }

      if (updateCategoryDto._uploaded) {
        if (existingCategory.image) {
          await this.storageService.deleteFileByUrl(existingCategory.image);
        }
      }

      if (rest.slug) {
        delete rest.slug;
      }

      const updatedParentCategory = await this.categoryModel.findByIdAndUpdate(
        id,
        { ...rest },
        {
          session,
          new: true,
        },
      );

      await this.tempModel.deleteOne(
        { url: updateCategoryDto.image },
        { session },
      );

      if (!updatedParentCategory) {
        throw new NotFoundException('Parent category not found');
      }

      if (subCategories && subCategories.length > 0) {
        const bulkOps = subCategories.map((sub: UpdateCategoryDto) => {
          if (sub._id && !sub._delete) {
            return {
              updateOne: {
                filter: { _id: sub._id },
                update: {
                  $set: { ...sub, parent: updatedParentCategory._id },
                },
              },
            };
          } else if (sub._id && sub._delete) {
            return {
              updateOne: {
                filter: { _id: sub._id },
                update: {
                  $set: { ...sub, softDeleted: true },
                },
              },
            };
          } else {
            return {
              insertOne: {
                document: {
                  ...sub,
                  parent: updatedParentCategory._id,
                },
              },
            };
          }
        });

        await this.categoryModel.bulkWrite(bulkOps, { session });
      }

      // if (updateCategoryDto.status !== undefined) {
      //   const res = await this.productModel.updateMany(
      //     { category: new Types.ObjectId(id) },
      //     {
      //       $set: {
      //         isPublished: updateCategoryDto.status,
      //       },
      //     },
      //     { session },
      //   );
      // }
      await session.commitTransaction();

      return apiResponse({
        message: 'Category updated successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async remove(id: string) {
    const session = await this.categoryModel.db.startSession();
    session.startTransaction();

    try {
      const category = await this.categoryModel.findById(id).session(session);
      if (!category) {
        throw new NotFoundException('Category not found');
      }

      if (category.softDeleted) {
        throw new BadRequestException('Category is already deleted');
      }

      const allSubcategoryIds = await this.getAllSubcategoryIds(id, session);
      const allCategoryIds = [new Types.ObjectId(id), ...allSubcategoryIds];

      await this.productModel.updateMany(
        {
          category: { $in: allCategoryIds },
          softDeleted: false,
        },
        {
          $set: { softDeleted: true },
        },
        { session },
      );

      if (allSubcategoryIds.length > 0) {
        await this.categoryModel.updateMany(
          {
            _id: { $in: allSubcategoryIds },
            softDeleted: false,
          },
          {
            $set: { softDeleted: true },
          },
          { session },
        );
      }

      category.softDeleted = true;

      await category.save({ session, validateBeforeSave: false });

      await session.commitTransaction();

      if (category.image && category.image.includes('s3')) {
        await this.storageService.deleteFileByUrl(category.image);
      }

      return apiResponse({
        message: 'Category and all subcategories deleted successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  private async getAllSubcategoryIds(
    parentId: string,
    session?: any,
  ): Promise<Types.ObjectId[]> {
    const subcategories = await this.categoryModel
      .find({ parent: parentId, softDeleted: false })
      .session(session)
      .select('_id')
      .lean();

    if (subcategories.length === 0) {
      return [];
    }

    const subcategoryIds = subcategories.map((sub) => sub._id);
    const allIds = [...subcategoryIds];

    for (const subcat of subcategories) {
      const nestedIds = await this.getAllSubcategoryIds(
        subcat._id.toString(),
        session,
      );
      allIds.push(...nestedIds);
    }

    return allIds;
  }

  // async updateStatus(id: string, { status }: { status: boolean }) {
  //   const updatedCategory = await this.categoryModel.findByIdAndUpdate(
  //     id,
  //     { status },
  //     {
  //       new: true,
  //       runValidators: true,
  //     },
  //   );

  //   if (!updatedCategory) {
  //     throw new NotFoundException('Category not found');
  //   }
  //   return apiResponse({
  //     data: updatedCategory,
  //     message: 'Category status updated successfully',
  //   });
  // }

  async sort(sortedIds: string[]) {
    const bulkOps = sortedIds.map((item, index) => ({
      updateOne: {
        filter: { _id: item },
        update: { position: index + 1 },
      },
    }));

    const data = await this.categoryModel.bulkWrite(bulkOps, {
      ordered: false,
    });
    return apiResponse({
      data,
      status: true,
      message: 'Categories sorted successfully!',
    });
  }
}
