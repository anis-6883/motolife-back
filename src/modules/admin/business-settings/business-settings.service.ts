import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BusinessSettings } from '../../../common/models/business-settings.schema';
import { SettingsSection } from 'src/common/enums/admin.enum';
import { apiResponse } from 'src/common/utils/api-response';
import { UpdateWithdrawMethodsDto } from './dto/update-withdraw-methods.dto';

@Injectable()
export class BusinessSettingsService {
  constructor(
    @InjectModel(BusinessSettings.name)
    private readonly businessSettingsModel: Model<BusinessSettings>,
  ) {}

  async getSettings() {
    let settings = await this.businessSettingsModel.findOne();

    if (!settings) {
      settings = await this.businessSettingsModel.create({});
    }

    return apiResponse({
      data: settings,
      message: 'Business settings fetched successfully',
    });
  }

  async updateSection(section: SettingsSection, data: Record<string, any>) {
    let updatePayload: Record<string, any>;

    if (section === SettingsSection.WITHDRAW_METHODS) {
      const withdrawData = data as UpdateWithdrawMethodsDto;
      updatePayload = { [section]: withdrawData.withdrawMethods };
    } else {
      updatePayload = { [section]: data };
    }

    const settings = await this.businessSettingsModel.findOneAndUpdate(
      {},
      { $set: updatePayload },
      { new: true, runValidators: true },
    );

    return apiResponse({
      data: settings,
      message: `${this.formatSectionName(section)} updated successfully`,
    });
  }

  private formatSectionName(section: SettingsSection): string {
    const nameMap: Record<SettingsSection, string> = {
      [SettingsSection.GENERAL]: 'General settings',
      [SettingsSection.VENDOR]: 'Vendor settings',
      [SettingsSection.CUSTOMER]: 'Customer settings',
      [SettingsSection.ORDER]: 'Order settings',
      [SettingsSection.WITHDRAW_METHODS]: 'Withdraw methods',
      [SettingsSection.SHIPPING]: 'Shipping settings',
      [SettingsSection.ANALYTICS]: 'Analytics settings',
    };
    return nameMap[section] || 'Settings';
  }
}
