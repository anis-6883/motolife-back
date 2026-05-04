import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../../../common/models/category.schema';
import { apiResponse } from 'src/common/utils/api-response';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
  ) {}

  async findAllCategories(query: { search: string }) {
    const { search } = query;

    const categories = await this.categoryModel.aggregate([
      {
        $match: {
          parent: null,
          ...(search && { name: { $regex: search, $options: 'i' } }),
          status: true,
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
                status: true,
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
                parent: 0,
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

    return apiResponse({
      data: categories,
      message: 'Categories fetched successfully',
    });
  }

  public async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    const category = await this.categoryModel
      .findById(id)
      .populate('parent', 'name logo')
      .select('-updatedAt -softDeleted -createdAt -position');

    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return apiResponse({
      data: category,
      message: 'Category fetched successfully',
    });
  }
}
