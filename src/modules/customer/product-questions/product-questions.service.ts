import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PipelineStage,
  Types,
  type AggregatePaginateModel,
  type PaginateModel,
} from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { CreateProductQuestionDto } from './dto/create-question.dto';
import { Product } from 'src/common/models/products.schema';
import { Customer } from 'src/common/models/customers.schema';
import { GetProductQuestionQueryDto } from './dto/get-questions.dto';
import { ComboProduct } from 'src/common/models/combo-products.schema';
import { ProductQuestion } from 'src/common/models/product-questions.schema';
import { IActiveUser } from '../auth/interfaces/active-user.interface';
import {
  SellerAccountStatus,
  SellerVerificationStatus,
} from 'src/common/enums/seller.enums';
import { UserIdentity } from 'src/common/interfaces/identity.interface';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class ProductQuestionService {
  constructor(
    @InjectModel(ProductQuestion.name)
    private readonly productQuestionModel: AggregatePaginateModel<ProductQuestion>,
    @InjectModel(Product.name)
    private readonly productModel: PaginateModel<Product>,
    @InjectModel(ComboProduct.name)
    private readonly comboProductModel: PaginateModel<ComboProduct>,
    @InjectModel(Customer.name)
    private readonly customerModel: PaginateModel<Customer>,
  ) {}

  async createProductQuestion(
    user: UserIdentity,
    createProductQuestionDto: CreateProductQuestionDto,
  ) {
    const { id, isGuest } = user;

    if (!isGuest) {
      const customerExists = await this.customerModel
        .findById(id)
        .select('_id');

      if (customerExists) {
        createProductQuestionDto.customer = customerExists._id;
      }
    } else {
      createProductQuestionDto.isGuest = true;
      createProductQuestionDto.status = false;
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

  async getProductQuestionsByProductId(
    productId: string,
    query: GetProductQuestionQueryDto,
  ) {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          $or: [
            {
              product: new Types.ObjectId(productId),
            },
            { comboProduct: new Types.ObjectId(productId) },
          ],
          status: true,
          softDeleted: false,
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
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'comboProducts',
          localField: 'comboProduct',
          foreignField: '_id',
          as: 'comboProduct',
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
          path: '$product',
          preserveNullAndEmptyArrays: true,
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
          status: 0,
          updatedAt: 0,
        },
      },
    ];

    const productQuestion = await this.productQuestionModel.aggregatePaginate(
      pipeline,
      {
        page: Number(query.page),
        limit: Number(query.limit) > 50 ? 50 : Number(query.limit),
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
    const updatedQuestion = await this.productQuestionModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        customer: new Types.ObjectId(user.sub),
      },
      dto,
      { new: true },
    );

    if (!updatedQuestion) {
      throw new NotFoundException('Product question not found');
    }

    return apiResponse({
      status: true,
      message: 'Product question updated successfully',
      data: updatedQuestion,
    });
  }

  async removeProductQuestion(user: IActiveUser, id: string) {
    const customerExists = await this.customerModel.findById(user.sub);

    if (!customerExists) {
      throw new NotFoundException('Customer not found');
    }

    const productQuestion = await this.productQuestionModel.findOne({
      _id: new Types.ObjectId(id),
      customer: customerExists._id,
    });

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
