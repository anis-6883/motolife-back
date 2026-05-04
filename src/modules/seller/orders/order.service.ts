import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, type AggregatePaginateModel, Types } from 'mongoose';
import { Order, ORDER_STATUS } from '../../../common/models/order.schema';
import { OrderQueryDto } from './dto/order-query.dto';
import { apiResponse } from 'src/common/utils/api-response';
import { IActiveUser } from '../auth/interfaces/active-user.interface';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: AggregatePaginateModel<Order>,
  ) {}

  async getOrderById(user: IActiveUser, orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const sellerId = new Types.ObjectId(user.sub);
    const [order] = await this.orderModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(orderId),
          softDeleted: { $ne: true },
          sellers: sellerId,
        },
      },
      {
        $addFields: {
          originalItems: '$items',
          items: {
            $filter: {
              input: '$items',
              as: 'item',
              cond: { $eq: ['$$item.seller', sellerId] },
            },
          },
        },
      },
      {
        $addFields: {
          sellerSubtotal: {
            $sum: '$items.totalPrice',
          },
          sellerTotalItems: { $size: '$items' },
          sellerTotalQuantity: {
            $sum: '$items.quantity',
          },
        },
      },
      // {
      //   $addFields: {
      //     sellerTotal: {
      //       $subtract: [
      //         {
      //           $add: ['$sellerSubtotal', '$sellerShippingFee', '$sellerTax'],
      //         },
      //         {
      //           $add: ['$sellerDiscount', '$sellerCouponDiscount'],
      //         },
      //       ],
      //     },
      //   },
      // },
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
        $project: {
          orderId: 1,
          customer: 1,
          shippingAddress: 1,
          billingAddress: 1,
          payment: 1,
          status: 1,
          customerNote: 1,
          deliveredAt: 1,
          cancelledAt: 1,
          cancellationReason: 1,
          cancellationNote: 1,
          createdAt: 1,
          items: 1,
          sellerSubtotal: 1,
          subtotal: 1,
          shippingFee: 1,
          tax: 1,
          discount: 1,
          couponDiscount: 1,
          total: 1,
          totalItems: '$sellerTotalItems',
          totalQuantity: '$sellerTotalQuantity',
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

  async getOrders(user: IActiveUser, query: OrderQueryDto) {
    const { status, customer, search, date } = query;
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');

    const sellerId = new Types.ObjectId(user.sub);

    const matchFilter: QueryFilter<Order> = {
      softDeleted: false,
      sellers: sellerId,
    };

    if (status) {
      matchFilter.status = status;
    }

    if (customer) {
      matchFilter.customer = new Types.ObjectId(customer);
    }

    if (search) {
      matchFilter.$or = [
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
        { 'shippingAddress.address': { $regex: search, $options: 'i' } },
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

    const aggregate = this.orderModel.aggregate([
      { $match: matchFilter },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          items: {
            $filter: {
              input: '$items',
              as: 'item',
              cond: { $eq: ['$$item.seller', sellerId] },
            },
          },
        },
      },
      {
        $addFields: {
          sellerSubtotal: {
            $sum: '$items.totalPrice',
          },
          sellerTotalItems: { $size: '$items' },
          sellerTotalQuantity: {
            $sum: '$items.quantity',
          },
        },
      },
      // {
      //   $addFields: {
      //     sellerShippingFee: {
      //       $multiply: ['$shippingFee', '$sellerProportionOfOrder'],
      //     },
      //     sellerTax: {
      //       $multiply: ['$tax', '$sellerProportionOfOrder'],
      //     },
      //     sellerDiscount: {
      //       $multiply: ['$discount', '$sellerProportionOfOrder'],
      //     },
      //     sellerCouponDiscount: {
      //       $multiply: ['$couponDiscount', '$sellerProportionOfOrder'],
      //     },
      //   },
      // },
      // {
      //   $addFields: {
      //     sellerTotal: {
      //       $subtract: [
      //         {
      //           $add: ['$sellerSubtotal', '$sellerShippingFee', '$sellerTax'],
      //         },
      //         {
      //           $add: ['$sellerDiscount', '$sellerCouponDiscount'],
      //         },
      //       ],
      //     },
      //   },
      // },
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
        $project: {
          orderId: 1,
          customer: 1,
          items: 1,
          shippingAddress: 1,
          payment: 1,
          status: 1,
          createdAt: 1,
          deliveredAt: 1,
          sellerSubtotal: 1,
          subtotal: 1,
          shippingFee: 1,
          tax: 1,
          discount: 1,
          couponDiscount: 1,
          total: 1,
          totalItems: '$sellerTotalItems',
          totalQuantity: '$sellerTotalQuantity',
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

  async getOrderStats(user: IActiveUser) {
    const sellerId = new Types.ObjectId(user.sub);

    const analytics = await this.orderModel.aggregate([
      {
        $match: {
          sellers: sellerId,
          softDeleted: false,
        },
      },
      {
        $addFields: {
          sellerItems: {
            $filter: {
              input: '$items',
              as: 'item',
              cond: { $eq: ['$$item.seller', sellerId] },
            },
          },
        },
      },
      {
        $addFields: {
          sellerSubtotal: {
            $sum: '$sellerItems.totalPrice',
          },
          // sellerProportionOfOrder: {
          //   $cond: {
          //     if: { $gt: ['$subtotal', 0] },
          //     then: {
          //       $divide: [{ $sum: '$sellerItems.totalPrice' }, '$subtotal'],
          //     },
          //     else: 0,
          //   },
          // },
        },
      },
      // {
      //   $addFields: {
      //     sellerShippingFee: {
      //       $multiply: ['$shippingFee', '$sellerProportionOfOrder'],
      //     },
      //     sellerTax: {
      //       $multiply: ['$tax', '$sellerProportionOfOrder'],
      //     },
      //     sellerDiscount: {
      //       $multiply: ['$discount', '$sellerProportionOfOrder'],
      //     },
      //     sellerCouponDiscount: {
      //       $multiply: ['$couponDiscount', '$sellerProportionOfOrder'],
      //     },
      //   },
      // },
      // {
      //   $addFields: {
      //     sellerTotal: {
      //       $subtract: [
      //         {
      //           $add: ['$sellerSubtotal', '$sellerShippingFee', '$sellerTax'],
      //         },
      //         {
      //           $add: ['$sellerDiscount', '$sellerCouponDiscount'],
      //         },
      //       ],
      //     },
      //   },
      // },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          processingOrders: {
            $sum: {
              $cond: {
                if: { $eq: ['$status', ORDER_STATUS.PROCESSING] },
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
          cancelledOrders: {
            $sum: {
              $cond: {
                if: { $eq: ['$status', ORDER_STATUS.CANCELLED] },
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
          totalEarning: {
            $sum: '$sellerSubtotal',
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalOrders: 1,
          processingOrders: 1,
          deliveredOrders: 1,
          cancelledOrders: 1,
          shippedOrders: 1,
          totalEarning: { $round: ['$totalEarning', 2] },
        },
      },
    ]);

    return apiResponse({
      data: analytics[0] || {
        totalOrders: 0,
        processingOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        shippedOrders: 0,
        totalEarning: 0,
      },
      message: 'Order stats fetched successfully',
    });
  }
}
