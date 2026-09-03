import { createHmac, createHash, randomBytes } from "node:crypto";

import { getQrTokenSecret } from "@/lib/env";

const TOKEN_VERSION_PREFIX = "v1";

/**
 * Jeton opaque déterministe : HMAC-SHA-256(secret, v1:ticketId:version).
 * Permet de régénérer le même QR/PDF sans stocker le jeton brut.
 */
export function deriveOpaqueTicketToken(
  ticketId: string,
  version: number,
  secret: string = getQrTokenSecret(),
): string {
  const digest = createHmac("sha256", secret)
    .update(`${TOKEN_VERSION_PREFIX}:${ticketId}:${version}`)
    .digest("base64url");

  return `${TOKEN_VERSION_PREFIX}.${digest}`;
}

/** Hash SHA-256 hexadécimal (64 caractères) à stocker en base. */
export function hashTicketToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function buildTicketTokenArtifacts(
  ticketId: string,
  version: number,
  secret?: string,
): { token: string; tokenHash: string } {
  const token = deriveOpaqueTicketToken(ticketId, version, secret);
  return {
    token,
    tokenHash: hashTicketToken(token),
  };
}

/** Contenu QR = jeton opaque uniquement (aucune donnée personnelle). */
export function getQrPayload(token: string): string {
  return token;
}

export function assertTokenHasNoPersonalData(token: string): void {
  const lowered = token.toLowerCase();
  const forbidden = ["@", "nom", "prenom", "table", "single", "couple"];
  if (forbidden.some((word) => lowered.includes(word))) {
    throw new Error("Le jeton QR ne doit contenir aucune donnée personnelle.");
  }
  if (!token.startsWith(`${TOKEN_VERSION_PREFIX}.`)) {
    throw new Error("Le jeton QR doit être préfixé v1.");
  }
}

export function generateShortCode(length = 6): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += alphabet[bytes[index]! % alphabet.length];
  }
  return code;
}
