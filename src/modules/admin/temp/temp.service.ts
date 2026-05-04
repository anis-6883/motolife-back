import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type PaginateModel } from 'mongoose';
import { Temp } from '../../../common/models/temp.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { StorageService } from 'src/common/storage/storage.service';
import { GetTempsQueryDto } from './dto/get-temp-query.dto';
import { CreateTempDto } from './dto/create-temp.dto';

@Injectable()
export class TempService {
  constructor(
    @InjectModel(Temp.name)
    private readonly tempModel: PaginateModel<Temp>,

    private readonly storageService: StorageService,
  ) {}

  async create(dto: CreateTempDto) {
    await this.tempModel.create(dto);
    return apiResponse({
      message: 'Temp created successfully',
    });
  }

  async findAll(query: GetTempsQueryDto) {
    const { page = 1, limit = 10 } = query;

    const result = await this.tempModel.paginate(
      {},
      {
        page,
        limit: limit > 50 ? 50 : limit,
      },
    );

    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Temps fetched successfully',
    });
  }

  public async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    const temp = await this.tempModel.findById(id);

    if (!temp) {
      throw new NotFoundException('Temp not found');
    }
    return apiResponse({
      data: temp,
      message: 'Temp fetched successfully',
    });
  }

  async remove(id: string) {
    const tmpExists = await this.tempModel.findById(id);

    if (!tmpExists) {
      throw new NotFoundException('Temp not found');
    }

    if (tmpExists.url) {
      await this.storageService.deleteFileByUrl(tmpExists.url);
    }

    await this.tempModel.findByIdAndDelete(id);

    return apiResponse({
      status: true,
      message: 'Temp deleted successfully',
    });
  }

  async removeAll() {
    const temps = await this.tempModel.find();

    if (!temps) {
      throw new NotFoundException('Temp not found');
    }

    const urls = temps.map((temp) => temp.url);

    await this.storageService.deleteFilesByUrls(urls);

    await this.tempModel.deleteMany({});

    return apiResponse({
      status: true,
      message: 'All temps deleted successfully',
    });
  }
}
