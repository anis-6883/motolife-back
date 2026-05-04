import {
  BadRequestException,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PipelineStage,
  QueryFilter,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { GetAllCustomersQueryDto } from './dto/get-all-customers-query.dto';
import { apiResponse } from 'src/common/utils/api-response';
import { Customer } from 'src/common/models/customers.schema';
import { Order, ORDER_STATUS } from 'src/common/models/order.schema';
import { CustomerOrdersQueryDto } from './dto/customer-order-query.dto';
import { UpdateCustomerDto } from 'src/modules/customer/account/dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(Customer.name)
    private readonly userModel: AggregatePaginateModel<Customer>,
    @InjectModel(Order.name)
    private readonly orderModel: AggregatePaginateModel<Order>,
  ) {}

  async findAll(query: GetAllCustomersQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      accountStatus,
      isVerified,
    } = query;

    const filter: QueryFilter<Customer> = {
      softDeleted: false,
    };

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (accountStatus) {
      filter.accountStatus = accountStatus;
    }

    if (isVerified !== undefined) {
      filter.isVerified = isVerified;
    }

    const pipeline: PipelineStage[] = [
      {
        $match: filter,
      },
      {
        $project: {
          fullName: 1,
          phone: 1,
          email: 1,
          isVerified: 1,
          accountStatus: 1,
          totalOrders: 1,
          image: 1,
        },
      },
      {
        $sort: {
          [sortBy]: sortOrder === 'asc' ? 1 : -1,
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
      message: 'Customers fetched successfully',
    });
  }

  public async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    try {
      const [user] = await this.userModel.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(id),
            softDeleted: false,
          },
        },
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: 'customer',
            as: 'orderStats',
            pipeline: [
              {
                $group: {
                  _id: null,
                  totalOrders: { $sum: 1 },
                  ongoingOrders: {
                    $sum: {
                      $cond: {
                        if: {
                          $in: [
                            '$status',
                            [
                              ORDER_STATUS.PROCESSING,
                              ORDER_STATUS.SHIPPED,
                              ORDER_STATUS.OUT_FOR_DELIVERY,
                              ORDER_STATUS.PENDING,
                              ORDER_STATUS.CONFIRMED,
                            ],
                          ],
                        },
                        then: 1,
                        else: 0,
                      },
                    },
                  },
                  cancelledOrders: {
                    $sum: {
                      $cond: {
                        if: {
                          $eq: ['$status', ORDER_STATUS.CANCELLED],
                        },
                        then: 1,
                        else: 0,
                      },
                    },
                  },
                  completedOrders: {
                    $sum: {
                      $cond: {
                        if: {
                          $in: ['$status', [ORDER_STATUS.DELIVERED]],
                        },
                        then: 1,
                        else: 0,
                      },
                    },
                  },
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: '$orderStats',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'wishlists',
            localField: '_id',
            foreignField: 'customer',
            as: 'wishlist',
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
            wishlistCount: { $size: '$wishlist' },
          },
        },
        {
          $project: {
            softDeleted: 0,
            createdAt: 0,
            updatedAt: 0,
            totalOrders: 0,
            'orderStats._id': 0,
            availablePoints: 0,
            totalPoints: 0,
            wishlist: 0,
          },
        },
      ]);

      if (!user || user.length === 0) {
        throw new NotFoundException('Customer not found');
      }

      return apiResponse({
        data: user,
        message: 'Customer fetched successfully',
      });
    } catch (error) {
      throw new RequestTimeoutException(error.message);
    }
  }

  // async customerOrderStats(customerId: string) {
  //   const [orderStats] = await this.orderModel.aggregate([
  //     {
  //       $match: {
  //         customers: new Types.ObjectId(customerId),
  //       },
  //     },
  //     {
  //       $group: {
  //         _id: null,
  //         processingOrders: {
  //           $sum: {
  //             $cond: {
  //               if: { $eq: ['$status', ORDER_STATUS.PROCESSING] },
  //               then: 1,
  //               else: 0,
  //             },
  //           },
  //         },
  //         shippedOrders: {
  //           $sum: {
  //             $cond: {
  //               if: { $eq: ['$status', ORDER_STATUS.SHIPPED] },
  //               then: 1,
  //               else: 0,
  //             },
  //           },
  //         },
  //         cancelledOrders: {
  //           $sum: {
  //             $cond: {
  //               if: { $eq: ['$status', ORDER_STATUS.CANCELLED] },
  //               then: 1,
  //               else: 0,
  //             },
  //           },
  //         },
  //         deliveredOrders: {
  //           $sum: {
  //             $cond: {
  //               if: { $eq: ['$status', ORDER_STATUS.DELIVERED] },
  //               then: 1,
  //               else: 0,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   ]);

  //   return apiResponse({
  //     data: orderStats,
  //     message: 'Customer order stats fetched successfully',
  //   });
  // }

  async getOrders(customerId: string, query: CustomerOrdersQueryDto) {
    const { search } = query;
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');

    const matchFilter: QueryFilter<Order> = {
      softDeleted: false,
      customer: new Types.ObjectId(customerId),
    };

    if (search) {
      matchFilter.$or = [{ orderId: { $regex: search, $options: 'i' } }];
    }

    const aggregate = this.orderModel.aggregate([
      { $match: matchFilter },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          orderId: 1,
          createdAt: 1,
          status: 1,
          total: 1,
          payments: 1,
        },
      },
    ]);

    const result = await this.orderModel.aggregatePaginate(aggregate, {
      page,
      limit: limit > 50 ? 50 : limit,
    });

    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Orders fetched successfully',
    });
  }

  async getCustomerOrderById(customerId: string, orderId: string) {
    const [order] = await this.orderModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(orderId),
          customer: new Types.ObjectId(customerId),
          softDeleted: false,
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
                email: 1,
                'store.storeName': 1,
                'store.logoImage': 1,
              },
            },
          ],
        },
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo',
          pipeline: [
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
                      phone: 1,
                      'store.storeName': 1,
                      'store.logoImage': 1,
                    },
                  },
                ],
              },
            },
            { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                sellingPrice: 1,
                discountPrice: 1,
                seller: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          items: {
            $mergeObjects: ['$items', { $arrayElemAt: ['$productInfo', 0] }],
          },
        },
      },
      { $unset: 'productInfo' },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
          pipeline: [{ $project: { fullName: 1, phone: 1, email: 1 } }],
        },
      },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          softDeleted: 0,
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

  async update(id: string, updateUserDto: UpdateCustomerDto) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      updateUserDto,
      {
        new: true,
      },
    );

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return apiResponse({
      data: updatedUser,
      message: 'User updated successfully',
    });
  }

  async delete(customerId: string) {
    const deletedCustomer = await this.userModel.findByIdAndUpdate(
      customerId,
      {
        softDeleted: true,
      },
      { new: true },
    );

    if (!deletedCustomer) {
      throw new NotFoundException('Customer not found');
    }

    return apiResponse({
      message: 'Customer deleted successfully ',
    });
  }
}
