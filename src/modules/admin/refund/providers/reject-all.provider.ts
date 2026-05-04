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
import { RejectRefundDto } from '../dtos/refund.dto';
import { IActiveUser } from '../../admin-auth/interfaces/active-user.interface';

@Injectable()
export class RejectAllProvider {
  constructor(
    @InjectModel(Refund.name)
    private readonly refundModel: AggregatePaginateModel<Refund>,

    private readonly activityService: ActivityService,
  ) {}

  async rejectAll(refundId: string, dto: RejectRefundDto, user: IActiveUser) {
    const refund = await this.refundModel.findById(refundId);
    if (!refund) {
      throw new NotFoundException('Refund request not found');
    }

    if (refund.status === REFUND_STATUS.REJECTED) {
      throw new BadRequestException('Refund request is already rejected');
    }

    if (refund.status === REFUND_STATUS.REFUNDED) {
      throw new BadRequestException('Cannot reject a fully refunded request');
    }

    const hasRefundedItems = refund.items.some(
      (item) => item.status === REFUND_ITEM_STATUS.REFUNDED,
    );

    if (hasRefundedItems) {
      throw new BadRequestException(
        'Cannot reject entire refund request. Some items have already been refunded. Please reject individual items instead.',
      );
    }

    refund.items.forEach((item) => {
      if (item.status === REFUND_ITEM_STATUS.PENDING) {
        item.status = REFUND_ITEM_STATUS.REJECTED;
      }
    });

    refund.status = REFUND_STATUS.REJECTED;
    refund.totalAmount = 0;

    if (dto.note) {
      refund.note = dto.note;
    }

    await refund.save();

    await this.activityService.createActivity({
      title: 'Refund Request Rejected',
      action: ActivityAction.UPDATE,
      resourceType: ResourceType.REFUND,
      resourceId: refund._id,
      user: new Types.ObjectId(user.sub),
      payload: {
        reason: dto.note,
      },
    });

    return apiResponse({
      message: 'Refund request rejected successfully',
    });
  }
}
