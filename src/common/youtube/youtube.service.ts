import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import youtubeConfig from 'src/config/youtube.config';
import { GetVideoTitleDto } from './dto/video-title.dto';
import { apiResponse } from '../utils/api-response';

@Injectable()
export class YoutubeService {
  constructor(
    @Inject(youtubeConfig.KEY)
    private readonly _youtubeConfig: ConfigType<typeof youtubeConfig>,
  ) {}

  async getTitle(id: string): Promise<ReturnType<typeof apiResponse>> {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${id}&key=${this._youtubeConfig.apiKey}&part=snippet`,
    );

    const data = await res.json();
    const title = data?.items?.[0]?.snippet?.title;

    if (!title) {
      throw new BadRequestException('Video not found');
    }

    return apiResponse({
      data: title,
      status: true,
      message: 'Successfully fetched video title',
    });
  }
}
