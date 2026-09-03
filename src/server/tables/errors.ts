export type TableErrorCode =
  | "NOT_FOUND"
  | "DUPLICATE_LABEL"
  | "INVALID_INPUT"
  | "CAPACITY_TOO_LOW"
  | "TABLE_NOT_EMPTY"
  | "FORBIDDEN";

export class TableError extends Error {
  readonly code: TableErrorCode;
  readonly fieldErrors?: Partial<Record<"label" | "capacity", string>>;

  constructor(
    code: TableErrorCode,
    message: string,
    fieldErrors?: Partial<Record<"label" | "capacity", string>>,
  ) {
    super(message);
    this.name = "TableError";
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}
