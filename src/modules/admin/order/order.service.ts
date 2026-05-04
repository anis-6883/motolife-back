import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  AnyBulkWriteOperation,
  QueryFilter,
  type AggregatePaginateModel,
  Types,
  type PaginateModel,
  Model,
  ClientSession,
} from 'mongoose';
import { Order, ORDER_STATUS } from '../../../common/models/order.schema';
import { Product } from '../../../common/models/products.schema';
import { Cart } from '../../../common/models/cart.schema';
import { Customer } from '../../../common/models/customers.schema';
import { Seller } from '../../../common/models/seller.schema';
import { ComboProduct } from '../../../common/models/combo-products.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { apiResponse } from 'src/common/utils/api-response';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ActivityService } from '../activity/activity.service';
import { IActiveUser } from '../admin-auth/interfaces/active-user.interface';
import {
  ActivityAction,
  AdminType,
  ResourceType,
} from 'src/common/enums/admin.enum';
import { DeliveryService } from 'src/common/delivery/delivery.service';
import {
  DeliveryType,
  PlaceOrderDto,
} from 'src/common/delivery/dto/place-order.dto';
import { DISCOUNT_TYPE } from 'src/common/enums/products.enum';
import { Role } from 'src/common/models/role.schema';
import { Refund } from 'src/common/models/refunds.schema';
import { REFUND_STATUS } from 'src/common/enums/orders.enum';
import { ShopType } from 'src/common/enums/seller.enums';
import { StockUnits } from 'src/common/models/stock-units';

@Injectable()
export class OrderService {
  private readonly REVERSAL_STATUSES = [
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.RETURNED,
    ORDER_STATUS.REFUNDED,
    ORDER_STATUS.FAILED,
  ];

  private readonly POSITIVE_STATUSES = [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.OUT_FOR_DELIVERY,
    ORDER_STATUS.DELIVERED,
  ];

  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: AggregatePaginateModel<Order>,
    @InjectModel(Product.name)
    private readonly productModel: PaginateModel<Product>,
    @InjectModel(Cart.name)
    private readonly cartModel: PaginateModel<Cart>,
    @InjectModel(Customer.name)
    private readonly customerModel: PaginateModel<Customer>,
    @InjectModel(Seller.name)
    private readonly sellerModel: PaginateModel<Seller>,
    @InjectModel(ComboProduct.name)
    private readonly comboProductModel: PaginateModel<ComboProduct>,
    @InjectModel(Refund.name)
    private readonly refundModel: Model<Refund>,
    @InjectModel(StockUnits.name)
    private readonly stockUnitsModel: Model<StockUnits>,

    private readonly deliveryService: DeliveryService,

