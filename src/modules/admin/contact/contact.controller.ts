import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ReplyDto, UpdateContactDto } from './dto/update-contact.dto';
import { ContactService } from './contact.service';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { GetContactQueryDto } from './dto/get-contact-query.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.CONTACTS)
  findAll(@Query() query: GetContactQueryDto) {
    return this.contactService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.CONTACTS)
  findById(@Param('id') id: string) {
    return this.contactService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.CONTACTS)
  update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto) {
    return this.contactService.update(id, updateContactDto);
  }

  @Patch(':id/reply')
  @RequirePermissions(PERMISSIONS.CONTACTS)
  addReply(@Param('id') id: string, @Body() replyDto: ReplyDto) {
    return this.contactService.addReply(id, replyDto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.CONTACTS)
  remove(@Param('id') id: string) {
    return this.contactService.remove(id);
  }
}
