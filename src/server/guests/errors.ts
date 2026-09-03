export type GuestErrorCode =
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "ALREADY_CANCELLED"
  | "IMPORT_INVALID"
  | "FORBIDDEN";

export class GuestError extends Error {
  readonly code: GuestErrorCode;
  readonly fieldErrors?: Partial<Record<"lastName" | "firstNames" | "notes" | "reason", string>>;

  constructor(
    code: GuestErrorCode,
    message: string,
    fieldErrors?: Partial<Record<"lastName" | "firstNames" | "notes" | "reason", string>>,
  ) {
    super(message);
    this.name = "GuestError";
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}
