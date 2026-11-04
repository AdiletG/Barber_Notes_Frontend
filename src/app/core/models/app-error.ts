export interface AppError {
  status: number;
  error: string;
  message: string;
  path?: string;
  retryAfterSeconds?: number;
  fieldErrors: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
}
