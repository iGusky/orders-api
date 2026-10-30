export interface Paginated<T> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  data: T[];
}

// Query params de los endpoints paginados. page y perPage son obligatorios en la API.
export interface PaginationParams {
  page: number;
  perPage: number;   // 1..500
  search?: string;
}
