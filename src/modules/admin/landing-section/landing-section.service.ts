import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { LandingSection } from 'src/common/models/landing-sections.schema';
import { CreateLandingSectionDto } from './dto/create-landing-section.dto';
import { UpdateLandingSectionDto } from './dto/update-landing-section.dto';

@Injectable()
export class LandingSectionService {
  constructor(
    @InjectModel(LandingSection.name)
    private readonly landingSectionModel: Model<LandingSection>,
  ) {}

  async create(createLandingSectionDto: CreateLandingSectionDto) {
    const exists = await this.landingSectionModel.findOne({
      title: createLandingSectionDto.title,
      softDeleted: false,
    });
    if (exists) {
      throw new BadRequestException('Landing section already exists');
    }
    const landingSection = await this.landingSectionModel.create(
      createLandingSectionDto,
    );

    return apiResponse({
      data: landingSection,
      message: 'Landing section created successfully',
    });
  }

  async findAllLandingSections() {
    const landingSections = await this.landingSectionModel
      .find({ softDeleted: false })
      .sort({ position: 1 })
      .lean();

    return apiResponse({
      data: landingSections,
      message: 'Landing sections fetched successfully',
    });
  }

  async update(id: string, updateLandingSectionDto: UpdateLandingSectionDto) {
    const updatedSection = await this.landingSectionModel.findByIdAndUpdate(
      id,
      updateLandingSectionDto,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedSection) {
      throw new NotFoundException('Landing section not found');
    }

    return apiResponse({
      data: updatedSection,
      message: 'Landing section updated successfully',
    });
  }

  async remove(id: string) {
    const deletedSection = await this.landingSectionModel.findByIdAndUpdate(
      id,
      { softDeleted: true },
      { new: true, runValidators: true },
    );

    if (!deletedSection) {
      throw new NotFoundException('Landing section not found');
    }

    return apiResponse({
      message: 'Landing section deleted successfully',
    });
  }

  async sort(sortedIds: string[]) {
    const bulkOps = sortedIds.map((item, index) => ({
      updateOne: {
        filter: { _id: item },
        update: { position: index + 1 },
      },
    }));

    await this.landingSectionModel.bulkWrite(bulkOps, {
      ordered: false,
    });

    return apiResponse({
      status: true,
      message: 'Landing sections sorted successfully!',
    });
  }
}
