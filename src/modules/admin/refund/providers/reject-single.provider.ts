import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type AggregatePaginateModel } from 'mongoose';
import { Refund } from 'src/common/models/refunds.schema';
import { apiResponse } from 'src/common/utils/api-response';
import {
  REFUND_ITEM_STATUS,
  REFUND_STATUS,
} from 'src/common/enums/orders.enum';
import { ActivityAction, ResourceType } from 'src/common/enums/admin.enum';
import { ActivityService } from '../../activity/activity.service';
import { MakeRefundDto } from '../dtos/refund.dto';
import { IActiveUser } from '../../admin-auth/interfaces/active-user.interface';

@Injectable()
export class RejectSingleProvider {
  constructor(
    @InjectModel(Refund.name)
    private readonly refundModel: AggregatePaginateModel<Refund>,

    private readonly activityService: ActivityService,
  ) {}

  async rejectSingle(refundId: string, dto: MakeRefundDto, user: IActiveUser) {
    const { productId, variantSku, isCombo, comboProductId } = dto;

    const refund = await this.refundModel.findById(refundId);
    if (!refund) {
      throw new NotFoundException('Refund request not found');
    }

    if (refund.status === REFUND_STATUS.REFUNDED) {
      throw new BadRequestException('Cannot reject a fully refunded request');
    }

    if (refund.status === REFUND_STATUS.REJECTED) {
      throw new BadRequestException('Refund request is already rejected');
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
      throw new BadRequestException('Cannot reject an already refunded item');
    }

    if (refundItem.status === REFUND_ITEM_STATUS.REJECTED) {
      throw new BadRequestException('This item is already rejected');
    }

    refund.items[refundItemIndex].status = REFUND_ITEM_STATUS.REJECTED;

    const allItemsRejected = refund.items.every(
      (item) => item.status === REFUND_ITEM_STATUS.REJECTED,
    );

    const allItemsProcessed = refund.items.every(
      (item) =>
        item.status === REFUND_ITEM_STATUS.REFUNDED ||
        item.status === REFUND_ITEM_STATUS.REJECTED,
    );

    const someItemsRefunded = refund.items.some(
      (item) => item.status === REFUND_ITEM_STATUS.REFUNDED,
    );

    if (allItemsRejected) {
      refund.status = REFUND_STATUS.REJECTED;
      if (dto.note) {
        refund.note = dto.note;
      }
    } else if (allItemsProcessed && someItemsRefunded) {
      refund.status = REFUND_STATUS.PARTIALLY_REFUNDED;
    }

    refund.totalAmount = refund.items
      .filter((item) => item.status !== REFUND_ITEM_STATUS.REJECTED)
      .reduce((sum, item) => sum + item.totalPrice, 0);

    await refund.save();

    await this.activityService.createActivity({
      title: 'Single Product Refund Rejected',
      action: ActivityAction.UPDATE,
      resourceType: ResourceType.REFUND,
      resourceId: refund._id,
      user: new Types.ObjectId(user.sub),
      payload: dto,
    });

    return apiResponse({
      message: `Successfully rejected refund for ${refundItem.productName}`,
    });
  }
}
