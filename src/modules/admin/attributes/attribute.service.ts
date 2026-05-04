import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, type PaginateModel } from 'mongoose';
import { Attribute } from '../../../common/models/attributes.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { GetAttributesQueryDto } from './dto/get-attribute-query.dto';

@Injectable()
export class AttributeService {
  constructor(
    @InjectModel(Attribute.name)
    private readonly attributeModel: PaginateModel<Attribute>,
  ) {}

  async create(createAttributeDto: CreateAttributeDto) {
    const createdAttribute =
      await this.attributeModel.create(createAttributeDto);
    return apiResponse({
      message: 'Attribute created successfully',
    });
  }

  async findAll(query: GetAttributesQueryDto) {
    const { search, page = 1, limit = 10, status, p } = query;

    const filters: QueryFilter<Attribute> = {};

    if (search) {
      filters.name = { $regex: search, $options: 'i' };
    }

    if (status) {
      filters.status = status as boolean;
    }

    if (p === 'false') {
      const attributes = await this.attributeModel
        .find(filters)
        .select('-softDeleted -createdAt');

      return apiResponse({
        data: attributes,
        message: 'Attributes fetched successfully',
      });
    }

    const result = await this.attributeModel.paginate(filters, {
      page,
      limit,
      sort: { createdAt: -1 },
    });

    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Attributes fetched successfully',
    });
  }

  public async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    const attribute = await this.attributeModel.findById(id);
    if (!attribute) {
      throw new NotFoundException('Attribute not found');
    }
    return apiResponse({
      data: attribute,
      message: 'Attribute fetched successfully',
    });
  }

  async update(id: string, updateAttributeDto: UpdateAttributeDto) {
    const updatedAttribute = await this.attributeModel.findByIdAndUpdate(
      id,
      updateAttributeDto,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedAttribute) {
      throw new NotFoundException('Attribute not found');
    }
    return apiResponse({
      data: updatedAttribute,
      message: 'Attribute updated successfully',
    });
  }

  async remove(id: string) {
    const deletedAttribute = await this.attributeModel.findByIdAndDelete(id);
    if (!deletedAttribute) {
      throw new NotFoundException('Attribute not found');
    }
    return apiResponse({
      status: true,
      message: 'Attribute deleted successfully',
    });
  }

  async updateStatus(id: string, status: boolean) {
    const updatedAttribute = await this.attributeModel.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedAttribute) {
      throw new NotFoundException('Attribute not found');
    }
    return apiResponse({
      data: updatedAttribute,
      message: 'Attribute status updated successfully',
    });
  }
}
