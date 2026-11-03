export interface AppError {
  status: number;
  error: string;
  message: string;
  path?: string;
  retryAfterSeconds?: number;
  fieldErrors: FieldError[];
  hasValidationErrors?: boolean;
}

export interface FieldError {
  field: string;
  message: string;
}
