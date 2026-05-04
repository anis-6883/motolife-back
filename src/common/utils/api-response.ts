export const apiResponse = ({
  data = null,
  status = true,
  message = 'Success',
  pagination,
}: {
  data?: unknown;
  status?: boolean;
  message?: string;
  pagination?: {
    totalDocs: number;
    limit: number | undefined;
    page?: number | undefined;
    totalPages: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage?: number | undefined | null;
    nextPage?: number | undefined | null;
  };
}) => {
  return {
    status,
    message: message,
    ...(((data !== null && data !== undefined) ||
      (data && Object.keys(data).length > 0)) && { data }),
    ...(pagination ? { pagination } : {}),
  };
};
