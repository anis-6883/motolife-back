import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { LimitedStock } from 'src/common/models/limited-stocks.schema';
import { QueryLimitedStockDto } from './dto/query-limited-stock.dto';
import { IActiveUser } from '../auth/interfaces/active-user.interface';

@Injectable()
export class LimitedStockService {
  constructor(
    @InjectModel(LimitedStock.name)
    private readonly limitedStockModel: mongoose.Model<LimitedStock>,
    @InjectModel(LimitedStock.name)
    private readonly limitedStockPaginateModel: mongoose.PaginateModel<LimitedStock>,
  ) {}

  async getAllLimitedStockNotification(
    user: IActiveUser,
    query: QueryLimitedStockDto,
  ) {
    const filters: Record<string, any> = {};
    const options: Record<string, any> = {};

    options['page'] = parseInt(query.page, 10);
    options['limit'] = parseInt(query.limit, 10);
    options['populate'] = [
      {
        path: 'productId',
      },
    ];

    if (query.isPublished)
      filters['isPublished'] = query.isPublished === 'true';

    filters['seller'] = new mongoose.Types.ObjectId(user.sub);

    return await this.limitedStockPaginateModel.paginate(filters, options);
  }

  async getOneLimitedStockNotification(
    user: IActiveUser,
    notificationId: mongoose.Types.ObjectId,
  ) {
    const limitedStockNotification = await this.limitedStockModel.findOne({
      _id: notificationId,
      seller: new mongoose.Types.ObjectId(user.sub),
    });
    if (!limitedStockNotification) throw new NotFoundException();
    return limitedStockNotification;
  }
}
