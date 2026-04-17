/**
 * talk-hook — fire-and-forget notifier that opens a DASM Talk conversation
 * for a newly-created listing.
 *
 * DASM Talk expects HMAC-signed webhooks on
 *   POST https://talk.dasm.com.sa/api/hooks/entity-event
 * with `X-DASM-Signature: sha256=<hex>` over the raw JSON body.
 *
 * Keep this completely non-blocking: a failed hook must never leak into the
 * user's listing-creation flow. We log and swallow.
 */
import crypto from "node:crypto";

const TALK_URL = process.env.DASM_TALK_URL ?? "https://talk.dasm.com.sa";
const HOOK_SECRET = process.env.DASM_HOOK_SECRET ?? "";
const ENABLED = process.env.DASM_TALK_WEBHOOKS_ENABLED !== "false";

export interface ListingCreatedPayload {
  listingId: string | number;
  sellerUserId: number;
  title?: string | null;
}

function sign(raw: string): string {
  return crypto.createHmac("sha256", HOOK_SECRET).update(raw).digest("hex");
}

export async function notifyListingCreated(p: ListingCreatedPayload): Promise<void> {
  if (!ENABLED || !HOOK_SECRET) return; // silent no-op when env absent
  const body = {
    event: "entity.created",
    entity_type: "listing",
    entity_id: String(p.listingId),
    title: p.title ?? undefined,
    participants: [{ user_id: p.sellerUserId, role: "owner" as const }],
    metadata: { source: "souq" },
  };
  const raw = JSON.stringify(body);
  try {
    const res = await fetch(`${TALK_URL}/api/hooks/entity-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-DASM-Signature": `sha256=${sign(raw)}`,
      },
      body: raw,
      // Short timeout — we don't want a Talk hiccup to stall the POST response.
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      const snippet = await res.text().catch(() => "");
      console.warn(
        `[talk-hook] listing.created failed status=${res.status} body=${snippet.slice(0, 200)}`,
      );
    }
  } catch (err) {
    console.warn("[talk-hook] listing.created threw:", err);
  }
}
