"use client";

import { useEffect } from "react";

/**
 * TalkListingContext — sets window.DASM_TALK so the DASM Talk widget opens
 * the conversation bound to this specific listing instead of the generic
 * support fallback.
 *
 * The widget (talk.dasm.com.sa/widget.js) re-reads window.DASM_TALK on each
 * open and on the `dasm-talk:update` custom event, so SPA navigation between
 * listing pages routes the user to the correct conversation without a full
 * page reload.
 */
export default function TalkListingContext({ listingId }: { listingId: string | number }) {
  useEffect(() => {
    const prev = (window as unknown as { DASM_TALK?: Record<string, unknown> }).DASM_TALK ?? {};
    (window as unknown as { DASM_TALK?: Record<string, unknown> }).DASM_TALK = {
      ...prev,
      entity_type: "listing",
      entity_id: String(listingId),
    };
    window.dispatchEvent(new CustomEvent("dasm-talk:update"));

    return () => {
      // Leaving the listing page — drop the listing-specific keys so the
      // widget falls back to the generic support conversation. We keep
      // unrelated keys (position, user_token) intact.
      const current =
        (window as unknown as { DASM_TALK?: Record<string, unknown> }).DASM_TALK ?? {};
      const { entity_type: _t, entity_id: _i, ...rest } = current as {
        entity_type?: unknown;
        entity_id?: unknown;
      };
      void _t;
      void _i;
      (window as unknown as { DASM_TALK?: Record<string, unknown> }).DASM_TALK = rest;
      window.dispatchEvent(new CustomEvent("dasm-talk:update"));
    };
  }, [listingId]);

  return null;
}
