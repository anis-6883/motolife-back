import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PipelineStage,
  Types,
  type AggregatePaginateModel,
  type PaginateModel,
} from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { CreateWishlistDto, WishlistType } from './dto/create-wishlist.dto';
import { Product } from 'src/common/models/products.schema';
import { Customer } from 'src/common/models/customers.schema';
import { GetWishListQueryDto } from './dto/get-wishlist.dto';
import { ComboProduct } from 'src/common/models/combo-products.schema';
import { WishList } from 'src/common/models/wishlist.schema';
import { IActiveUser } from '../auth/interfaces/active-user.interface';
import {
  SellerAccountStatus,
  SellerVerificationStatus,
} from 'src/common/enums/seller.enums';
import { c } from 'node_modules/@faker-js/faker/dist/airline-Dz1uGqgJ';
import { create } from 'axios';

@Injectable()
export class WishListService {
  constructor(
    @InjectModel(WishList.name)
    private readonly wishListModel: AggregatePaginateModel<WishList>,
    @InjectModel(Product.name)
    private readonly productModel: PaginateModel<Product>,
    @InjectModel(ComboProduct.name)
    private readonly comboProductModel: PaginateModel<ComboProduct>,
    @InjectModel(Customer.name)
    private readonly customerModel: PaginateModel<Customer>,
  ) {}

