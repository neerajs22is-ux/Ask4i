// evidence-reuse — H3C-A audit helper: deterministic reconstruction and
// validation contract for reusing a previous turn's persisted evidence.
//
// NOT WIRED INTO ANY EDGE FUNCTION. Production follow-ups keep using the H3B
// retrieval path (query-chunks embedding + retrieval + rerank). This module
// exists so the reuse predicate can be reviewed and unit-tested before H3C-B
// decides whether to adopt it.
//
// The contract is deliberately conservative and fail-closed: any missing,
// malformed, out-of-scope, cross-tenant, mismatched, or expired input makes
// reuse ineligible and the caller falls back to fresh retrieval. It never
// invents content: evidence is rebuilt from the live `chunks` rows the
// persisted `chunk_id`s point at, in the previously cited order.

import type { EvidenceItem, Verdict } from "./grounding.ts";
import type { FollowUpClass } from "./follow-up-detector.ts";

/** One entry of `messages.sources` as persisted JSONB (shape-validated here). */
export type PriorSourceEntry = {
  n: number | null;
  chunk_id: string;
  document_id: string | null;
  file_name: string | null;
  page: number | null;
  fused_rank: number | null;
  fused_score: number | null;
};

/** Live chunk row (fetched by chunk_id under the caller's RLS, tenant-filtered). */
export type ReuseChunkRow = {
  chunk_id: string;
  document_id: string;
  tenant_id: string;
  file_name: string | null;
  page: number | null;
  content: string;
};

/** Live document row for the referenced documents (tenant-filtered). */
export type ReuseDocumentRow = {
  id: string;
  tenant_id: string;
  status: string;
  expires_at: string | null;
  conversation_id: string | null;
};

export type EvidenceReuseResult =
  | { eligible: true; reason: "eligible"; evidence: EvidenceItem[]; duplicates_dropped: number }
  | { eligible: false; reason: string; evidence: never[]; duplicates_dropped: number };

export type PriorSourceValidation =
  | { ok: true; entries: PriorSourceEntry[]; duplicates_dropped: number }
  | { ok: false; reason: "no-prior-evidence" | "malformed-sources" };

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

/**
 * Validate the persisted `sources` structure. A single malformed entry fails
 * the whole set closed (a partially trusted provenance list is not a
 * provenance list). Duplicate chunk_ids are legal history and are dropped
 * keep-first; the first position (and its citation number) is preserved.
 */
export function validatePriorSources(sources: unknown): PriorSourceValidation {
  if (!Array.isArray(sources) || sources.length === 0) {
    return { ok: false, reason: "no-prior-evidence" };
  }
  const entries: PriorSourceEntry[] = [];
  const seen = new Set<string>();
  let duplicates = 0;
  for (const raw of sources) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return { ok: false, reason: "malformed-sources" };
    }
    const row = raw as Record<string, unknown>;
    const chunkId = typeof row.chunk_id === "string" ? row.chunk_id.trim() : "";
    if (chunkId === "") return { ok: false, reason: "malformed-sources" };
    if (seen.has(chunkId)) {
      duplicates += 1;
      continue;
    }
    seen.add(chunkId);
    entries.push({
      n: numberOrNull(row.n),
      chunk_id: chunkId,
      document_id: stringOrNull(row.document_id),
      file_name: stringOrNull(row.file_name),
      page: numberOrNull(row.page),
      fused_rank: numberOrNull(row.fused_rank),
      fused_score: numberOrNull(row.fused_score),
    });
  }
  if (entries.length === 0) return { ok: false, reason: "no-prior-evidence" };
  return { ok: true, entries, duplicates_dropped: duplicates };
}

/**
 * Deterministic reuse predicate. The caller supplies rows it already read
 * under the caller JWT for this tenant, the current conversation id, the
 * current server-resolved scope (null = unscoped, the legacy path), and now.
 *
 * Ineligibility reasons (checked in this order, all fail-closed):
 *   no-prior-evidence, malformed-sources,
 *   missing-chunk (deleted chunk / deleted document cascade / cross-tenant),
 *   missing-document, tenant-mismatch,
 *   temp-scope-mismatch, temp-expired, document-not-ready,
 *   scope-mismatch, page-mismatch, empty-content.
 */
