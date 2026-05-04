import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  QueryFilter,
  type AggregatePaginateModel,
  Types,
  type PaginateModel,
  Model,
  isValidObjectId,
  ClientSession,
} from 'mongoose';
import {
  Order,
  ORDER_STATUS,
  OrderItem,
} from '../../../common/models/order.schema';
import { Product } from '../../../common/models/products.schema';
import { Cart, CartItem } from '../../../common/models/cart.schema';
import { Customer } from '../../../common/models/customers.schema';
import { CreateOrderDto, OrderNowDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { apiResponse } from 'src/common/utils/api-response';
import { IActiveUser } from '../auth/interfaces/active-user.interface';
import { Seller } from 'src/common/models/seller.schema';
import { RequestRefundDto } from './dto/request-refund.dto';
import { Refund } from 'src/common/models/refunds.schema';
import {
  PAYMENT_STATUS,
  REFUND_ITEM_STATUS,
  REFUND_STATUS,
} from 'src/common/enums/orders.enum';
import { BusinessSettings } from 'src/common/models/business-settings.schema';
import { ComboProduct } from 'src/common/models/combo-products.schema';
import { LimitedStock } from 'src/common/models/limited-stocks.schema';
import { UserIdentity } from 'src/common/interfaces/identity.interface';
import { Coupon, CouponType } from 'src/common/models/coupon.schema';
import { CouponUsage } from 'src/common/models/coupon-usage.schema';
import { DISCOUNT_TYPE } from 'src/common/enums/products.enum';

interface CancelOrderDto {
  cancellationReason?: string;
  cancellationNote?: string;
}

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: AggregatePaginateModel<Order>,
    @InjectModel(Product.name)
    private readonly productModel: PaginateModel<Product>,
    @InjectModel(ComboProduct.name)
    private readonly comboProductModel: PaginateModel<ComboProduct>,
    @InjectModel(Cart.name)
    private readonly cartModel: PaginateModel<Cart>,
    @InjectModel(Customer.name)
    private readonly customerModel: PaginateModel<Customer>,
    @InjectModel(Refund.name)
    private readonly refundModel: PaginateModel<Refund>,
    @InjectModel(Seller.name)
    private readonly sellerModel: PaginateModel<Seller>,
    @InjectModel(BusinessSettings.name)
    private readonly businessSettingsModel: PaginateModel<BusinessSettings>,
    @InjectModel(LimitedStock.name)
    private readonly limitedStockModel: Model<LimitedStock>,
    @InjectModel(Coupon.name)
    private readonly couponModel: PaginateModel<Coupon>,
    @InjectModel(CouponUsage.name)
    private readonly couponUsageModel: PaginateModel<CouponUsage>,
  ) {}

  async createOrder(user: UserIdentity, dto: CreateOrderDto) {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {
      const {
        cartId,
        shippingAddress,
        billingAddress,
        paymentMethod,
        customerNote,
        couponCode,
      } = dto;

      const { id, isGuest } = user;

      let itemsToOrder: any[] = [];
      let subtotal = 0;
      let isFromOrderNow = false;

      const cart = await this.cartModel.findById(cartId);

      if (cart) {
        if (!cart.userId && !cart.guestId) {
          throw new BadRequestException(
            'This cart is not associated with any user or guest',
          );
        }

        itemsToOrder = cart.items;
        subtotal = cart.subtotal;
      } else {
        if (dto.items) {
          isFromOrderNow = true;
          itemsToOrder = await Promise.all(
            dto.items?.map((item) => this.getOrderNowItem(item)),
          );
        }
        subtotal = itemsToOrder.reduce((sum, item) => sum + item.totalPrice, 0);
      }

      if (!itemsToOrder || itemsToOrder.length === 0) {
        throw new BadRequestException('Items are empty');
      }

      let orderUserId: Types.ObjectId | string = id;

      const settings = await this.businessSettingsModel.findOne({});

      if (!settings) throw new ServiceUnavailableException();

      let existingUser: Customer | null = null;

      if (isValidObjectId(id)) {
        existingUser = await this.customerModel.findById(id);
      }

      if (existingUser) {
        orderUserId = existingUser._id as Types.ObjectId;
      } else {
        existingUser = await this.customerModel
          .findOne({
            phone: shippingAddress.phone,
            softDeleted: false,
          })
          .lean();

        if (existingUser) {
          orderUserId = existingUser._id as Types.ObjectId;
        } else {
          const newCustomer = new this.customerModel({
            fullName: shippingAddress.fullName,
            phone: shippingAddress.phone,
            email: shippingAddress.email,
            isVerified: false,
            addresses: [
              {
                title: 'Home',
                address: shippingAddress.address,
                thana: shippingAddress.thana,
                district: shippingAddress.district,
              },
            ],
          });
          await newCustomer.save({ session });
          orderUserId = newCustomer._id as Types.ObjectId;
        }
      }

      const stockValidationErrors: string[] = [];
      const productUpdates: Array<{
        productId: Types.ObjectId;
        variantSku?: string;
        quantity: number;
        totalPrice: number;
      }> = [];

      const comboProductUpdates: Array<{
        comboProductId: Types.ObjectId;
        quantity: number;
        totalPrice: number;
      }> = [];

      for (const item of itemsToOrder) {
        const product = item.isCombo
          ? await this.comboProductModel
              .findById(item.comboProduct)
              .select(
                'name stockQuantity thumbnail weight sellingPrice hasDiscount',
              )
          : await this.productModel
              .findById(item.product)
              .select(
                'name sellingPrice hasDiscount stockQuantity variants thumbnail weight',
              );

        if (!product) {
          stockValidationErrors.push(`Product ${item.productName} not found`);
          continue;
        }

        item.hasDiscount = product.hasDiscount;
        item.sellingPrice = product.sellingPrice;

        if (!item.isCombo && item.variantSku) {
          const variant = (product as Product).variants?.find(
            (v) => v.sku === item.variantSku,
          );
          if (!variant) {
            stockValidationErrors.push(
              `Variant ${item.variantSku} not found for ${item.productName}`,
            );
            continue;
          }
          if ((variant.stock || 0) < item.quantity) {
            stockValidationErrors.push(
              `Insufficient stock for ${item.productName} - ${item.variantSku}`,
            );
          }

          item.sellingPrice = variant.variantPrice;
        } else {
          if ((product.stockQuantity || 0) < item.quantity) {
            stockValidationErrors.push(
              `Insufficient stock for ${item.productName}.`,
            );
          }
        }

        if (!item.isCombo) {
          productUpdates.push({
            productId: item.product as Types.ObjectId,
            variantSku: item.variantSku,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
          });
        } else {
          comboProductUpdates.push({
            comboProductId: item.comboProduct as Types.ObjectId,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
          });
        }
      }

      if (stockValidationErrors.length > 0) {
        throw new BadRequestException({
          message: 'Sorry, we have ran out of stock of some products!',
          errors: stockValidationErrors,
        });
      }

      const orderItems = await Promise.all(
        itemsToOrder.map(async (item) => {
          return {
            ...(item.isCombo
              ? { comboProduct: item.comboProduct }
              : { product: item.product }),
            isCombo: item.isCombo,
            productName: item.productName,
            thumbnail: item.thumbnail || '',
            seller: item.seller,
            sku: item.sku,
            variantSku: item.variantSku,
            attributes: item.attributes,
            variation: item.variation,
            quantity: item.quantity,
            sellingPrice: item.sellingPrice,
            hasDiscount: item.hasDiscount,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          };
        }),
      );

      let coupon: Coupon | null = null;
      let couponDiscount = 0;

      if (cart && cart.coupon) {
        coupon = await this.couponModel.findById(cart.coupon);
        if (!coupon) {
          throw new BadRequestException('Coupon not found');
        }
      } else if (couponCode) {
        coupon = await this.couponModel.findOne({ code: couponCode });
        if (!coupon) {
          throw new BadRequestException('Coupon not found');
        }
      }

      const orderSettings = await this.businessSettingsModel
        .findOne({})
        .select('order shipping')
        .lean();

      let shippingFee = dto.deliveryCharge || 0;

      if (
        orderSettings?.order?.isFreeDeliveryEnabled &&
        subtotal >= orderSettings?.order?.freeDeliveryThreshold
      ) {
        shippingFee = 0;
      }

      let total = subtotal;

      if (coupon) {
        const {
          appliedDiscount,
          isFreeDelivery,
          updatedItems,
          updatedSubtotal,
        } = await this.applyCoupon({
          userId: orderUserId,
          total,
          subtotal,
          coupon,
          orderItems,
          isFromOrderNow,
          session,
        });

        subtotal = updatedSubtotal;
        itemsToOrder = updatedItems;
        couponDiscount = appliedDiscount;

        if (isFreeDelivery) {
          shippingFee = 0;
        } else {
          total =
            coupon.type === CouponType.PRODUCT_BASED
              ? subtotal
              : subtotal - appliedDiscount;
        }
      }

      total = total + shippingFee;

      const order = new this.orderModel({
        customer: orderUserId,
        items: orderItems,
        shippingAddress: {
          fullName: shippingAddress.fullName,
          phone: shippingAddress.phone,
          email: shippingAddress.email,
          address: shippingAddress.address,
          thana: shippingAddress.thana,
          district: shippingAddress.district,
        },
        billingAddress: billingAddress
          ? {
              fullName: billingAddress.fullName,
              phone: billingAddress.phone,
              email: billingAddress.email,
              address: billingAddress.address,
              thana: billingAddress.thana,
              district: billingAddress.district,
            }
          : { ...shippingAddress },
        payment: {
          method: paymentMethod,
          status: PAYMENT_STATUS.PENDING,
          amountPaid: 0,
          currency: 'BDT',
        },
        subtotal,
        prevSubTotal: subtotal,
        shippingFee,
        tax: 0,
        discount: 0,
        ...(coupon && {
          coupon: coupon._id,
          couponDiscount,
        }),
        total,
        customerNote,
        status: ORDER_STATUS.PENDING,
      });

      if (dto.total && dto.total !== order.total) {
        throw new BadRequestException('Order total does not match');
      }

      await order.save({ session });

      await this.customerModel.updateOne(
        { _id: order.customer },
        { $inc: { totalOrders: 1 } },
        { session },
      );

      const sellerSales = new Map<string, number>();

      orderItems.forEach((item) => {
        const sellerId = item.seller.toString();
        const currentTotal = sellerSales.get(sellerId) || 0;
        sellerSales.set(sellerId, currentTotal + item.totalPrice);
      });

      for (const [sellerId, salesAmount] of sellerSales.entries()) {
        await this.sellerModel.updateOne(
          { _id: new Types.ObjectId(sellerId) },
          {
            $inc: {
              totalOrders: 1,
              balance: salesAmount,
            },
          },
          { session },
        );
      }

      for (const update of productUpdates) {
        if (update.variantSku) {
          const product = await this.productModel.findOneAndUpdate(
            { _id: update.productId, 'variants.sku': update.variantSku },
            {
              $inc: {
                'variants.$.stock': -update.quantity,
                stockQuantity: -update.quantity,
                quantitySold: update.quantity,
                totalOrderAmount: update.totalPrice,
              },
            },
            {
              returnDocument: 'after',
              session,
            },
          );

          const stockLeft =
            product?.variants.find((v) => v.sku === update.variantSku)?.stock ||
            0;

          if (product && (stockLeft < settings?.vendor?.stockThreshold || 0)) {
            await this.limitedStockModel.create(
              [
                {
                  productId: product._id,
                  variantSku: update.variantSku,
                  seller: product.seller,
                },
              ],
              { session },
            );
          }
        } else {
          const product = await this.productModel.findOneAndUpdate(
            { _id: update.productId },
            {
              $inc: {
                stockQuantity: -update.quantity,
                quantitySold: update.quantity,
                totalOrderAmount: update.totalPrice,
              },
            },
            {
              returnDocument: 'after',
              session,
            },
          );
          const stockLeft = product?.stockQuantity || 0;
          if (product && (stockLeft < settings?.vendor?.stockThreshold || 0)) {
            await this.limitedStockModel.create(
              [
                {
                  productId: update.productId,
                  seller: product.seller,
                },
              ],
              { session },
            );
          }
        }
      }

      for (const update of comboProductUpdates) {
        await this.comboProductModel.updateOne(
          { _id: update.comboProductId },
          {
            $inc: {
              stockQuantity: -update.quantity,
              quantitySold: update.quantity,
              totalOrderAmount: update.totalPrice,
            },
          },
          { session },
        );
      }

      if (cart) {
        await this.cartModel.findByIdAndDelete(cart._id, { session });
      }

      await session.commitTransaction();
      session.endSession();

      return apiResponse({
        data: order,
        message: 'Order placed successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async applyCoupon({
    userId,
    total,
    subtotal,
    coupon,
    orderItems,
    isFromOrderNow,
    session,
  }: {
    userId: Types.ObjectId;
    total: number;
    subtotal: number;
    coupon: Coupon;
    orderItems: OrderItem[] | CartItem[];
    isFromOrderNow: boolean;
    session: ClientSession;
  }) {
    const customer = await this.customerModel.findById(userId).session(session);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (
      coupon.customers &&
      coupon.customers.length > 0 &&
      !coupon.customers.some((c) => c.equals(userId))
    ) {
      throw new BadRequestException('Coupon code is not valid');
    }

    if (
      new Date(coupon.startDate) > new Date() ||
      new Date(coupon.endDate) < new Date()
    ) {
      throw new BadRequestException('Coupon is not valid at this time');
    }

    const couponUsages = await this.couponUsageModel
      .find({
        coupon: coupon._id,
        customer: userId,
      })
      .session(session);

    if (couponUsages.length >= coupon.limit) {
      throw new BadRequestException('Coupon limit reached');
    }

    if (customer.totalPoints < coupon.pointsRequired) {
      throw new BadRequestException('Insufficient points');
    }

    const calculateDiscountAmount = (basePrice: number): number => {
      if (coupon.discountType === DISCOUNT_TYPE.PERCENTAGE) {
        return Math.floor((coupon.discountValue / 100) * basePrice);
      }
      return coupon.discountValue;
    };

    const usedOnSellers = orderItems
      .map((item: OrderItem | CartItem) => item.seller)
      .filter((seller) => seller !== undefined);

    await Promise.all(
      usedOnSellers.map(async (sellerId) => {
        const countUsage = await this.couponUsageModel
          .countDocuments({
            coupon: coupon._id,
            sellers: sellerId,
          })
          .session(session);

        if (countUsage >= coupon.sellerThreshold) {
          throw new BadRequestException(
            'Coupon limit reached for some sellers',
          );
        }
      }),
    );

    let couponDiscount = 0;
    let isFreeDelivery = false;

    switch (coupon.type) {
      case CouponType.DISCOUNT_ON_PURCHASE:
        couponDiscount = calculateDiscountAmount(total);

        if (isFromOrderNow) {
          await this.couponUsageModel.create(
            [
              {
                customer: customer._id,
                sellers: usedOnSellers,
                coupon: coupon._id,
              },
            ],
            { session },
          );
        }

        break;

      case CouponType.FIRST_ORDER:
        const orderCount = await this.orderModel
          .countDocuments({
            customer: userId,
          })
          .session(session);

        if (orderCount > 0) {
          throw new BadRequestException('Coupon is only valid for first order');
        }

        couponDiscount = calculateDiscountAmount(total);

        if (isFromOrderNow) {
          await this.couponUsageModel.create(
            [
              {
                customer: customer._id,
                sellers: usedOnSellers,
                coupon: coupon._id,
              },
            ],
            { session },
          );
        }

        break;

      case CouponType.FREE_DELIVERY:
        isFreeDelivery = true;

        if (isFromOrderNow) {
          await this.couponUsageModel.create(
            [
              {
                customer: customer._id,
                sellers: usedOnSellers,
                coupon: coupon._id,
              },
            ],
            { session },
          );
        }

        break;

      case CouponType.PRODUCT_BASED:
        const productIds = coupon.products.map((p) => p.toString());
        const sellersIds = coupon.sellers.map((s) => s.toString());

        let discountedAmount = 0;

        orderItems = orderItems.map((item: OrderItem | CartItem) => {
          if (
            item.product &&
            productIds.includes(item.product.toString()) &&
            (sellersIds.includes(item.seller.toString()) ||
              sellersIds.length === 0)
          ) {
            const newUnitPrice =
              item.unitPrice - calculateDiscountAmount(item.unitPrice);
            const newTotalPrice = newUnitPrice * item.quantity;

            discountedAmount +=
              calculateDiscountAmount(item.unitPrice) * item.quantity;

            return {
              ...item,
              unitPrice: newUnitPrice,
              totalPrice: newTotalPrice,
            };
          } else {
            return item;
          }
        });

        couponDiscount = discountedAmount;
        subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

        if (isFromOrderNow) {
          await this.couponUsageModel.create(
            [
              {
                customer: customer._id,
                sellers: usedOnSellers,
                coupon: coupon._id,
              },
            ],
            { session },
          );
        }

        break;

      default:
        throw new BadRequestException('Invalid coupon type');
    }

    return {
      appliedDiscount: couponDiscount,
      isFreeDelivery,
      updatedItems: orderItems,
      updatedSubtotal: subtotal,
    };
  }

  async getOrderNowItem(dto: OrderNowDto): Promise<OrderItem> {
    const product = dto.isCombo
      ? await this.comboProductModel
          .findById(dto.comboProductId)
          .select(
            'name sku seller sellingPrice hasDiscount discountValue discountPrice discountType variants stockQuantity',
          )
      : await this.productModel
          .findById(dto.productId)
          .select(
            'name sku seller sellingPrice hasDiscount discountValue discountPrice discountType variants stockQuantity',
          );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let unitPrice = product.sellingPrice;
    let availableStock = product.stockQuantity || 0;
    let variantSku = dto.variantSku || undefined;
    let variation = dto.variation || undefined;
    let attributes = dto.attributes || [];

    if (!dto.isCombo && dto.variantSku) {
      const variant = (product as Product).variants?.find(
        (v) => v.sku === dto.variantSku,
      );

      if (!variant) {
        throw new NotFoundException(
          `Variant with SKU ${dto.variantSku} not found`,
        );
      }

      unitPrice = variant.variantPrice || product.sellingPrice;
      availableStock = variant.stock || 0;
      variantSku = variant.sku;
      variation = variant.variation;
      attributes = variant.attributes;

      if (variant.isDamaged && variant.discountPrice) {
        unitPrice = variant.discountPrice;
      }
    } else {
      if (product.hasDiscount && product.discountPrice) {
        unitPrice = product.discountPrice;
      }
    }

    if (availableStock < dto.quantity) {
      throw new BadRequestException(
        `Sorry, we have ran out of stock for this product!`,
      );
    }

    const item = {
      ...(dto.isCombo
        ? { comboProduct: new Types.ObjectId(dto.comboProductId) }
        : { product: new Types.ObjectId(dto.productId) }),
      productName: product.name,
      seller: product.seller,
      sku: product.sku,
      variantSku,
      variation,
      ...(dto.variation ? { variation: dto.variation } : {}),
      quantity: dto.quantity,
      unitPrice,
      totalPrice: unitPrice * dto.quantity,
      isCombo: dto.isCombo,
      attributes: attributes,
      thumbnail: dto.thumbnail ?? product.thumbnail,
    };

    return item as OrderItem;
  }

  async trackOrder(orderId: string, phone: string, user: IActiveUser) {
    const [order] = await this.orderModel.aggregate([
      {
        $match: {
          $or: [{ 'shippingAddress.phone': phone }, { orderId }],
          softDeleted: false,
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
                'store.logoImage': 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'refunds',
          localField: '_id',
          foreignField: 'order',
          as: 'refund',
        },
      },
      {
        $addFields: {
          hasRefunded: {
            $cond: {
              if: { $gt: [{ $size: '$refund' }, 0] },
              then: true,
              else: false,
            },
          },
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
          softDeleted: 0,
          updatedAt: 0,
          _itemSellers: 0,
          assignedTo: 0,
          prevSubTotal: 0,
          customerNote: 0,
          tax: 0,
          refund: 0,
        },
      },
    ]);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // if (order.customer?.toString() !== user.sub) {
    //   throw new ForbiddenException('You are not authorized to view this order');
    // }

    return apiResponse({
      data: order,
      message: 'Order fetched successfully',
    });
  }

  async getOrderByOrderId(orderId: string, user: IActiveUser) {
    const [order] = await this.orderModel.aggregate([
      {
        $match: {
          customer: new Types.ObjectId(user.sub),
          orderId,
          softDeleted: false,
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
                'store.logoImage': 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'refunds',
          localField: '_id',
          foreignField: 'order',
          as: 'refund',
        },
      },
      {
        $addFields: {
          hasRefunded: {
            $cond: {
              if: { $gt: [{ $size: '$refund' }, 0] },
              then: true,
              else: false,
            },
          },
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
          softDeleted: 0,
          updatedAt: 0,
          _itemSellers: 0,
          shippingAddress: 0,
          billingAddress: 0,
          sellers: 0,
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

  async getOrderById(orderId: string, user: IActiveUser) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const [order] = await this.orderModel.aggregate([
      {
        $match: {
          customer: new Types.ObjectId(user.sub),
          _id: new Types.ObjectId(orderId),
          softDeleted: false,
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
                'store.logoImage': 1,
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
          softDeleted: 0,
          updatedAt: 0,
          _itemSellers: 0,
          shippingAddress: 0,
          billingAddress: 0,
          sellers: 0,
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
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');

    const matchFilter: QueryFilter<Order> = {
      customer: new Types.ObjectId(user.sub),
      softDeleted: false,
    };

    if (query.status) {
      matchFilter.status = query.status;
    }

    if (query.search) {
      matchFilter['items.productName'] = {
        $regex: query.search,
        $options: 'i',
      };
    }

    if (query.orderId) {
      matchFilter.orderId = query.orderId;
    }

    const aggregate = this.orderModel.aggregate([
      { $match: matchFilter },
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
                'store.logoImage': 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'refunds',
          localField: '_id',
          foreignField: 'order',
          as: 'refund',
        },
      },
      {
        $addFields: {
          hasRefunded: {
            $cond: {
              if: { $gt: [{ $size: '$refund' }, 0] },
              then: true,
              else: false,
            },
          },
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
          orderId: 1,
          items: 1,
          status: 1,
          createdAt: 1,
          total: 1,
          hasRefunded: 1,
        },
      },
      { $sort: { createdAt: -1 } },
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

  async cancelOrder(orderId: string, dto: CancelOrderDto, user: IActiveUser) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
      softDeleted: false,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customer.toString() !== user.sub) {
      throw new ForbiddenException(
        'You are not authorized to cancel this order',
      );
    }

    const cancellableStatuses = [
      ORDER_STATUS.PENDING,
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PROCESSING,
    ];

    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException(`This order cannot be cancelled.`);
    }

    for (const item of order.items) {
      if (!item.isCombo) {
        if (item.variantSku) {
          await this.productModel.updateOne(
            { _id: item.product, 'variants.sku': item.variantSku },
            {
              $inc: {
                stockQuantity: item.quantity,
                'variants.$.stock': item.quantity,
                quantitySold: -item.quantity,
              },
            },
          );
        } else {
          await this.productModel.updateOne(
            { _id: item.product },
            {
              $inc: {
                stockQuantity: item.quantity,
                quantitySold: -item.quantity,
              },
            },
          );
        }
      } else {
        await this.comboProductModel.updateOne(
          { _id: item.comboProduct },
          {
            $inc: {
              stockQuantity: item.quantity,
              quantitySold: -item.quantity,
            },
          },
        );
      }
    }

    order.status = ORDER_STATUS.CANCELLED;
    order.cancelledAt = new Date();
    order.cancellationReason = dto.cancellationReason;
    order.cancellationNote = dto.cancellationNote;

    await order.save();

    return apiResponse({
      data: order,
      message: 'Order cancelled successfully',
    });
  }

  async requestRefund(orderId: string, dto: RequestRefundDto) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel
      .findOne({
        _id: new Types.ObjectId(orderId),
        softDeleted: false,
      })
      .lean();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      order.status !== ORDER_STATUS.CANCELLED &&
      order.status !== ORDER_STATUS.RETURNED &&
      order.status !== ORDER_STATUS.FAILED
    ) {
      throw new BadRequestException(
        'Order is not cancelled or returned or failed yet',
      );
    }
    // else if (order.payment.status !== PAYMENT_STATUS.PAID) {
    //   throw new BadRequestException('Order is not paid yet');
    // }

    const orderSettings = await this.businessSettingsModel
      .findOne({})
      .select('order')
      .lean();

    if (order.deliveredAt && orderSettings?.order?.maxRefundableDays) {
      const deliveryDate = new Date(order.deliveredAt);
      const daysDifference =
        (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDifference > orderSettings?.order?.maxRefundableDays) {
        throw new BadRequestException(
          `Can not refund after ${orderSettings?.order?.maxRefundableDays} days of delivery`,
        );
      }
    }

    const refundExists = await this.refundModel.findOne({
      order: order._id,
      softDeleted: false,
    });

    if (refundExists) {
      if (refundExists.status === REFUND_STATUS.REFUNDED) {
        throw new BadRequestException(
          'Refund already processed for this order',
        );
      }
      throw new BadRequestException('Refund already requested for this order');
    }

    const validOrderItems = dto.items
      .map((item) =>
        order.items?.find((orderItem) => {
          if (!item.isCombo) {
            if (item.variantSku) {
              if (
                orderItem.product?.toString() === item.productId &&
                orderItem.variantSku === item.variantSku
              ) {
                return true;
              }
            } else if (orderItem.product?.toString() === item.productId) {
              return true;
            }
          } else {
            if (orderItem.comboProduct?.toString() === item.comboProductId) {
              return true;
            }
          }
          return undefined;
        }),
      )
      .filter((item) => item !== undefined);

    if (validOrderItems?.length !== dto.items.length) {
      throw new BadRequestException('Invalid order items');
    }

    const refundItems = validOrderItems?.map((item) => ({
      ...item,
      status: REFUND_ITEM_STATUS.PENDING,
    }));

    const totalAmount = refundItems?.reduce(
      (acc, item) => acc + item.totalPrice,
      0,
    );

    if (dto.totalAmount && dto.totalAmount !== totalAmount) {
      throw new BadRequestException('Invalid amount');
    }

    const refund = new this.refundModel({
      order: order._id,
      customer: order.customer,
      items: refundItems,
      refundReason: dto.reason,
      images: dto.images,
      details: dto.details,
      totalAmount,
    });

    await refund.save();

    return apiResponse({
      message: 'Refund requested successfully',
    });
  }
}
