import { IsEnum } from 'class-validator';
import { SettingsSection } from 'src/common/enums/admin.enum';

export class SectionParamDto {
  @IsEnum(SettingsSection, {
    message: `section must be one of: ${Object.values(SettingsSection).join(', ')}`,
  })
  section: SettingsSection;
}
