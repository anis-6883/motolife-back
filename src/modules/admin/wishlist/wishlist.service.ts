import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WishList } from 'src/common/models/wishlist.schema';
import { apiResponse } from 'src/common/utils/api-response';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(WishList.name)
    private readonly wishlistModel: Model<WishList>,
  ) {}

  async getWishlistByUserId(userId: string) {
    const wishlist = await this.wishlistModel.aggregate([
      {
        $match: {
          customer: new Types.ObjectId(userId),
          softDeleted: false,
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productDetails',
          pipeline: [
            {
              $project: {
                name: 1,
                sellingPrice: 1,
                thumbnail: 1,
                buyingPrice: 1,
                variants: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$productDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    return apiResponse({
      data: wishlist,
      message: 'Wishlist fetched successfully',
    });
  }
}
