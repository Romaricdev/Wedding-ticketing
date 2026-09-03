export type TicketErrorCode =
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "NO_ACTIVE_TEMPLATE"
  | "GUEST_NOT_ELIGIBLE"
  | "GUEST_ALREADY_HAS_ACTIVE_TICKET"
  | "CAPACITY_EXCEEDED"
  | "TABLE_MISMATCH"
  | "PDF_FAILED"
  | "ALREADY_CANCELLED"
  | "FORBIDDEN";

export class TicketError extends Error {
  readonly code: TicketErrorCode;
  readonly fieldErrors?: Partial<
    Record<"type" | "guestId" | "guestId1" | "guestId2" | "tableId" | "reason", string>
  >;

  constructor(
    code: TicketErrorCode,
    message: string,
    fieldErrors?: TicketError["fieldErrors"],
  ) {
    super(message);
    this.name = "TicketError";
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}
