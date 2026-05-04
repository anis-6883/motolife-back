import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PipelineStage,
  QueryFilter,
  type AggregatePaginateModel,
} from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { ReplyDto, UpdateContactDto } from './dto/update-contact.dto';
import { Seller } from 'src/common/models/seller.schema';
import { GetContactQueryDto } from './dto/get-contact-query.dto';
import { Contact } from 'src/common/models/contact.schema';

@Injectable()
export class ContactService {
  constructor(
    @InjectModel(Contact.name)
    private readonly contactModel: AggregatePaginateModel<Contact>,
    @InjectModel(Seller.name)
    private readonly sellerModel: AggregatePaginateModel<Seller>,
  ) {}

  async findAll(query: GetContactQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      hasReplied,
      sortBy = 'createdAt',
      sortOrder,
    } = query;

    const filters: QueryFilter<Contact> = { softDeleted: false };

    if (search) {
      filters.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (hasReplied) {
      filters.hasReplied = hasReplied === 'true';
    }

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
      },
      {
        $project: {
          softDeleted: 0,
          updatedAt: 0,
        },
      },
      {
        $sort: {
          [sortBy]: sortOrder === 'asc' ? 1 : -1,
        },
      },
    ];

    const result = await this.contactModel.aggregatePaginate(pipeline, {
      page,
      limit: limit > 50 ? 50 : limit,
    });

    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Contacts fetched successfully',
    });
  }

  async findById(id: string) {
    const contact = await this.contactModel.findById(id).select('-softDeleted');
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    return apiResponse({
      data: contact,
      message: 'Contact fetched successfully',
    });
  }

  async update(id: string, updateContactDto: UpdateContactDto) {
    const updatedContact = await this.contactModel.findByIdAndUpdate(
      id,
      updateContactDto,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedContact) {
      throw new NotFoundException('Contact not found');
    }
    return apiResponse({
      message: 'Contact updated successfully',
    });
  }

  async addReply(id: string, replyDto: ReplyDto) {
    replyDto.replyBy = 'admin';
    const updatedContact = await this.contactModel.findByIdAndUpdate(
      id,
      {
        hasReplied: true,
        $push: {
          replies: replyDto,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );
    if (!updatedContact) {
      throw new NotFoundException('Contact not found');
    }
    return apiResponse({
      message: 'Reply added successfully',
    });
  }

  async remove(id: string) {
    const deletedContact = await this.contactModel.findByIdAndUpdate(
      id,
      {
        softDeleted: true,
      },
      { new: true },
    );

    if (!deletedContact) {
      throw new NotFoundException('Contact not found');
    }
    return apiResponse({
      status: true,
      message: 'Contact deleted successfully',
    });
  }
}
