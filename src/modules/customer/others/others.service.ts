import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { BusinessSettingsEnum } from 'src/common/enums/customer.enums';
import { ShopType } from 'src/common/enums/seller.enums';
import { BusinessSettings } from 'src/common/models/business-settings.schema';
import { Seller } from 'src/common/models/seller.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { Settings } from 'src/common/models/settings.schema';

@Injectable()
export class OthersService {
  constructor(
    @InjectModel(Settings.name)
    private readonly settingsModel: Model<Settings>,

    @InjectModel(BusinessSettings.name)
    private readonly businessSettingsModel: Model<BusinessSettings>,

    @InjectModel(Seller.name)
    private readonly sellerModel: Model<Seller>,
  ) {}

  async getSettings() {
    let settings = await this.settingsModel
      .findOne()
      .select(
        '-maxOtpHits -maxLoginHits -otpBlockTime -otpResendTime -sellerApprovalRequired -enableSellerOtpLogin -enableSellerPasswordLogin -policies',
      );

    return apiResponse({
      data: settings,
      message: 'Settings fetched successfully',
    });
  }

  async getPolicies() {
    let policies = await this.settingsModel.findOne().select('policies').lean();

    return apiResponse({
      data: policies,
      message: 'Policies fetched successfully',
    });
  }

  async getBusinessSettings(section?: BusinessSettingsEnum) {
    const pipeline: PipelineStage[] = [];

    const selectQuery = section ? { [section]: 1 } : {};

    const settings = await this.businessSettingsModel
      .findOne()
      .select(selectQuery);

    return apiResponse({
      data: settings,
      message: 'Business settings fetched successfully',
    });
  }

  async getContactInformation() {
    const [contact, seller] = await Promise.all([
      this.businessSettingsModel
        .findOne()
        .select('general.support -_id')
        .lean(),
      this.sellerModel
        .findOne({ shopType: ShopType.INHOUSE })
        .select('store.address -_id')
        .lean(),
    ]);

    const support = contact?.general?.support;

    if (!support) {
      throw new NotFoundException('Contact information not found');
    }

    return apiResponse({
      data: {
        ...support,
        address: seller?.store?.address ?? null,
      },
      message: 'Contact information fetched successfully',
    });
  }
}