export function evaluateEvidenceReuse(input: {
  tenantId: string;
  sources: unknown;
  chunkRows: ReuseChunkRow[];
  documentRows: ReuseDocumentRow[];
  currentConversationId: string;
  /** Server-resolved allowed document ids, or null for the unscoped path. */
  currentScopeIds: string[] | null;
  nowIso: string;
}): EvidenceReuseResult {
  const validation = validatePriorSources(input.sources);
  if (!validation.ok) {
    return { eligible: false, reason: validation.reason, evidence: [], duplicates_dropped: 0 };
  }
  const { entries, duplicates_dropped } = validation;

  const chunksById = new Map(input.chunkRows.map((row) => [row.chunk_id, row]));
  const docsById = new Map(input.documentRows.map((row) => [row.id, row]));
  const scope = input.currentScopeIds === null ? null : new Set(input.currentScopeIds);
  const nowMs = Date.parse(input.nowIso);

  const evidence: EvidenceItem[] = [];
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];
    const chunk = chunksById.get(entry.chunk_id);
    if (!chunk) return { eligible: false, reason: "missing-chunk", evidence: [], duplicates_dropped };
    const doc = docsById.get(chunk.document_id);
    if (!doc) return { eligible: false, reason: "missing-document", evidence: [], duplicates_dropped };
    if (chunk.tenant_id !== input.tenantId || doc.tenant_id !== input.tenantId) {
      return { eligible: false, reason: "tenant-mismatch", evidence: [], duplicates_dropped };
    }
    if (doc.expires_at !== null) {
      // Temporary document: the same boundary retrieval applies (D60).
      if (doc.conversation_id !== input.currentConversationId) {
        return { eligible: false, reason: "temp-scope-mismatch", evidence: [], duplicates_dropped };
      }
      const expiresMs = Date.parse(doc.expires_at);
      if (!Number.isFinite(expiresMs) || expiresMs <= nowMs) {
        return { eligible: false, reason: "temp-expired", evidence: [], duplicates_dropped };
      }
      if (doc.status !== "ready") {
        return { eligible: false, reason: "document-not-ready", evidence: [], duplicates_dropped };
      }
    }
    if (scope !== null && !scope.has(doc.id)) {
      return { eligible: false, reason: "scope-mismatch", evidence: [], duplicates_dropped };
    }
    if (entry.page !== null && chunk.page !== null && entry.page !== chunk.page) {
      return { eligible: false, reason: "page-mismatch", evidence: [], duplicates_dropped };
    }
    if (typeof chunk.content !== "string" || chunk.content === "") {
      return { eligible: false, reason: "empty-content", evidence: [], duplicates_dropped };
    }
    evidence.push({
      chunk_id: chunk.chunk_id,
      document_id: chunk.document_id,
      tenant_id: chunk.tenant_id,
      file_name: entry.file_name ?? chunk.file_name ?? "unknown",
      page: chunk.page,
      content: chunk.content,
      dense_score: null,
      dense_rank: null,
      lex_score: null,
      lex_rank: null,
      fused_rank: entry.fused_rank ?? index + 1,
      fused_score: entry.fused_score ?? null,
    });
  }

  return { eligible: true, reason: "eligible", evidence, duplicates_dropped };
}

/**
 * Reuse-use decision: the ONLY conditions under which reconstructed evidence
 * may replace fresh retrieval for this turn. Requires an explicit FOLLOW_UP
 * classification, structurally valid evidence, and a gate verdict that is
 * anything but INSUFFICIENT. The gate reruns on the reconstructed evidence
 * with the original question — FOLLOW_UP itself is never sufficiency, and a
 * gate refusal always falls back to fresh retrieval with no reuse retry.
 */
export function shouldUseReusedEvidence(input: {
  classification: FollowUpClass;
  evidenceEligible: boolean;
  gateVerdict: Verdict | null;
}): boolean {
  return input.classification === "FOLLOW_UP" &&
    input.evidenceEligible &&
    input.gateVerdict !== null &&
    input.gateVerdict !== "INSUFFICIENT";
}
