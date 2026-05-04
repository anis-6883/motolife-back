import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Seller } from '../models/seller.schema';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  constructor(
    @InjectModel(Seller.name)
    private readonly sellerModel: Model<Seller>,
  ) {}

  onModuleInit() {
    this.logger.log('Scheduler module initialized');
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoExpireVacations(): Promise<void> {
    try {
      const now = new Date();

      const result = await this.sellerModel.updateMany(
        {
          'businessSettings.vacation.isOnVacation': true,
          'businessSettings.vacation.endsAt': { $lte: now },
        },
        {
          $set: {
            'businessSettings.vacation.isOnVacation': false,
            'businessSettings.vacation.durationType': null,
            'businessSettings.vacation.startAt': null,
            'businessSettings.vacation.endsAt': null,
            'businessSettings.vacation.note': '',
          },
        },
      );

      if (result.modifiedCount > 0) {
        this.logger.log(
          ` Auto-expired vacation for ${result.modifiedCount} seller(s)`,
        );
      }
    } catch (error) {
      this.logger.error('❌ Failed to auto-expire vacations', error);
    }
  }
}