    private readonly activityService: ActivityService,
  ) {}

  // async createOrder(dto: CreateOrderDto) {
  //   const {
  //     cartId,
  //     shippingAddress,
  //     billingAddress,
  //     paymentMethod,
  //     customerNote,
  //     deliveryCharge,
  //   } = dto;

  //   const cart = await this.cartModel.findById(cartId);
  //   if (!cart) {
  //     throw new NotFoundException('Cart not found');
  //   }

  //   const { userId, guestId } = cart;

  //   if (!userId && !guestId) {
  //     throw new BadRequestException(
  //       'This cart is not associated with any user or guest',
  //     );
  //   }

  //   if (!cart.items || cart.items.length === 0) {
  //     throw new BadRequestException('Cart is empty');
  //   }

  //   let orderUserId: Types.ObjectId = cart.userId || cart.guestId;

  //   if (userId) {
  //     const existingUser = await this.customerModel.findById(userId);
  //     if (existingUser) {
  //       orderUserId = existingUser._id as Types.ObjectId;
  //     } else if (!existingUser && guestId) {
  //       const newCustomer = new this.customerModel({
  //         fullName: shippingAddress.fullName,
  //         phone: shippingAddress.phone,
  //         email: shippingAddress.email,
  //         isVerified: false,
  //         addresses: [
  //           {
  //             title: 'Home',
  //             address: shippingAddress.address,
  //             thana: shippingAddress.thana,
  //             area: shippingAddress.area,
  //             district: shippingAddress.district,
  //           },
  //         ],
  //       });
  //       await newCustomer.save();
  //       orderUserId = newCustomer._id as Types.ObjectId;
  //     } else {
  //       throw new BadRequestException('Unable to determine user for order');
  //     }
  //   }

  //   const stockValidationErrors: string[] = [];
  //   const productUpdates: Array<{
  //     productId: Types.ObjectId;
  //     variantSku?: string;
  //     quantity: number;
  //   }> = [];

  //   for (const item of cart.items) {
  //     const product = await this.productModel
  //       .findById(item.product)
  //       .select('name stockQuantity variants thumbnail');

  //     if (!product) {
  //       stockValidationErrors.push(`Product ${item.productName} not found`);
  //       continue;
  //     }

  //     if (item.variantSku) {
  //       const variant = product.variants?.find(
  //         (v) => v.sku === item.variantSku,
  //       );
  //       if (!variant) {
  //         stockValidationErrors.push(
  //           `Variant ${item.variantSku} not found for ${item.productName}`,
  //         );
  //         continue;
  //       }
  //       if ((variant.stock || 0) < item.quantity) {
  //         stockValidationErrors.push(
  //           `Insufficient stock for ${item.productName} - ${item.variantSku}`,
  //         );
  //       }
  //     } else {
  //       if ((product.stockQuantity || 0) < item.quantity) {
  //         stockValidationErrors.push(
  //           `Insufficient stock for ${item.productName}.`,
  //         );
  //       }
  //     }

  //     productUpdates.push({
  //       productId: item.product,
  //       variantSku: item.variantSku,
  //       quantity: item.quantity,
  //     });
  //   }

  //   if (stockValidationErrors.length > 0) {
  //     throw new BadRequestException({
  //       message: 'Stock validation failed',
  //       errors: stockValidationErrors,
  //     });
  //   }

  //   const orderItems = await Promise.all(
  //     cart.items.map(async (item) => {
  //       const product = await this.productModel
  //         .findById(item.product)
  //         .select('thumbnail');

  //       return {
  //         product: item.product,
  //         productName: item.productName,
  //         thumbnail: product?.thumbnail || '',
  //         seller: item.seller,
  //         sku: item.sku,
  //         variantSku: item.variantSku,
  //         quantity: item.quantity,
  //         unitPrice: item.unitPrice,
  //         totalPrice: item.totalPrice,
  //       };
  //     }),
  //   );

  //   const subtotal = cart.subtotal;
  //   const shippingFee = cart.shippingFee || 0;
  //   const tax = cart.tax || 0;
  //   const discount = 0;
  //   const total = cart.total + (deliveryCharge || 0);

  //   const order = new this.orderModel({
  //     user: orderUserId,
  //     items: orderItems,
  //     shippingAddress: {
  //       fullName: shippingAddress.fullName,
  //       phone: shippingAddress.phone,
  //       email: shippingAddress.email,
  //       address: shippingAddress.address,
  //       thana: shippingAddress.thana,
  //       area: shippingAddress.area,
  //       district: shippingAddress.district,
  //     },
  //     billingAddress: billingAddress
  //       ? {
  //           fullName: billingAddress.fullName,
  //           phone: billingAddress.phone,
  //           email: billingAddress.email,
  //           address: billingAddress.address,
  //           thana: billingAddress.thana,
  //           area: billingAddress.area,
  //           district: billingAddress.district,
  //         }
  //       : { ...shippingAddress },
  //     payment: {
  //       method: paymentMethod,
  //       status: PAYMENT_STATUS.PENDING,
  //       amountPaid: 0,
  //       currency: 'BDT',
  //     },
  //     subtotal,
  //     shippingFee,
  //     tax,
  //     discount,
  //     total,
  //     customerNote,
  //     status: ORDER_STATUS.PENDING,
  //   });

  //   await order.save();

  //   for (const update of productUpdates) {
  //     if (update.variantSku) {
  //       await this.productModel.updateOne(
  //         { _id: update.productId, 'variants.sku': update.variantSku },
  //         {
  //           $inc: {
  //             'variants.$.stock': -update.quantity,
  //             quantitySold: update.quantity,
  //           },
  //         },
  //       );
  //     } else {
  //       await this.productModel.updateOne(
  //         { _id: update.productId },
  //         {
  //           $inc: {
  //             stockQuantity: -update.quantity,
  //             quantitySold: update.quantity,
  //           },
  //         },
  //       );
  //     }
  //   }

  //   await this.cartModel.findByIdAndDelete(cartId);

  //   return apiResponse({
  //     data: order,
  //     message: 'Order placed successfully',
  //   });
  // }

  async getOrderById(orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const [order] = await this.orderModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(orderId),
          softDeleted: { $ne: true },
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
                'store.logoImage': 1,
                'store.address': 1,
                totalOrders: 1,
              },
            },
          ],
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

  async getOrders(query: OrderQueryDto, user: IActiveUser) {
    const { status, seller, customer, search, date, orderId } = query;
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');

    const matchFilter: QueryFilter<Order> = {
      softDeleted: false,
    };

    if (user.type !== AdminType.ADMIN) {
      matchFilter.assignedTo = new Types.ObjectId(user.sub);
    }

    if (status) {
      matchFilter.status = status;
    }

    if (seller) {
      matchFilter.seller = seller;
    }

    if (customer) {
      matchFilter.customer = new Types.ObjectId(customer);
    }
    if (search) {
      matchFilter.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
        { 'shippingAddress.address': { $regex: search, $options: 'i' } },
      ];
    }

    if (orderId) {
      matchFilter.orderId = orderId;
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
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
          pipeline: [
            {
              $project: {
                name: 1,
                email: 1,
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
                'store.storeName': 1,
                shopType: 1,
              },
            },
          ],
        },
      },
      // {
      //   $match: {
      //     'sellers.shopType': ShopType.INHOUSE,
      //   },
      // },
      {
        $project: {
          softDeleted: 0,
          updatedAt: 0,
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

  async updateOrder(
    orderId: string,
    update: UpdateOrderDto,
    user: IActiveUser,
  ) {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {
      const orderExists = await this.orderModel
        .findById(orderId)
        .select('status')
        .lean();

      if (!orderExists) {
        throw new NotFoundException('Order not found');
      }

      if (update.status === ORDER_STATUS.DELIVERED) {
        update.deliveredAt = new Date();
      }

      const prevStatus = orderExists.status;

      const order = await this.orderModel.findByIdAndUpdate(orderId, update, {
        new: true,
        session,
      });

      if (order?.status === ORDER_STATUS.OUT_FOR_DELIVERY) {
        const placeOrderPayload: PlaceOrderDto = {
          invoice: order.orderId,
          recipient_name: order.shippingAddress?.fullName,
          recipient_phone: order.shippingAddress?.phone,
          recipient_email: order.shippingAddress?.email,
          recipient_address: JSON.stringify(order.shippingAddress),
          cod_amount: order.total,
          delivery_type: DeliveryType.HOME,
        };

        await this.deliveryService.placeOrder(placeOrderPayload);
      }

      if (update.status) {
        await this.handleOrderStatusUpdate(
          order!,
          update.status,
          prevStatus,
          session,
        );
      }

      await this.activityService.createActivity(
        {
          title: update.status
            ? `Changed Order Status to ${update.status?.charAt(0)?.toUpperCase() + update.status?.slice(1)?.toLowerCase()}`
            : 'Order Updated',
          action: ActivityAction.UPDATE,
          resourceType: ResourceType.ORDER,
          resourceId: order!._id,
          user: new Types.ObjectId(user.sub),
          payload: update,
        },
        session,
      );

      await session.commitTransaction();

      return apiResponse({
        message: 'Order updated successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  private async handleOrderStatusUpdate(
    order: Order,
    status: ORDER_STATUS,
    prevStatus: ORDER_STATUS,
    session: ClientSession,
  ) {
    const productStockOps: AnyBulkWriteOperation<Product>[] = [];
    const comboProductStockOps: AnyBulkWriteOperation<ComboProduct>[] = [];
    const variantStockOps: AnyBulkWriteOperation<Product>[] = [];
    const stockUnitsOps: AnyBulkWriteOperation<any>[] = [];

    let isStockIncrease = false;
    let isSameKindStatus = false;

    if (
      this.POSITIVE_STATUSES.includes(status) &&
      this.REVERSAL_STATUSES.includes(prevStatus)
    ) {
      isStockIncrease = false;
    } else if (
      this.REVERSAL_STATUSES.includes(status) &&
      this.POSITIVE_STATUSES.includes(prevStatus)
    ) {
      isStockIncrease = true;
    } else {
      isSameKindStatus = true;
    }

    for (const item of order.items) {
      if (item.isCombo) {
        comboProductStockOps.push({
          updateOne: {
            filter: { _id: item.comboProduct },
            update: {
              $inc: {
                stockQuantity: isSameKindStatus
                  ? 0
                  : isStockIncrease
                    ? item.quantity
                    : -item.quantity,
                quantitySold: isSameKindStatus
                  ? 0
                  : isStockIncrease
                    ? -item.quantity
                    : item.quantity,
                totalOrderAmount: isSameKindStatus
                  ? 0
                  : isStockIncrease
                    ? -item.totalPrice
                    : item.totalPrice,
              },
            },
          },
        });
      } else if (item.variantSku) {
        variantStockOps.push({
          updateOne: {
            filter: {
              _id: item.product,
              'variants.sku': item.variantSku,
            },
            update: {
              $inc: {
                'variants.$.stock': isSameKindStatus
                  ? 0
                  : isStockIncrease
                    ? item.quantity
                    : -item.quantity,
                stockQuantity: isSameKindStatus
                  ? 0
                  : isStockIncrease
                    ? item.quantity
                    : -item.quantity,
                quantitySold: isSameKindStatus
                  ? 0
                  : isStockIncrease
                    ? -item.quantity
                    : item.quantity,
                totalOrderAmount: isSameKindStatus
                  ? 0
                  : isStockIncrease
                    ? -item.totalPrice
                    : item.totalPrice,
              },
            },
          },
        });
      } else {
        productStockOps.push({
          updateOne: {
            filter: { _id: item.product },
            update: {
              $inc: {
                stockQuantity: isSameKindStatus
                  ? 0
                  : isStockIncrease
                    ? item.quantity
                    : -item.quantity,
                quantitySold: isSameKindStatus
                  ? 0
                  : isStockIncrease
                    ? -item.quantity
                    : item.quantity,
                totalOrderAmount: isSameKindStatus
                  ? 0
                  : isStockIncrease
                    ? -item.totalPrice
                    : item.totalPrice,
              },
            },
          },
        });
      }

      if (!isSameKindStatus && !item.isCombo) {
        const targetSku = item.variantSku || item.sku;

        for (let i = 0; i < item.quantity; i++) {
          stockUnitsOps.push({
            updateOne: {
              filter: {
                productId: item.product,
                parentSku: targetSku,
                softDeleted: isStockIncrease,
              },
              update: {
                $set: { softDeleted: !isStockIncrease },
              },
            },
          });
        }
      }
    }

    if (productStockOps.length > 0) {
      await this.productModel.bulkWrite(productStockOps, { session });
    }
    if (variantStockOps.length > 0) {
      await this.productModel.bulkWrite(variantStockOps, { session });
    }
    if (comboProductStockOps.length > 0) {
      await this.comboProductModel.bulkWrite(comboProductStockOps, { session });
    }
    if (stockUnitsOps.length > 0) {
      await this.stockUnitsModel.bulkWrite(stockUnitsOps, { session });
    }

    const sellerRefunds = new Map<string, number>();
    for (const item of order.items) {
      const sellerId = item.seller.toString();
      const currentAmount = sellerRefunds.get(sellerId) || 0;
      sellerRefunds.set(sellerId, currentAmount + item.totalPrice);
    }

    for (const [sellerId, refundAmount] of sellerRefunds.entries()) {
      await this.sellerModel.updateOne(
        { _id: new Types.ObjectId(sellerId) },
        {
          $inc: {
            totalOrders: isSameKindStatus ? 0 : isStockIncrease ? -1 : 1,
            balance: isSameKindStatus
              ? 0
              : isStockIncrease
                ? -refundAmount
                : refundAmount,
          },
        },
        { session },
      );
    }

    await this.customerModel.updateOne(
      { _id: order.customer },
      {
        $inc: { totalOrders: isSameKindStatus ? 0 : isStockIncrease ? -1 : 1 },
      },
      { session },
    );

    if (
      status === ORDER_STATUS.REFUNDED &&
      prevStatus !== ORDER_STATUS.REFUNDED
    ) {
      await this.refundModel.create(
        [
          {
            items: order.items,
            order: order._id,
            customer: order.customer,
            totalAmount: order.subtotal,
            status: REFUND_STATUS.REFUNDED,
          },
        ],
        { session },
      );
    } else if (
      prevStatus === ORDER_STATUS.REFUNDED &&
      status !== ORDER_STATUS.REFUNDED
    ) {
      await this.refundModel.deleteOne({ order: order._id }, { session });
    }
  }

  async applyDiscount(
    orderId: string,
    update: UpdateOrderDto,
    user: IActiveUser,
  ) {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {
      const order = await this.orderModel.findById(orderId);

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (update.specialDiscount) {
        let subtotal = order.prevSubTotal;

        if (update.specialDiscount.discountType === DISCOUNT_TYPE.PERCENTAGE) {
          if (
            update.specialDiscount.discountValue < 0 ||
            update.specialDiscount.discountValue > 100
          ) {
            throw new BadRequestException('Invalid discount value');
          }
          subtotal =
            subtotal - (subtotal * update.specialDiscount.discountValue) / 100;
        } else {
          if (
            update.specialDiscount.discountValue < 0 ||
            update.specialDiscount.discountValue > order.prevSubTotal
          ) {
            throw new BadRequestException('Invalid discount value');
          }
          subtotal = subtotal - update.specialDiscount.discountValue;
        }

        order.specialDiscount = update.specialDiscount;
        order.subtotal = subtotal;
        order.total = order.total - order.prevSubTotal + subtotal;
      } else {
        const subtotal = order.subtotal;
        order.subtotal = order.prevSubTotal;
        order.total = order.total - subtotal + order.prevSubTotal;
        order.specialDiscount = null;
      }

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      await order.save({ session });

      await this.activityService.createActivity(
        {
          title: 'Order Special Discount Applied',
          action: ActivityAction.UPDATE,
          resourceType: ResourceType.ORDER,
          resourceId: order._id,
          user: new Types.ObjectId(user.sub),
          payload: update,
        },
        session,
      );

      await session.commitTransaction();

      return apiResponse({
        message: 'Order updated successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async removeDiscount(orderId: string, user: IActiveUser) {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {
      const order = await this.orderModel.findById(orderId);

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (!order.specialDiscount) {
        throw new BadRequestException(
          'Special discount is not applied for this order',
        );
      }

      const subtotal = order.subtotal;
      order.subtotal = order.prevSubTotal;
      order.total = order.total - subtotal + order.prevSubTotal;
      order.specialDiscount = null;

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      await order.save({ session });

      await this.activityService.createActivity(
        {
          title: 'Order Special Discount Removed',
          action: ActivityAction.UPDATE,
          resourceType: ResourceType.ORDER,
          resourceId: order._id,
          user: new Types.ObjectId(user.sub),
        },
        session,
      );

      await session.commitTransaction();

      return apiResponse({
        message: 'Order updated successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async getOrderStats(user: IActiveUser) {
    const matchFilter: QueryFilter<Order> = {
      softDeleted: false,
    };

    if (user.type !== AdminType.ADMIN) {
      matchFilter.assignedTo = new Types.ObjectId(user.sub);
    }

    const analytics = await this.orderModel.aggregate([
      {
        $match: matchFilter,
      },
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
        },
      },
    ]);

    return apiResponse({
      data: analytics,
      message: 'Order stats fetched successfully',
    });
  }
}
