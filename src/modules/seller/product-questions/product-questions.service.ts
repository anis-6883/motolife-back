import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { IActiveUser } from '../auth/interfaces/active-user.interface';
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

  async getProductQuestions(
    user: IActiveUser,
    query: GetProductQuestionQueryDto,
  ) {
    const { page = 1, limit = 10, product, customer, date } = query;

    const filters: QueryFilter<ProductQuestion> = { softDeleted: false };

    if (customer) {
      filters.customer = new Types.ObjectId(customer);
    }

    if (product) {
      filters.$or = [
        { product: new Types.ObjectId(product) },
        { comboProduct: new Types.ObjectId(product) },
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
              $match: {
                seller: new Types.ObjectId(user.sub),
              },
            },
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
              $match: {
                seller: new Types.ObjectId(user.sub),
              },
            },
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
        $match: {
          $or: [{ product: { $ne: null } }, { comboProduct: { $ne: null } }],
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

  async updateProductQuestion(
    user: IActiveUser,
    id: string,
    dto: UpdateQuestionDto,
  ) {
    const questionExists = await this.productQuestionModel.findById(id);

    if (!questionExists) {
      throw new NotFoundException('Product question not found');
    }

    if (questionExists.product) {
      const product = await this.productModel.findById(questionExists.product);
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      if (product.seller.toString() !== user.sub) {
        throw new ForbiddenException(
          'You are not authorized to update this product question',
        );
      }
    }
    if (questionExists.comboProduct) {
      const comboProduct = await this.comboProductModel.findById(
        questionExists.comboProduct,
      );
      if (!comboProduct) {
        throw new NotFoundException('Combo product not found');
      }
      if (comboProduct.seller.toString() !== user.sub) {
        throw new ForbiddenException(
          'You are not authorized to update this product question',
        );
      }
    }
    await this.productQuestionModel.findByIdAndUpdate(id, dto, { new: true });

    return apiResponse({
      status: true,
      message: 'Product question updated successfully',
    });
  }

  async removeProductQuestion(user: IActiveUser, id: string) {
    const productQuestion = await this.productQuestionModel.findById(id);

    if (!productQuestion) {
      throw new NotFoundException('Product question not found');
    }

    if (productQuestion.product) {
      const product = await this.productModel.findById(productQuestion.product);
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      if (product.seller.toString() !== user.sub) {
        throw new ForbiddenException(
          'You are not authorized to delete this product question',
        );
      }
    }
    if (productQuestion.comboProduct) {
      const comboProduct = await this.comboProductModel.findById(
        productQuestion.comboProduct,
      );
      if (!comboProduct) {
        throw new NotFoundException('Combo product not found');
      }
      if (comboProduct.seller.toString() !== user.sub) {
        throw new ForbiddenException(
          'You are not authorized to delete this product question',
        );
      }
    }

    productQuestion.softDeleted = true;

    await productQuestion.save();

    return apiResponse({
      status: true,
      message: 'Product removed successfully',
    });
  }
}
