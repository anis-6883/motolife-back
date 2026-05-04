import { Types } from 'mongoose';
import { AdminType } from 'src/common/enums/admin.enum';

export interface IActiveUser {
  sub: string;
  email: string;
  roleId: Types.ObjectId;
  type: AdminType;
}
