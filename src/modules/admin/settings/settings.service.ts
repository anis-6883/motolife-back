import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Settings } from '../../../common/models/settings.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { Policy, UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Settings.name)
    private readonly settingsModel: Model<Settings>,
  ) {}

  async getSettings() {
    let settings = await this.settingsModel.findOne();

    if (!settings) {
      settings = await this.settingsModel.create({});
    }

    return apiResponse({
      data: settings,
      message: 'Settings fetched successfully',
    });
  }

  async updateSection(data: UpdateSettingsDto) {
    const settings = await this.settingsModel.findOneAndUpdate({}, data, {
      new: true,
      runValidators: true,
    });

    return apiResponse({
      data: settings,
      message: `Settings updated successfully`,
    });
  }

  async deletePolicy(id: string) {
    const settings = await this.settingsModel.findOneAndUpdate(
      {},
      { $pull: { policies: { _id: new Types.ObjectId(id) } } },
      {
        new: true,
        runValidators: true,
      },
    );

    return apiResponse({
      data: settings,
      message: `Policy deleted successfully`,
    });
  }

  async addPolicy(data: Policy) {
    const settings = await this.settingsModel.findOneAndUpdate(
      {},
      {
        $push: { policies: data },
      },
      {
        new: true,
        runValidators: true,
        upsert: true,
      },
    );

    return apiResponse({
      data: settings,
      message: `Policy added successfully`,
    });
  }

  async updatePolicy(id: string, data: Policy) {
    const updatePayload = {};
    for (const key in data) {
      updatePayload[`policies.$.${key}`] = data[key];
    }

    const settings = await this.settingsModel.findOneAndUpdate(
      { 'policies._id': id },
      { $set: updatePayload },
      {
        new: true,
        runValidators: true,
      },
    );

    return apiResponse({
      data: settings,
      message: `Policy updated successfully`,
    });
  }
}
