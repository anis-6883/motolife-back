import {
  BadRequestException,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { CreateSellerDto } from './dto/create-seller.dto';
import { CreateSellerProvider } from './providers/create-seller.provider';
import { InjectModel } from '@nestjs/mongoose';
import {
  PipelineStage,
  QueryFilter,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { GetAllSellersQueryDto } from './dto/get-all-sellers-query.dto';
import { apiResponse } from 'src/common/utils/api-response';
import { HashingProvider } from '../admin-auth/providers/hashing.provider';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { Seller } from 'src/common/models/seller.schema';
import { PRODUCT_STATUS } from 'src/common/enums/products.enum';
import { Order, ORDER_STATUS } from 'src/common/models/order.schema';
import { SellerOrdersQueryDto } from './dto/seller-order-query.dto';
import { GetProductsQueryDto } from 'src/common/dtos/products/get-products-query.dto';
import { Product } from 'src/common/models/products.schema';
import {
  UpdateProductDto,
  UpdateVariantDto,
} from 'src/common/dtos/products/update-products.dto';
import { GetComboProductsQueryDto } from 'src/common/dtos/combo-products/get-combo-products-query.dto';
import { ComboProduct } from 'src/common/models/combo-products.schema';
import { UpdateComboProductDto } from 'src/common/dtos/combo-products/update-combo-products.dto';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction, ResourceType } from 'src/common/enums/admin.enum';
import { IActiveUser } from '../admin-auth/interfaces/active-user.interface';
import { Withdraw, WITHDRAW_STATUS } from 'src/common/models/withdraw.schema';
import { GetSellerWithdrawQueryDto } from './dto/get-seller-withdraw-query.dto';
import { fileURLToPath } from 'url';
import { filter } from 'compression';

@Injectable()
export class SellerService {
  constructor(
    @InjectModel(Seller.name)
    private readonly userModel: AggregatePaginateModel<Seller>,
    @InjectModel(Order.name)
    private readonly orderModel: AggregatePaginateModel<Order>,
    @InjectModel(Product.name)
    private readonly productModel: AggregatePaginateModel<Product>,
    @InjectModel(ComboProduct.name)
    private readonly comboProductModel: AggregatePaginateModel<ComboProduct>,
    @InjectModel(Withdraw.name)
    private readonly withdrawModel: AggregatePaginateModel<Withdraw>,
    private readonly hashingProvider: HashingProvider,
    private readonly createUserProvider: CreateSellerProvider,

    private readonly activityService: ActivityService,
  ) {}

  async create(createUserDto: CreateSellerDto) {
    const hashedPassword = await this.hashingProvider.hashPassword(
      createUserDto.password,
    );
    await this.createUserProvider.create({
      ...createUserDto,
      password: hashedPassword,
    });
    return apiResponse({
      message: 'Seller created successfully',
    });
  }

  async findAll(query: GetAllSellersQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      verificationStatus,
      accountStatus,
      status,
    } = query;

    const filter: QueryFilter<Seller> = {
      softDeleted: false,
      name: { $ne: 'Admin' },
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'store.storeName': { $regex: search, $options: 'i' } },
      ];
    }

    if (verificationStatus) {
      filter.verificationStatus = verificationStatus;
    }

    if (status) {
      filter.status = status === 'true';
    }

    if (accountStatus) {
      filter.accountStatus = accountStatus;
    }

    const pipeline: PipelineStage[] = [
      {
        $match: filter,
      },
      {
        $sort: {
          [sortBy]: sortOrder === 'asc' ? 1 : -1,
        },
      },
      {
        $project: {
          'store.storeName': 1,
          name: 1,
          phone: 1,
          email: 1,
          verificationStatus: 1,
          accountStatus: 1,
          totalProducts: 1,
          totalOrders: 1,
          status: 1,
        },
      },
    ];

    const result = await this.userModel.aggregatePaginate(pipeline, {
      page,
      limit: limit > 50 ? 50 : limit,
      sort: {
        [sortBy]: sortOrder === 'asc' ? 1 : -1,
      },
    });

    const { docs, ...rest } = result;
    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Sellers fetched successfully',
    });
  }

  async getDropdown(query: GetAllSellersQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      verificationStatus,
      accountStatus,
    } = query;

    const filter: QueryFilter<Seller> = {
      softDeleted: false,
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'store.storeName': { $regex: search, $options: 'i' } },
      ];
    }

    if (verificationStatus) {
      filter.verificationStatus = verificationStatus;
    }

    if (accountStatus) {
      filter.accountStatus = accountStatus;
    }

    const pipeline: PipelineStage[] = [
      {
        $match: filter,
      },
      {
        $sort: {
          [sortBy]: sortOrder === 'asc' ? 1 : -1,
        },
      },
      {
        $project: {
          'store.logoImage': 1,
          'store.storeName': 1,
        },
      },
    ];

    const result = await this.userModel.aggregatePaginate(pipeline, {
      page,
      limit: limit > 50 ? 50 : limit,
      sort: {
        [sortBy]: sortOrder === 'asc' ? 1 : -1,
      },
    });

    const { docs, ...rest } = result;
    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Sellers fetched successfully',
    });
  }

  async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    try {
      const user = await this.userModel.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(id),
            softDeleted: false,
          },
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: 'seller',
            as: 'products',
          },
        },
        {
          $addFields: {
            activeProducts: {
              $size: {
                $filter: {
                  input: '$products',
                  as: 'product',
                  cond: { $eq: ['$$product.status', PRODUCT_STATUS.APPROVED] },
                },
              },
            },
            productIds: {
              $map: {
                input: '$products',
                as: 'product',
                in: '$$product._id',
              },
            },
          },
        },
        {
          $lookup: {
            from: 'orders',
            let: { productIds: '$productIds', sellerId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ['$$sellerId', '$sellers'],
                  },
                  status: {
                    $nin: [
                      ORDER_STATUS.CANCELLED,
                      ORDER_STATUS.FAILED,
                      ORDER_STATUS.REFUNDED,
                      ORDER_STATUS.RETURNED,
                    ],
                  },
                },
              },
              {
                $unwind: '$items',
              },
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$items.seller', '$$sellerId'] },
                      { $in: ['$items.product', '$$productIds'] },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalSales: { $sum: '$items.totalPrice' },
                },
              },
            ],
            as: 'salesData',
          },
        },
        {
          $lookup: {
            from: 'reviews',
            let: { sellerId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$sellerId', '$$sellerId'] },
                      { $eq: ['$softDeleted', false] },
                      { $eq: ['$willPublish', true] },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalRatings: { $sum: 1 },
                  averageRating: { $avg: '$rating' },
                  totalReviews: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $ifNull: ['$review', false] },
                            { $ne: ['$review', ''] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            as: 'reviewData',
          },
        },
        {
          $lookup: {
            from: 'withdraws',
            let: { sellerId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$seller', '$$sellerId'] },
                      { $eq: ['$softDeleted', false] },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalPendingWithdraws: {
                    $sum: {
                      $cond: [
                        {
                          $and: [{ $eq: ['$status', WITHDRAW_STATUS.PENDING] }],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            as: 'withdrawData',
          },
        },
        {
          $addFields: {
            pendingWithdraws: {
              $ifNull: [
                { $arrayElemAt: ['$withdrawData.totalPendingWithdraws', 0] },
                0,
              ],
            },
          },
        },
        {
          $addFields: {
            totalRatings: {
              $ifNull: [{ $arrayElemAt: ['$reviewData.totalRatings', 0] }, 0],
            },
            averageRating: {
              $ifNull: [{ $arrayElemAt: ['$reviewData.averageRating', 0] }, 0],
            },
            totalReviews: {
              $ifNull: [{ $arrayElemAt: ['$reviewData.totalReviews', 0] }, 0],
            },
          },
        },
        {
          $addFields: {
            totalSales: {
              $ifNull: [{ $arrayElemAt: ['$salesData.totalSales', 0] }, 0],
            },
          },
        },
        {
          $project: {
            products: 0,
            productIds: 0,
            salesData: 0,
            __v: 0,
            updatedAt: 0,
            createdAt: 0,
            softDeleted: 0,
            reviewData: 0,
            withdrawData: 0,
          },
        },
      ]);

      if (!user || user.length === 0) {
        throw new NotFoundException('Seller not found');
      }

      return apiResponse({
        data: user[0],
        message: 'Seller fetched successfully',
      });
    } catch (error) {
      throw new RequestTimeoutException(error.message);
    }
  }

  async sellerOrderStats(sellerId: string) {
    const [orderStats] = await this.orderModel.aggregate([
      {
        $match: {
          sellers: new Types.ObjectId(sellerId),
        },
      },
      {
        $group: {
          _id: null,
          processingOrders: {
            $sum: {
              $cond: {
                if: { $eq: ['$status', ORDER_STATUS.PROCESSING] },
                then: 1,
                else: 0,
              },
            },
          },
          shippedOrders: {
            $sum: {
              $cond: {
                if: { $eq: ['$status', ORDER_STATUS.SHIPPED] },
                then: 1,
                else: 0,
              },
            },
          },
          cancelledOrders: {
            $sum: {
              $cond: {
                if: { $eq: ['$status', ORDER_STATUS.CANCELLED] },
                then: 1,
                else: 0,
              },
            },
          },
          deliveredOrders: {
            $sum: {
              $cond: {
                if: { $eq: ['$status', ORDER_STATUS.DELIVERED] },
                then: 1,
                else: 0,
              },
            },
          },
        },
      },
    ]);

    return apiResponse({
      data: orderStats,
      message: 'Seller order stats fetched successfully',
    });
  }

  async getOrders(sellerId: string, query: SellerOrdersQueryDto) {
    const { status, isCustomerVerified, search, date } = query;
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');

    const matchFilter: QueryFilter<Order> = {
      softDeleted: false,
      sellers: new Types.ObjectId(sellerId),
    };

    if (status) {
      matchFilter.status = status;
    }

    if (search) {
      matchFilter.$or = [
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
        { 'shippingAddress.address': { $regex: search, $options: 'i' } },
        { orderId: { $regex: search, $options: 'i' } },
      ];
    }

    if (date) {
      if (date === 'week') {
        matchFilter.createdAt = {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        };
      } else if (date === 'month') {
        matchFilter.createdAt = {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        };
      } else {
        matchFilter.createdAt = {
          $gte: new Date(date),
          $lt: new Date(date + 'T23:59:59.999Z'),
        };
      }
    }

    const verifiedBool = isCustomerVerified
      ? isCustomerVerified === 'true'
        ? true
        : false
      : null;

    const aggregate = this.orderModel.aggregate([
      { $match: matchFilter },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
          pipeline: [
            {
              $project: {
                fullName: 1,
                email: 1,
                isVerified: 1,
                phone: 1,
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
      ...(verifiedBool !== null
        ? [
            {
              $match: { 'customer.isVerified': verifiedBool },
            },
          ]
        : []),
      {
        $project: {
          items: 0,
          shippingAddress: 0,
          billingAddress: 0,
          payment: 0,
          shippingFee: 0,
          tax: 0,
          discount: 0,
          couponDiscount: 0,
          softDeleted: 0,
          sellers: 0,
          customerNote: 0,
        },
      },
    ]);

    const result = await this.orderModel.aggregatePaginate(aggregate, {
      page,
      limit,
    });

    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Orders fetched successfully',
    });
  }

  async getSellerOrderById(sellerId: string, orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const [order] = await this.orderModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(orderId),
          sellers: new Types.ObjectId(sellerId),
          softDeleted: false,
        },
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
                fullName: 1,
                email: 1,
                phone: 1,
                totalOrders: 1,
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
          from: 'sellers',
          localField: 'items.seller',
          foreignField: '_id',
          as: '_itemSellers',
          pipeline: [
            {
              $project: {
                name: 1,
                'store.storeName': 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          items: {
            $map: {
              input: '$items',
              as: 'item',
              in: {
                $mergeObjects: [
                  '$$item',
                  {
                    seller: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$_itemSellers',
                            as: 's',
                            cond: { $eq: ['$$s._id', '$$item.seller'] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          _itemSellers: 0,
        },
      },
      {
        $lookup: {
          from: 'sellers',
          localField: 'sellers',
          foreignField: '_id',
          as: 'sellers',
          pipeline: [
            {
              $project: {
                name: 1,
                phone: 1,
                accountStatus: 1,
                'store.storeName': 1,
                'store.image': 1,
                'store.address': 1,
                totalOrders: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          softDeleted: 0,
          updatedAt: 0,
        },
      },
    ]);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return apiResponse({
      data: order,
      message: 'Order fetched successfully',
    });
  }

  async findSellerProducts(sellerId: string, query: GetProductsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      isFeatured,
      isPublished,
      isNew,
      status,
      sortBy,
      sortOrder,
    } = query;

    const filters: QueryFilter<Product> = { softDeleted: false };
    filters.seller = new Types.ObjectId(sellerId);

    if (search) {
      filters.name = { $regex: search, $options: 'i' };
    }

    if (category) {
      filters.category = new Types.ObjectId(category);
    }

    if (isFeatured) {
      filters.isFeatured = isFeatured === 'true';
    }

    if (isPublished) {
      filters.isPublished = isPublished === 'true';
    }

    if (isNew) {
      filters.isNewArrived = isNew === 'true';
    }

    if (status) {
      filters.status = status;
    }

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
          pipeline: [
            {
              $project: {
                name: 1,
                logo: 1,
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
        $lookup: {
          from: 'categories',
          localField: 'subCategory',
          foreignField: '_id',
          as: 'subCategory',
          pipeline: [
            {
              $project: {
                name: 1,
                logo: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$subCategory',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          variants: 0,
          softDeleted: 0,
          updatedAt: 0,
          __v: 0,
        },
      },
      {
        $sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 },
      },
    ];

    const result = await this.productModel.aggregatePaginate(pipeline, {
      page,
      limit,
    });
    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Products fetched successfully',
    });
  }

  async findSellerProductById(
    sellerId: string,
    productId: string,
  ): Promise<ReturnType<typeof apiResponse>> {
    const [product] = await this.productModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(productId),
          seller: new Types.ObjectId(sellerId),
          softDeleted: false,
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
          pipeline: [
            {
              $project: {
                name: 1,
                logo: 1,
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
        $lookup: {
          from: 'categories',
          localField: 'subCategory',
          foreignField: '_id',
          as: 'subCategory',
          pipeline: [
            {
              $project: {
                name: 1,
                logo: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$subCategory',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
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
          path: '$brand',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'benefits',
          localField: 'benefits',
          foreignField: '_id',
          as: 'benefits',
          pipeline: [
            {
              $project: {
                title: 1,
                benefits: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$benefits',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'sellers',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller',
          pipeline: [
            {
              $project: {
                name: 1,
                'store.storeName': 1,
                'store.image': 1,
                totalProducts: 1,
                'store.address': 1,
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
    ]);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return apiResponse({
      data: product,
      message: 'Product fetched successfully',
    });
  }

  async findAllSellerComboProducts(
    id: string,
    query: GetComboProductsQueryDto,
  ) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      date,
      status,
      isPublished,
      isNew,
      isFeatured,
      isUpcoming,
    } = query;

    const filters: QueryFilter<ComboProduct> = {
      seller: new Types.ObjectId(id),
      //softDeleted: false,
    };

    if (search) {
      filters.name = { $regex: search, $options: 'i' };
    }

    if (status !== undefined) {
      filters.status = status;
    }
    if (isPublished !== undefined) {
      filters.isPublished = isPublished === 'true';
    }

    if (isNew !== undefined) {
      filters.isNewArrived = isNew === 'true';
    }

    if (isFeatured !== undefined) {
      filters.isFeatured = isFeatured === 'true';
    }

    if (isUpcoming !== undefined) {
      filters.isUpcoming = isUpcoming === 'true';
    }

    if (date) {
      if (date === 'today') {
        filters.createdAt = {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        };
      } else if (date === 'week') {
        filters.createdAt = {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        };
      } else if (date === 'month') {
        filters.createdAt = {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
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
    ];

    const result = await this.comboProductModel.aggregatePaginate(pipeline, {
      page,
      limit,
    });
    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Combo products fetched successfully',
    });
  }

  async findSellerComboProductById(
    sellerId: string,
    productId: string,
  ): Promise<ReturnType<typeof apiResponse>> {
    const [product] = await this.comboProductModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(productId),
          seller: new Types.ObjectId(sellerId),
          softDeleted: false,
        },
      },
      {
        $lookup: {
          from: 'benefits',
          localField: 'benefits',
          foreignField: '_id',
          as: 'benefits',
          pipeline: [
            {
              $project: {
                title: 1,
                benefits: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$benefits',
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    if (!product) {
      throw new NotFoundException('Combo product not found');
    }
    return apiResponse({
      data: product,
      message: 'Combo product fetched successfully',
    });
  }

  async updateSellerProduct(
    sellerId: string,
    productId: string,
    updateProductDto: UpdateProductDto,
    user: IActiveUser,
  ) {
    const product = await this.productModel.findOne({
      _id: productId,
      seller: new Types.ObjectId(sellerId),
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const updateData: UpdateProductDto = { ...updateProductDto };

    if (updateData.sizeGuide) {
      for (const key in updateData.sizeGuide) {
        updateData[`sizeGuide.${key}`] = updateData.sizeGuide[key];
      }
      delete updateData.sizeGuide;
    }

    if (updateData.variants) {
      for (const key in updateData.variants) {
        updateData[`variants.${key}`] = updateData.variants[key];
      }
      delete updateData.variants;
    }

    await this.productModel.findByIdAndUpdate(productId, updateData, {
      new: true,
      runValidators: true,
    });

    await this.activityService.createActivity({
      title: updateProductDto.status
        ? `Product ${updateProductDto.status?.charAt(0)?.toUpperCase() + updateProductDto.status?.slice(1)?.toLowerCase()}`
        : 'Product Updated',
      action: ActivityAction.UPDATE,
      resourceType: ResourceType.VENDOR_PRODUCT,
      resourceId: product._id,
      user: new Types.ObjectId(user.sub),
      payload: updateProductDto,
    });

    return apiResponse({
      message: 'Product updated successfully',
    });
  }

  async updateSellerProductVariant(
    sellerId: string,
    productId: string,
    updateVariantDto: UpdateVariantDto,
    user: IActiveUser,
  ) {
    const updateFields = {};
    for (const key in updateVariantDto) {
      if (updateVariantDto[key] !== undefined) {
        updateFields[`variants.$.${key}`] = updateVariantDto[key];
      }
    }

    const updatedProduct = await this.productModel
      .findOneAndUpdate(
        {
          _id: productId,
          seller: new Types.ObjectId(sellerId),
          'variants.sku': updateVariantDto.sku,
        },
        { $set: updateFields },
        { new: true },
      )
      .exec();

    if (!updatedProduct) {
      const productExists = await this.productModel.exists({ _id: productId });
      if (!productExists) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }
      throw new NotFoundException(
        `Variant with SKU ${updateVariantDto.sku} not found in this product`,
      );
    }

    await this.activityService.createActivity({
      title: 'Product Variant Updated',
      action: ActivityAction.UPDATE,
      resourceType: ResourceType.VENDOR_PRODUCT,
      resourceId: updatedProduct._id,
      user: new Types.ObjectId(user.sub),
      payload: updateVariantDto,
    });

    return apiResponse({
      data: updatedProduct,
      message: 'Variant updated successfully',
    });
  }

  async removeSellerProduct(
    sellerId: string,
    productId: string,
    user: IActiveUser,
  ) {
    const deletedProduct = await this.productModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(productId),
        seller: new Types.ObjectId(sellerId),
      },
      { softDeleted: true },
      { new: true },
    );
    if (!deletedProduct) {
      throw new NotFoundException('Product not found');
    }
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(deletedProduct.seller) },
      { $inc: { totalProducts: -1 } },
    );

    await this.activityService.createActivity({
      title: 'Product Deleted',
      action: ActivityAction.DELETE,
      resourceType: ResourceType.VENDOR_PRODUCT,
      resourceId: deletedProduct._id,
      user: new Types.ObjectId(user.sub),
    });

    return apiResponse({
      status: true,
      message: 'Product deleted successfully',
    });
  }

  async updateSellerComboProduct(
    sellerId: string,
    productId: string,
    updateComboProductDto: UpdateComboProductDto,
    user: IActiveUser,
  ) {
    const updateData: UpdateComboProductDto = { ...updateComboProductDto };

    if (updateData.sizeGuide) {
      for (const key in updateData.sizeGuide) {
        updateData[`sizeGuide.${key}`] = updateData.sizeGuide[key];
      }
      delete updateData.sizeGuide;
    }

    const updatedComboProduct = await this.comboProductModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(productId),
          seller: new Types.ObjectId(sellerId),
        },
        { $set: updateData },
        { new: true },
      )
      .exec();

    if (!updatedComboProduct) {
      throw new NotFoundException(
        `Combo Product with ID ${productId} not found`,
      );
    }

    await this.activityService.createActivity({
      title: 'Combo Product Updated',
      action: ActivityAction.UPDATE,
      resourceType: ResourceType.VENDOR_COMBO_PRODUCT,
      resourceId: updatedComboProduct._id,
      user: new Types.ObjectId(user.sub),
      payload: updateComboProductDto,
    });

    return apiResponse({
      data: updatedComboProduct,
      message: 'Combo product updated successfully',
    });
  }

  async removeSellerComboProduct(
    sellerId: string,
    productId: string,
    user: IActiveUser,
  ) {
    const deletedComboProduct = await this.comboProductModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(productId),
        seller: new Types.ObjectId(sellerId),
      },
      { softDeleted: true },
      { new: true },
    );

    if (!deletedComboProduct) {
      throw new NotFoundException('Combo Product not found');
    }

    await this.activityService.createActivity({
      title: 'Combo Product Deleted',
      action: ActivityAction.DELETE,
      resourceType: ResourceType.VENDOR_COMBO_PRODUCT,
      resourceId: deletedComboProduct._id,
      user: new Types.ObjectId(user.sub),
    });

    return apiResponse({
      status: true,
      message: 'Combo Product deleted successfully',
    });
  }

  async update(id: string, updateUserDto: UpdateSellerDto) {
    console.log('updateUserDto', updateUserDto);
    const user = await this.userModel.findByIdAndUpdate(id, updateUserDto, {
      new: true,
    });

    if (!user) {
      throw new NotFoundException('Seller not found');
    }

    return apiResponse({ message: 'Seller updated successfully' });
  }

  async remove(id: string) {
    const user = await this.userModel.findByIdAndUpdate(id, {
      softDeleted: true,
    });
    if (!user) {
      throw new NotFoundException('Seller not found');
    }
    return apiResponse({
      status: true,
      message: 'Seller deleted successfully',
    });
  }

  async getWithdrawList(sellerId: string, query: GetSellerWithdrawQueryDto) {
    if (!Types.ObjectId.isValid(sellerId)) {
      throw new BadRequestException('Invalid seller ID');
    }

    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      startDate,
      endDate,
    } = query;

    const filters: Record<string, any> = {
      seller: new Types.ObjectId(sellerId),
    };

    if (search) {
      const searchAbleFields = ['reason', 'subject', 'note', 'phone'];

      filters.$or = searchAbleFields.map((field) => ({
        [field]: { $regex: search, $options: 'i' },
      }));
    }

    if (status) {
      filters.status = status;
    }

    if (startDate || endDate) {
      filters.createdAt = {};

      if (startDate) {
        filters.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        filters.createdAt.$lte = new Date(endDate);
      }
    }

    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.withdrawModel
        .find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      this.withdrawModel.countDocuments(filters),
    ]);

    return apiResponse({
      status: true,
      data: {
        docs: data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      message: 'Withdraws fetched successfully',
    });
  }
  //TODO: Transections
}
