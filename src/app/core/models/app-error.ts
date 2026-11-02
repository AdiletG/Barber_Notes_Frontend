export interface AppError {
  code: number;
  error: string;
  message: string;
  path?: string;
  fieldErrors: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
}
