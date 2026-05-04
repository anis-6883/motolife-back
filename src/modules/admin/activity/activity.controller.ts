import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ActivityService } from './activity.service';
import { GetActivityQueryDto } from './dto/get-activity-query.dto';
import { CreateActivityDto } from './dto/create-activity.dto';

@Controller()
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  async getActivity(@Query() query: GetActivityQueryDto) {
    return this.activityService.getActivity(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createActivity(@Body() body: CreateActivityDto) {
    return this.activityService.createActivity(body);
  }
}
