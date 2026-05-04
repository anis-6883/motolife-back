import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PipelineStage,
  QueryFilter,
  Types,
  type AggregatePaginateModel,
  type PaginateModel,
} from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { Customer } from 'src/common/models/customers.schema';
import { GetProductQuestionQueryDto } from './dto/get-questions.dto';
import { ProductQuestion } from 'src/common/models/product-questions.schema';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { CreateProductQuestionDto } from './dto/create-question.dto';
import { Product } from 'src/common/models/products.schema';
import { ComboProduct } from 'src/common/models/combo-products.schema';

@Injectable()
export class ProductQuestionService {
  constructor(
    @InjectModel(ProductQuestion.name)
    private readonly productQuestionModel: AggregatePaginateModel<ProductQuestion>,
    @InjectModel(Product.name)
    private readonly productModel: PaginateModel<Product>,
    @InjectModel(ComboProduct.name)
    private readonly comboProductModel: PaginateModel<ComboProduct>,
  ) {}

  async createProductQuestion(
    createProductQuestionDto: CreateProductQuestionDto,
  ) {
    if (!createProductQuestionDto.customerName) {
      createProductQuestionDto.customerName = 'Admin';
    }

    const isCombo = !!createProductQuestionDto.comboProduct;

    const item = isCombo
      ? await this.comboProductModel.findById(
          createProductQuestionDto.comboProduct,
        )
      : await this.productModel
          .findById(createProductQuestionDto.product)
          .lean();

    if (!item) {
      throw new NotFoundException('Product not found');
    }

    await this.productQuestionModel.create(createProductQuestionDto);

    return apiResponse({
      status: true,
      message: 'Product question created successfully',
    });
  }

  async getProductQuestions(query: GetProductQuestionQueryDto) {
    const {
      page = 1,
      limit = 10,
      product,
      customer,
      date,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filters: QueryFilter<ProductQuestion> = { softDeleted: false };

    if (status) {
      filters.status = status === 'true';
    }

    if (customer) {
      filters.customer = new Types.ObjectId(customer);
    }

    if (product) {
      filters.$or = [
        { product: new Types.ObjectId(product) },
        { comboProduct: new Types.ObjectId(product) },
      ];
    }

    if (search) {
      filters.$or = [
        { question: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ];
    }

    if (date) {
      if (date === 'week') {
        filters.createdAt = {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        };
      } else if (date === 'month') {
        filters.createdAt = {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        };
      } else {
        filters.createdAt = {
          $gte: new Date(date),
          $lt: new Date(date + 'T23:59:59.999Z'),
        };
      }
    }

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
      },
      {
        $sort: { [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
          pipeline: [
            {
              $project: {
                name: 1,
                image: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
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
          from: 'combo_products',
          localField: 'comboProduct',
          foreignField: '_id',
          as: 'comboProduct',
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
          path: '$comboProduct',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          softDeleted: 0,
          updatedAt: 0,
        },
      },
    ];

    const productQuestion = await this.productQuestionModel.aggregatePaginate(
      pipeline,
      {
        page: Number(page),
        limit: Number(limit) > 50 ? 50 : Number(limit),
      },
    );

    const { docs, ...rest } = productQuestion;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Product questions fetched successfully',
    });
  }

  async updateProductQuestion(id: string, dto: UpdateQuestionDto) {
    const updatedQuestion = await this.productQuestionModel.findByIdAndUpdate(
      id,
      dto,
      { new: true },
    );

    if (!updatedQuestion) {
      throw new NotFoundException('Product question not found');
    }

    return apiResponse({
      status: true,
      message: 'Product question updated successfully',
    });
  }

  async removeProductQuestion(id: string) {
    const productQuestion = await this.productQuestionModel.findById(id);

    if (!productQuestion) {
      throw new NotFoundException('Product question not found');
    }

    productQuestion.softDeleted = true;

    await productQuestion.save();

    return apiResponse({
      status: true,
      message: 'Product removed successfully',
    });
  }
}
