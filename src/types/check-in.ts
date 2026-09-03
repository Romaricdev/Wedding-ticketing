import { CheckInResult, TicketStatus, TicketType } from "@prisma/client";

export interface CheckInTicketSummary {
  id: string;
  shortCode: string;
  type: TicketType;
  status: TicketStatus;
  tableLabel: string;
  guests: Array<{ lastName: string; firstNames: string }>;
}

export interface CheckInResponse {
  result: CheckInResult;
  title: string;
  message: string;
  ticket: CheckInTicketSummary | null;
  accepted: boolean;
  isManual: boolean;
}

export interface CheckInAttemptRecord {
  id: string;
  result: CheckInResult;
  isManual: boolean;
  scannedAt: string;
  operatorName: string | null;
  ticket: CheckInTicketSummary | null;
}
