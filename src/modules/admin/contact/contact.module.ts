import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleModule } from '../role/role.module';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { Contact, ContactSchema } from 'src/common/models/contact.schema';

@Module({
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
  imports: [
    RoleModule,
    MongooseModule.forFeature([
      {
        name: Contact.name,
        schema: ContactSchema,
      },
    ]),
  ],
})
export class ContactModule {}
