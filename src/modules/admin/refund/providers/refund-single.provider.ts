import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type AggregatePaginateModel } from 'mongoose';
import { Refund } from 'src/common/models/refunds.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { Order, ORDER_STATUS } from 'src/common/models/order.schema';
import { Seller } from 'src/common/models/seller.schema';
import { Customer } from 'src/common/models/customers.schema';
import {
  PAYMENT_STATUS,
  REFUND_ITEM_STATUS,
  REFUND_STATUS,
} from 'src/common/enums/orders.enum';
import { Product } from 'src/common/models/products.schema';
import { ActivityAction, ResourceType } from 'src/common/enums/admin.enum';
import { ComboProduct } from 'src/common/models/combo-products.schema';
import { ActivityService } from '../../activity/activity.service';
import { IActiveUser } from '../../admin-auth/interfaces/active-user.interface';
import { MakeRefundDto } from '../dtos/refund.dto';

@Injectable()
export class RefundSingleProvider {
  constructor(
    @InjectModel(Refund.name)
    private readonly refundModel: AggregatePaginateModel<Refund>,
    @InjectModel(Order.name)
    private readonly orderModel: AggregatePaginateModel<Order>,
    @InjectModel(Seller.name)
    private readonly sellerModel: AggregatePaginateModel<Seller>,
    @InjectModel(Product.name)
    private readonly productModel: AggregatePaginateModel<Product>,
    @InjectModel(ComboProduct.name)
    private readonly comboProductModel: AggregatePaginateModel<ComboProduct>,

    private readonly activityService: ActivityService,
  ) {}

  async refundSingle(refundId: string, dto: MakeRefundDto, user: IActiveUser) {
    const { productId, variantSku, isCombo, comboProductId } = dto;

    const refund = await this.refundModel.findById(refundId);
    if (!refund) {
      throw new NotFoundException('Refund request not found');
    }

    if (refund.status === REFUND_STATUS.REFUNDED) {
      throw new BadRequestException('Refund has already been fully processed');
    }
    if (refund.status === REFUND_STATUS.REJECTED) {
      throw new BadRequestException('Cannot process a rejected refund');
    }

    const refundItemIndex = refund.items.findIndex((item) => {
      if (!item.isCombo) {
        return (
          item.product?.toString() === productId &&
          (variantSku ? item.variantSku === variantSku : true)
        );
      } else {
        return item.comboProduct?.toString() === comboProductId;
      }
    });

    if (refundItemIndex === -1) {
      throw new NotFoundException('Item not found in this refund request');
    }

    const refundItem = refund.items[refundItemIndex];

    if (refundItem.status === REFUND_ITEM_STATUS.REFUNDED) {
      throw new BadRequestException('This item has already been refunded');
    }

    if (refundItem.status === REFUND_ITEM_STATUS.REJECTED) {
      throw new BadRequestException('This item refund was rejected');
    }

    const order = await this.orderModel.findById(refund.order);
    if (!order) {
      throw new NotFoundException('Associated order not found');
    }

    if (order.status === ORDER_STATUS.REFUNDED) {
      throw new BadRequestException('Order is already fully refunded');
    }

    const orderItems = order.toObject().items;

    const orderItemIndex = orderItems.findIndex((item) => {
      if (!item.isCombo) {
        return (
          item.product?.toString() === productId &&
          (variantSku ? item.variantSku === variantSku : true)
        );
      } else {
        return item.comboProduct?.toString() === comboProductId;
      }
    });

    if (orderItemIndex === -1) {
      throw new NotFoundException('Item not found in the order');
    }

    const orderItem = orderItems[orderItemIndex];

    const refundedSellerId = orderItem.seller.toString();
    const refundAmount = refundItem.totalPrice;
    const refundQty = refundItem.quantity;

    const originalSellers = order.sellers.map((seller) => seller.toString());

    if (!isCombo) {
      if (variantSku) {
        await this.productModel.updateOne(
          { _id: productId, 'variants.sku': variantSku },
          {
            $inc: {
              'variants.$.stock': refundQty,
              stockQuantity: refundQty,
              quantitySold: -refundQty,
              totalOrderAmount: -refundAmount,
            },
          },
        );
      } else {
        await this.productModel.updateOne(
          { _id: productId },
          {
            $inc: {
              stockQuantity: refundQty,
              quantitySold: -refundQty,
              totalOrderAmount: -refundAmount,
            },
          },
        );
      }
    } else {
      await this.comboProductModel.updateOne(
        { _id: comboProductId },
        {
          $inc: {
            stockQuantity: refundQty,
            quantitySold: -refundQty,
            totalOrderAmount: -refundAmount,
          },
        },
      );
    }

    const remainingQty = orderItem.quantity - refundQty;

    if (remainingQty <= 0) {
      orderItems.splice(orderItemIndex, 1);
    } else {
      orderItem.quantity = remainingQty;
      orderItem.totalPrice = orderItem.unitPrice * remainingQty;
    }

    order.refundedAmount = (order.refundedAmount || 0) + refundAmount;

    if (orderItems.length === 0) {
      order.status = ORDER_STATUS.REFUNDED;
      order.payment.status = PAYMENT_STATUS.REFUNDED;

      const customerId = order.customer;

      await this.sellerModel.updateOne(
        { _id: new Types.ObjectId(refundedSellerId) },
        {
          $inc: {
            balance: -refundAmount,
          },
        },
      );
    } else {
      order.payment.status = PAYMENT_STATUS.PARTIALLY_REFUNDED;

      const newSellers = [
        ...new Set(orderItems.map((item) => item.seller.toString())),
      ];

      const removedSellers = originalSellers.filter(
        (sellerId) => !newSellers.includes(sellerId),
      );

      const sellerCompletelyRemoved = removedSellers.includes(refundedSellerId);

      if (sellerCompletelyRemoved) {
        await this.sellerModel.updateOne(
          { _id: new Types.ObjectId(refundedSellerId) },
          {
            $inc: {
              balance: -refundAmount,
            },
          },
        );
      } else {
        await this.sellerModel.updateOne(
          { _id: new Types.ObjectId(refundedSellerId) },
          {
            $inc: {
              balance: -refundAmount,
            },
          },
        );
      }
    }

    await order.save();

    refund.items[refundItemIndex].status = REFUND_ITEM_STATUS.REFUNDED;

    refund.totalAmount = refund.items.reduce(
      (sum, item) => sum + item.totalPrice,
      0,
    );

    const allItemsRefunded = refund.items.every(
      (item) => item.status === REFUND_ITEM_STATUS.REFUNDED,
    );

    if (allItemsRefunded) {
      refund.status = REFUND_STATUS.REFUNDED;
    } else {
      refund.status = REFUND_STATUS.PARTIALLY_REFUNDED;
    }

    refund.refundMethod = dto.refundMethod;
    if (dto.note) {
      refund.note = dto.note;
    }

    await refund.save();

    await this.activityService.createActivity({
      title: 'Single Product Refund Processed',
      action: ActivityAction.UPDATE,
      resourceType: ResourceType.REFUND,
      resourceId: refund._id,
      user: new Types.ObjectId(user.sub),
      payload: dto,
    });

    return apiResponse({
      message: `Successfully refunded ${orderItem.productName}`,
    });
  }
}
