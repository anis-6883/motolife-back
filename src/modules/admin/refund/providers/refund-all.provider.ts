import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  AnyBulkWriteOperation,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
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
export class RefundAllProvider {
  constructor(
    @InjectModel(Refund.name)
    private readonly refundModel: AggregatePaginateModel<Refund>,
    @InjectModel(Order.name)
    private readonly orderModel: AggregatePaginateModel<Order>,
    @InjectModel(Seller.name)
    private readonly sellerModel: AggregatePaginateModel<Seller>,
    @InjectModel(Customer.name)
    private readonly customerModel: AggregatePaginateModel<Customer>,
    @InjectModel(Product.name)
    private readonly productModel: AggregatePaginateModel<Product>,
    @InjectModel(ComboProduct.name)
    private readonly comboProductModel: AggregatePaginateModel<ComboProduct>,

    private readonly activityService: ActivityService,
  ) {}

  async refundAll(
    refundId: string,
    user: IActiveUser,
    dto: Pick<MakeRefundDto, 'refundMethod' | 'note'>,
  ) {
    const session = await this.refundModel.db.startSession();
    session.startTransaction();

    try {
      const refund = await this.refundModel.findById(refundId);
      if (!refund) {
        throw new NotFoundException('Refund not found');
      }

      if (refund.status === REFUND_STATUS.REFUNDED) {
        throw new BadRequestException('Refund has already been processed');
      }

      const order = await this.orderModel
        .findById(refund.order)
        .session(session);

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const orderItems = order.toObject().items;

      const isFullRefund =
        refund.items.every((refundItem) => {
          const orderItem = orderItems.find((oi) => {
            if (!refundItem.isCombo && !oi.isCombo) {
              return (
                refundItem.product?.toString() === oi.product?.toString() &&
                (refundItem.variantSku && oi.variantSku
                  ? refundItem.variantSku === oi.variantSku
                  : true)
              );
            } else if (refundItem.isCombo && oi.isCombo) {
              return (
                refundItem.comboProduct?.toString() ===
                oi.comboProduct?.toString()
              );
            }
            return false;
          });
          return orderItem && refundItem.quantity >= orderItem.quantity;
        }) &&
        orderItems.every((oi) =>
          refund.items.some((ri) => {
            if (!ri.isCombo && !oi.isCombo) {
              return (
                ri.product?.toString() === oi.product?.toString() &&
                (ri.variantSku && oi.variantSku
                  ? ri.variantSku === oi.variantSku
                  : true)
              );
            } else if (ri.isCombo && oi.isCombo) {
              return (
                ri.comboProduct?.toString() === oi.comboProduct?.toString()
              );
            }
            return false;
          }),
        );

      const totalRefundAmount = refund.items.reduce((sum, item) => {
        if (
          item.status !== REFUND_ITEM_STATUS.REFUNDED &&
          item.status !== REFUND_ITEM_STATUS.REJECTED
        ) {
          return sum + item.totalPrice;
        }
        return sum;
      }, 0);

      const sellerRefunds = new Map<string, number>();

      refund.items.forEach((item) => {
        const sellerId = item.seller.toString();
        const currentRefund = sellerRefunds.get(sellerId) || 0;
        sellerRefunds.set(sellerId, currentRefund + item.totalPrice);
      });

      if (isFullRefund) {
        const customerId = order.customer;

        order.status = ORDER_STATUS.REFUNDED;
        order.payment.status = PAYMENT_STATUS.REFUNDED;
        order.refundedAmount = (order.refundedAmount || 0) + totalRefundAmount;

        await order.save({ session });

        for (const [sellerId, refundAmount] of sellerRefunds.entries()) {
          await this.sellerModel.updateOne(
            { _id: new Types.ObjectId(sellerId) },
            {
              $inc: {
                balance: -refundAmount,
              },
            },
            { session },
          );
        }

        await this.refundModel.updateOne(
          { _id: refundId },
          {
            status: REFUND_STATUS.REFUNDED,
            refundMethod: dto.refundMethod,
            note: dto.note,
            $set: { 'items.$[].status': REFUND_ITEM_STATUS.REFUNDED },
          },
          { session },
        );
      } else {
        const originalSellers = order.sellers.map((seller) =>
          seller.toString(),
        );

        for (const refundItem of refund.items) {
          const orderItemIndex = orderItems.findIndex((oi) => {
            if (!refundItem.isCombo && !oi.isCombo) {
              return (
                refundItem.product?.toString() === oi.product?.toString() &&
                (refundItem.variantSku && oi.variantSku
                  ? refundItem.variantSku === oi.variantSku
                  : true)
              );
            } else if (refundItem.isCombo && oi.isCombo) {
              return (
                refundItem.comboProduct?.toString() ===
                oi.comboProduct?.toString()
              );
            }
            return false;
          });

          if (orderItemIndex !== -1) {
            const orderItem = orderItems[orderItemIndex];
            const remainingQty = orderItem.quantity - refundItem.quantity;

            if (remainingQty <= 0) {
              orderItems.splice(orderItemIndex, 1);
            } else {
              orderItem.quantity = remainingQty;
              orderItem.totalPrice = orderItem.unitPrice * remainingQty;
            }
          }
        }

        order.payment.status = PAYMENT_STATUS.PARTIALLY_REFUNDED;
        order.refundedAmount = (order.refundedAmount || 0) + totalRefundAmount;

        const newSellers = [
          ...new Set(orderItems.map((item) => item.seller.toString())),
        ];

        const removedSellers = originalSellers.filter(
          (sellerId) => !newSellers.includes(sellerId),
        );

        if (removedSellers.length > 0) {
          for (const sellerId of removedSellers) {
            const refundAmount = sellerRefunds.get(sellerId) || 0;
            await this.sellerModel.updateOne(
              { _id: new Types.ObjectId(sellerId) },
              {
                $inc: {
                  balance: -refundAmount,
                },
              },
              { session },
            );
          }
        }

        const partiallyRemovedSellers = Array.from(sellerRefunds.keys()).filter(
          (sellerId) => !removedSellers.includes(sellerId),
        );

        for (const sellerId of partiallyRemovedSellers) {
          const refundAmount = sellerRefunds.get(sellerId) || 0;
          await this.sellerModel.updateOne(
            { _id: new Types.ObjectId(sellerId) },
            {
              $inc: {
                balance: -refundAmount,
              },
            },
            { session },
          );
        }

        await order.save({ session });

        await this.refundModel.updateOne(
          { _id: refundId },
          {
            status: REFUND_STATUS.REFUNDED,
            refundMethod: dto.refundMethod,
            note: dto.note,
            $set: { 'items.$[].status': REFUND_ITEM_STATUS.REFUNDED },
          },
          { session },
        );
      }

      const productStockOps: AnyBulkWriteOperation<Product>[] = [];
      const comboProductStockOps: AnyBulkWriteOperation<ComboProduct>[] = [];
      const variantStockOps: AnyBulkWriteOperation<Product>[] = [];

      refund.items.forEach((item) => {
        if (!item.isCombo) {
          if (item.variantSku) {
            variantStockOps.push({
              updateOne: {
                filter: {
                  _id: item.product,
                  'variants.sku': item.variantSku,
                },
                update: {
                  $inc: {
                    'variants.$.stock': item.quantity,
                    stockQuantity: item.quantity,
                    quantitySold: -item.quantity,
                    totalOrderAmount: -item.totalPrice,
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
                    stockQuantity: item.quantity,
                    quantitySold: -item.quantity,
                    totalOrderAmount: -item.totalPrice,
                  },
                },
              },
            });
          }
        } else {
          comboProductStockOps.push({
            updateOne: {
              filter: { _id: item.comboProduct },
              update: {
                $inc: {
                  stockQuantity: item.quantity,
                  quantitySold: -item.quantity,
                  totalOrderAmount: -item.totalPrice,
                },
              },
            },
          });
        }
      });

      if (productStockOps.length > 0) {
        await this.productModel.bulkWrite(productStockOps, { session });
      }

      if (variantStockOps.length > 0) {
        await this.productModel.bulkWrite(variantStockOps, { session });
      }

      if (comboProductStockOps.length > 0) {
        await this.comboProductModel.bulkWrite(comboProductStockOps, {
          session,
        });
      }

      await this.activityService.createActivity(
        {
          title: 'Refund Processed',
          action: ActivityAction.UPDATE,
          resourceType: ResourceType.REFUND,
          resourceId: refund._id,
          user: new Types.ObjectId(user.sub),
          payload: refund,
        },
        session,
      );

      await session.commitTransaction();
      return apiResponse({
        message: isFullRefund
          ? 'Order fully refunded successfully'
          : 'Partial refund processed successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
