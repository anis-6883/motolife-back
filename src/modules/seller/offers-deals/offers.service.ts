import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOffersDto, OffersItemDto } from './dto/create-offer.dto';
import { UpdateOffersDto } from './dto/update-offer.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  PipelineStage,
  QueryFilter,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { GetOffersQueryDto } from './dto/get-offers-query.dto';
import { Offers, RESOURCE_TYPE } from 'src/common/models/offers&deals.schema';
import { Product } from 'src/common/models/products.schema';
import { DISCOUNT_TYPE } from 'src/common/enums/products.enum';
import { IActiveUser } from '../auth/interfaces/active-user.interface';

@Injectable()
export class OffersService {
  constructor(
    @InjectModel(Offers.name)
    private readonly offersModel: AggregatePaginateModel<Offers>,
    @InjectModel(Product.name)
    private readonly productModel: AggregatePaginateModel<Product>,
  ) {}

  async create(createOffersDto: CreateOffersDto) {
    await this.offersModel.create(createOffersDto);
    return apiResponse({
      message: 'Offers created successfully',
    });
  }

  async findAll(user: IActiveUser, query: GetOffersQueryDto) {
    const { page = 1, limit = 10, search } = query;

    const filters: QueryFilter<Offers> = { softDeleted: false };

    if (search) {
      filters.title = { $regex: search, $options: 'i' };
    }

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'populatedProducts',
          pipeline: [
            {
              $project: {
                name: 1,
                thumbnail: 1,
                discountType: 1,
                discountValue: 1,
                discountPrice: 1,
                status: 1,
                seller: 1,
              },
            },
          ],
        },
      },

      {
        $match: {
          'populatedProducts.seller': new Types.ObjectId(user.sub),
        },
      },

      {
        $set: {
          items: '$populatedProducts',
        },
      },
      {
        $project: {
          softDeleted: 0,
          updatedAt: 0,
          populatedProducts: 0,
        },
      },
    ];

    const result = await this.offersModel.aggregatePaginate(pipeline, {
      page,
      limit: limit > 50 ? 50 : limit,
    });
    const { docs, ...rest } = result;

    return apiResponse({ data: docs, pagination: rest });
  }

  public async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    const offers = await this.offersModel.findById(id).lean();
    if (!offers) {
      throw new NotFoundException('Offers not found');
    }
    return apiResponse({
      data: offers,
      message: 'Offers fetched successfully',
    });
  }

  async update(id: string, updateOffersDto: UpdateOffersDto) {
    const updatedOffers = await this.offersModel.findByIdAndUpdate(
      id,
      updateOffersDto,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedOffers) {
      throw new NotFoundException('Offers not found');
    }
    return apiResponse({
      data: updatedOffers,
      message: 'Offers updated successfully',
    });
  }

  async remove(id: string) {
    const deletedOffers = await this.offersModel.findByIdAndUpdate(
      id,
      { softDeleted: true },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!deletedOffers) {
      throw new NotFoundException('Offers not found');
    }

    deletedOffers.items.forEach(async (item) => {
      const product = await this.productModel.findById(item.product);
      if (product) {
        product.hasDiscount = false;
        product.discountPrice = product.sellingPrice;
        await product.save();
      }
    });

    return apiResponse({
      status: true,
      message: 'Offers deleted successfully',
    });
  }

  async addProduct(offerId: string, productDto: OffersItemDto) {
    const session = await this.offersModel.db.startSession();
    session.startTransaction();

    try {
      const offer = await this.offersModel.findById(offerId).session(session);
      if (!offer) throw new NotFoundException('Offer not found');

      const product = await this.productModel
        .findById(productDto.product)
        .session(session);

      if (!product) throw new NotFoundException('Product is not available');

      const isProductAlreadyInOffer = await this.offersModel.findOne({
        _id: { $ne: offer._id },
        'items.product': product._id,
      });

      if (isProductAlreadyInOffer) {
        throw new ConflictException('Product is already in another offer');
      }

      const isDuplicate = offer.items.some(
        (item: any) => item.product.toString() === product._id.toString(),
      );

      if (isDuplicate) {
        throw new ConflictException('Product is already in this offer');
      }

      let finalDiscountPrice = 0;
      if (productDto.discountType === DISCOUNT_TYPE.PERCENTAGE) {
        const discountAmount =
          (productDto.discountValue / 100) * product.sellingPrice;
        finalDiscountPrice = Math.floor(product.sellingPrice - discountAmount);
      } else {
        finalDiscountPrice = product.sellingPrice - productDto.discountValue;
      }

      const productPayload: OffersItemDto = {
        product: product._id,
        discountPrice: finalDiscountPrice,
        discountType: productDto.discountType,
        discountValue: productDto.discountValue,
      };

      product.discountType = productDto.discountType;
      product.discountValue = productDto.discountValue;
      product.discountPrice = finalDiscountPrice;
      await product.save({ session });

      offer.items.push(productPayload);
      await offer.save({ session });

      await session.commitTransaction();

      return apiResponse({
        data: offer,
        message: 'Product added to offer successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async removeProduct(offerId: string, productId: string) {
    const session = await this.offersModel.db.startSession();
    session.startTransaction();
    try {
      const offer = await this.offersModel.findById(offerId).session(session);
      if (!offer) throw new NotFoundException('Offer not found');

      const product = await this.productModel
        .findById(productId)
        .session(session);

      if (!product) throw new NotFoundException('Product is not available');

      offer.items = offer.items.filter(
        (item) => item.product.toString() !== product._id.toString(),
      );

      product.hasDiscount = false;
      product.discountPrice = product.sellingPrice;
      await product.save({ session });

      await offer.save({ session });

      await session.commitTransaction();

      return apiResponse({
        data: offer,
        message: 'Product removed from offer successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
