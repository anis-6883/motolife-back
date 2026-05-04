import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type AggregatePaginateModel } from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { CreateContactDto } from './dto/create-contact.dto';
import { Contact } from 'src/common/models/contact.schema';

@Injectable()
export class ContactService {
  constructor(
    @InjectModel(Contact.name)
    private readonly contactModel: AggregatePaginateModel<Contact>,
  ) {}

  async create(createContactDto: CreateContactDto) {
    const updatedContact = await this.contactModel.create(createContactDto);

    if (!updatedContact) {
      throw new NotFoundException('Contact not found');
    }
    return apiResponse({
      message: 'Mail sent successfully',
    });
  }
}