  async createWishList(user: IActiveUser, dto: CreateWishlistDto) {
    //! customer check
    const customer = await this.customerModel.findById(user.sub).select('_id');
    if (!customer) throw new NotFoundException('Customer not found');

    let matchFilter: Record<string, any>;

    if (dto.type === WishlistType.PRODUCT) {
      if (!dto.product) throw new NotFoundException('Product ID is required');

      const productExists = await this.productModel
        .findById(dto.product)
        .select('_id');

      if (!productExists) throw new NotFoundException('Product not found');

      matchFilter = {
        customer: customer._id,
        product: productExists._id,
        ...(dto.variantSku && { variantSku: dto.variantSku }),
      };
    } else if (dto.type === WishlistType.COMBO) {
      if (!dto.comboProduct)
        throw new NotFoundException('Combo product ID is required');

      const comboExists = await this.comboProductModel
        .findById(dto.comboProduct)
        .select('_id');
      if (!comboExists) throw new NotFoundException('Combo product not found');

      matchFilter = {
        customer: customer._id,
        comboProduct: comboExists._id,
      };
    } else {
      throw new NotFoundException('Invalid wishlist type');
    }

    const existing = await this.wishListModel
      .findOne(matchFilter)
      .select('softDeleted');

    const updated = await this.wishListModel.findOneAndUpdate(
      matchFilter,
      {
        $set: { softDeleted: existing ? !existing.softDeleted : false },
        $setOnInsert: {
          ...matchFilter,
          type: dto.type,
          ...(dto.variantSku && { variantSku: dto.variantSku }),
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    const wishlisted = !updated.softDeleted;

    return apiResponse({
      status: true,
      message: wishlisted ? 'Added to wishlist' : 'Removed from wishlist',
      data: { wishlisted },
    });
  }

  async checkWishlistStatus(
    user: IActiveUser,
    productId: string,
    variantSku?: string,
    isCombo?: boolean,
  ) {
    const customerExists = await this.customerModel
      .findById(user.sub)
      .select('_id');

    if (!customerExists) return { wishlisted: false };

    const query = {
      customer: customerExists._id,
      softDeleted: false,
      ...(isCombo
        ? { comboProduct: new Types.ObjectId(productId) }
        : {
            product: new Types.ObjectId(productId),
            ...(variantSku && { variantSku }),
          }),
    };

    const exists = await this.wishListModel.exists(query);

    return apiResponse({
      status: true,
      message: 'Wishlist status fetched',
      data: { wishlisted: !!exists },
    });
  }

  async removeFromWishListById(user: IActiveUser, wishlistId: string) {
    const customerExists = await this.customerModel
      .findById(user.sub)
      .select('_id');

    if (!customerExists) throw new NotFoundException('Customer not found');

    const wishList = await this.wishListModel.findOne({
      _id: new Types.ObjectId(wishlistId),
      customer: customerExists._id, // scoped to customer — prevents deleting others' wishlists
      softDeleted: false,
    });

    if (!wishList) throw new NotFoundException('Wishlist item not found');

    wishList.softDeleted = true;
    await wishList.save();

    return apiResponse({
      status: true,
      message: 'Removed from wishlist',
      data: { wishlisted: false },
    });
  }
  async removeFromWishList(user: IActiveUser, id: string) {
    const customerExists = await this.customerModel.findById(user.sub);

    if (!customerExists) {
      throw new NotFoundException('Customer not found');
    }

    const wishList = await this.wishListModel.findOne({
      customer: customerExists._id,
      $or: [
        { product: new Types.ObjectId(id) },
        { comboProduct: new Types.ObjectId(id) },
      ],
    });

    if (!wishList) {
      throw new NotFoundException('WishList not found');
    }

    wishList.softDeleted = true;

    await wishList.save();

    return apiResponse({
      status: true,
      message: 'Product removed successfully',
    });
  }

  async getWishList(user: IActiveUser, query: GetWishListQueryDto) {
    const customerExists = await this.customerModel.findById(user.sub);

    if (!customerExists) {
      throw new NotFoundException('Customer not found');
    }

    const pipeline: PipelineStage[] = [
      {
        $match: {
          customer: customerExists._id,
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
              $lookup: {
                from: 'sellers',
                localField: 'seller',
                foreignField: '_id',
                as: 'seller',
                pipeline: [
                  {
                    $match: {
                      accountStatus: {
                        $in: [
                          SellerAccountStatus.LIVE,
                          SellerAccountStatus.INACTIVE,
                          SellerAccountStatus.ON_VACATION,
                        ],
                      },
                      verificationStatus: {
                        $ne: SellerVerificationStatus.REJECTED,
                      },
                    },
                  },
                  {
                    $project: {
                      'store.storeName': 1,
                      'store.logoImage': 1,
                      verificationStatus: 1,
                      accountStatus: 1,
                    },
                  },
                ],
              },
            },
            {
              $unwind: {
                path: '$seller',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                name: 1,
                sku: 1,
                sellingPrice: 1,
                hasDiscount: 1,
                discountPrice: 1,
                variants: 1,
                stockQuantity: 1,
                thumbnail: 1,
                seller: 1,
                slug: 1,
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
              $lookup: {
                from: 'sellers',
                localField: 'seller',
                foreignField: '_id',
                as: 'seller',
                pipeline: [
                  {
                    $match: {
                      accountStatus: {
                        $in: [
                          SellerAccountStatus.LIVE,
                          SellerAccountStatus.INACTIVE,
                          SellerAccountStatus.ON_VACATION,
                        ],
                      },
                      verificationStatus: {
                        $ne: SellerVerificationStatus.REJECTED,
                      },
                    },
                  },
                  {
                    $project: {
                      'store.storeName': 1,
                      'store.logoImage': 1,
                      verificationStatus: 1,
                      accountStatus: 1,
                    },
                  },
                ],
              },
            },
            {
              $unwind: {
                path: '$seller',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                name: 1,
                sku: 1,
                sellingPrice: 1,
                hasDiscount: 1,
                discountPrice: 1,
                variants: 1,
                stockQuantity: 1,
                thumbnail: 1,
                seller: 1,
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
          _id: 0,
          product: 1,
          comboProduct: 1,
          type: 1,
        },
      },
    ];

    const wishList = await this.wishListModel.aggregatePaginate(pipeline, {
      page: Number(query.page),
      limit: Number(query.limit) > 50 ? 50 : Number(query.limit),
    });

    return apiResponse({
      status: true,
      message: 'WishList fetched successfully',
      data: wishList,
    });
  }
}
