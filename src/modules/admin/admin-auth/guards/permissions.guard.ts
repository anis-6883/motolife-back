import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { REQUEST_KEY } from '../../../../common/constants/auth.constants';
import { RoleService } from '../../role/role.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PERMISSIONS } from '../../role/constants/permissions.constants';
import { Role } from '../../../../common/models/role.schema';
import { InjectModel } from '@nestjs/mongoose';
import { AdminUser } from 'src/common/models/admin-users.schema';
import { Model, Types } from 'mongoose';
import { AdminType } from 'src/common/enums/admin.enum';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

const PARENT_PERMISSION_MAP: Partial<Record<PERMISSIONS, PERMISSIONS[]>> = {
  [PERMISSIONS.PRODUCT_MANAGEMENT]: [
    PERMISSIONS.PRODUCT_CATEGORIES,
    PERMISSIONS.PRODUCT_BRAND,
    PERMISSIONS.PRODUCT_ATTRIBUTES,
    PERMISSIONS.PRODUCT_BENEFIT_SETUP,
    PERMISSIONS.INHOUSE_PRODUCTS,
    PERMISSIONS.VENDOR_PRODUCTS,
    PERMISSIONS.COMBO_OFFER,
    PERMISSIONS.REQUEST_RESTOCK,
    PERMISSIONS.PRODUCT_UPDATE_REQUEST,
  ],
  [PERMISSIONS.USER_MANAGEMENT]: [
    PERMISSIONS.USER_VENDOR,
    PERMISSIONS.USER_CUSTOMER,
    PERMISSIONS.USER_MANAGER,
  ],
  [PERMISSIONS.ORDER_MANAGEMENT]: [
    PERMISSIONS.ORDER,
    PERMISSIONS.REFUND_REQUEST,
  ],
};

const CHILD_TO_PARENT_MAP: Partial<Record<PERMISSIONS, PERMISSIONS>> = {};

for (const [parent, children] of Object.entries(PARENT_PERMISSION_MAP)) {
  children.forEach((child) => {
    CHILD_TO_PARENT_MAP[child as PERMISSIONS] = parent as PERMISSIONS;
  });
}

function resolvePermissions(userPermissions: string[]): string[] {
  const resolved = new Set<string>(userPermissions);

  for (const perm of userPermissions) {
    const children = PARENT_PERMISSION_MAP[perm as PERMISSIONS];
    if (children) {
      children.forEach((child) => resolved.add(child));
    }

    const parent = CHILD_TO_PARENT_MAP[perm as PERMISSIONS];
    if (parent) {
      resolved.add(parent);
    }
  }

  return [...resolved];
}

const USER_CACHE_TTL_MS = 20 * 60 * 1000;
const cacheKey = (userId: string) => `user:${userId}`;

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly roleService: RoleService,
    private readonly reflector: Reflector,
    @InjectModel(AdminUser.name)
    private readonly adminUserModel: Model<AdminUser>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<PERMISSIONS[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request: Request = context.switchToHttp().getRequest();
    const userId = request[REQUEST_KEY]?.sub;
    let user: AdminUser | null = null;

    const cached = await this.cacheManager.get<AdminUser>(cacheKey(userId));

    if (cached) {
      user = cached;
    } else {
      user = await this.adminUserModel
        .findById(userId)
        .select('role type')
        .lean();

      if (!user) {
        throw new UnauthorizedException('User not authorized to access');
      }

      await this.cacheManager.set(cacheKey(userId), user, USER_CACHE_TTL_MS);
    }

    request[REQUEST_KEY].type = user.type;

    if (user.type === AdminType.ADMIN) {
      return true;
    }

    const res = await this.roleService.findById(user.role);
    const existingRole = res.data as Role;

    if (!existingRole) {
      throw new UnauthorizedException('User role invalid');
    }

    const effectivePermissions = resolvePermissions(existingRole.permissions);

    const hasPermission = requiredPermissions.some((required) =>
      effectivePermissions.includes(required),
    );
    if (!hasPermission) {
      throw new UnauthorizedException(
        "You don't have permission to access this resource",
      );
    }

    return true;
  }
}
