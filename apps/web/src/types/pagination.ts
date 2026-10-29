export interface Paginated<T> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  data: T[];
}
