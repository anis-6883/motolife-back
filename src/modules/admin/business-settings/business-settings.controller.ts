import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { SettingsSection } from 'src/common/enums/admin.enum';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { BusinessSettingsService } from './business-settings.service';
import { SectionParamDto } from './dto/section-param.dto';
import { UpdateAnalyticsSettingsDto } from './dto/update-analytics-settings.dto';
import { UpdateCustomerSettingsDto } from './dto/update-customer-settings.dto';
import { UpdateGeneralSettingsDto } from './dto/update-general-settings.dto';
import { UpdateOrderSettingsDto } from './dto/update-order-settings.dto';
import { UpdateShippingSettingsDto } from './dto/update-shipping-settings.dto';
import { UpdateVendorSettingsDto } from './dto/update-vendor-settings.dto';
import { UpdateWithdrawMethodsDto } from './dto/update-withdraw-methods.dto';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';

const SECTION_DTO_MAP: Record<SettingsSection, new () => any> = {
  [SettingsSection.GENERAL]: UpdateGeneralSettingsDto,
  [SettingsSection.VENDOR]: UpdateVendorSettingsDto,
  [SettingsSection.CUSTOMER]: UpdateCustomerSettingsDto,
  [SettingsSection.ORDER]: UpdateOrderSettingsDto,
  [SettingsSection.WITHDRAW_METHODS]: UpdateWithdrawMethodsDto,
  [SettingsSection.SHIPPING]: UpdateShippingSettingsDto,
  [SettingsSection.ANALYTICS]: UpdateAnalyticsSettingsDto,
};

@Controller()
@UseGuards(PermissionsGuard)
export class BusinessSettingsController {
  constructor(
    private readonly businessSettingsService: BusinessSettingsService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.BUSINESS_SETTINGS)
  getSettings() {
    return this.businessSettingsService.getSettings();
  }

  @Patch(':section')
  @RequirePermissions(PERMISSIONS.BUSINESS_SETTINGS)
  @HttpCode(HttpStatus.OK)
  async updateSection(@Param() params: SectionParamDto, @Body() body: any) {
    const DtoClass = SECTION_DTO_MAP[params.section];

    const validationPipe = new ValidationPipe({
      whitelist: true,
      transform: true,
      expectedType: DtoClass,
    });

    const validatedBody = await validationPipe.transform(body, {
      type: 'body',
      metatype: DtoClass,
    });

    return this.businessSettingsService.updateSection(
      params.section,
      validatedBody,
    );
  }
}
