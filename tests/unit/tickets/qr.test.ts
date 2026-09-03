import { describe, expect, it } from "vitest";

import {
  assertTokenHasNoPersonalData,
  buildTicketTokenArtifacts,
  deriveOpaqueTicketToken,
  getQrPayload,
  hashTicketToken,
} from "@/server/tickets/qr";

describe("tickets/qr", () => {
  const secret = "test-secret-hmac-phase5";

  it("dérive un jeton v1 déterministe via HMAC", () => {
    const tokenA = deriveOpaqueTicketToken("ticket-1", 1, secret);
    const tokenB = deriveOpaqueTicketToken("ticket-1", 1, secret);
    const tokenC = deriveOpaqueTicketToken("ticket-1", 2, secret);

    expect(tokenA).toBe(tokenB);
    expect(tokenA).not.toBe(tokenC);
    expect(tokenA.startsWith("v1.")).toBe(true);
  });

  it("produit un hash SHA-256 de 64 caractères", () => {
    const { token, tokenHash } = buildTicketTokenArtifacts("ticket-1", 1, secret);
    expect(tokenHash).toHaveLength(64);
    expect(tokenHash).toBe(hashTicketToken(token));
    expect(tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("n'encode aucune donnée personnelle dans le payload QR", () => {
    const token = deriveOpaqueTicketToken("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", 1, secret);
    const payload = getQrPayload(token);
    expect(payload).toBe(token);
    expect(payload.toLowerCase()).not.toMatch(/dupont|marie|table|single|@/);
    expect(() => assertTokenHasNoPersonalData(payload)).not.toThrow();
  });
});
