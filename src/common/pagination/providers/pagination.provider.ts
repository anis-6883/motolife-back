import { Injectable } from '@nestjs/common';
import { Query } from 'mongoose';
import { PaginationQueryDto } from '../dtos/pagination-query.dto';
import { Paginated } from '../interfaces/pagination.interface';

@Injectable()
export class PaginationProvider {
  constructor() {}

  public async paginateQuery<T>(
    modelQuery: Query<T[], T>,
    paginationQuery: PaginationQueryDto,
  ): Promise<Paginated<T>> {
    const skip = (paginationQuery.page! - 1) * paginationQuery.limit!;

    const results = await modelQuery
      .skip(skip)
      .limit(paginationQuery.limit!)
      .exec();

    const totalItems = await modelQuery.model.countDocuments(
      modelQuery.getFilter(),
    );

    const totalPages = Math.ceil(totalItems / paginationQuery.limit!);
    const next =
      paginationQuery.page! === totalPages
        ? paginationQuery.page
        : paginationQuery.page! + 1;

    const prev =
      paginationQuery.page === 1
        ? paginationQuery.page
        : paginationQuery.page! - 1;

    const response: Paginated<T> = {
      data: results,
      meta: {
        totalItems,
        totalPages,
        currentPage: paginationQuery.page!,
        itemsPerPage: paginationQuery.limit!,
        nextPage: next,
        prevPage: prev,
      },
    };

    return response;
  }
}
