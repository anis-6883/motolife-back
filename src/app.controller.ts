import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Auth } from './modules/admin/admin-auth/decorators/auth.decorator';
import { AuthType } from './common/enums/auth-type.enum';
import { apiResponse } from './common/utils/api-response';

@Controller()
@Auth(AuthType.None)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test')
  test(): ReturnType<typeof apiResponse> {
    return apiResponse({
      status: true,
      message: `Server is running on port ${process.env.PORT}`,
    });
  }
}
