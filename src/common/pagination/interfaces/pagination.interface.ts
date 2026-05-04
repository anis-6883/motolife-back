export interface Paginated<T> {
  data: T[];
  meta: {
    totalPages: number;
    itemsPerPage: number;
    currentPage: number;
    totalItems: number;
    nextPage: number;
    prevPage: number;
  };
}
