import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {} from '../../../common/models/brand.schema';
import { CommonModule } from 'src/common/common.module';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { Contact, ContactSchema } from 'src/common/models/contact.schema';

@Module({
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Contact.name,
        schema: ContactSchema,
      },
    ]),
  ],
})
export class ContactModule {}
