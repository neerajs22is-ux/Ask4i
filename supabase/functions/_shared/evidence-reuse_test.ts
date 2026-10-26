// H3C-A evidence-reuse contract tests — pure reconstruction/validation.
//
// Run: deno test supabase/functions/_shared/evidence-reuse_test.ts

import {
  evaluateEvidenceReuse,
  shouldUseReusedEvidence,
  validatePriorSources,
  type ReuseChunkRow,
  type ReuseDocumentRow,
} from "./evidence-reuse.ts";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertEquals<T>(actual: T, expected: T, message: string): void {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${message}: expected ${b}, got ${a}`);
}

const TENANT = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const CONV = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const NOW = "2026-09-19T12:00:00.000Z";

function source(chunkId: string, extra: Record<string, unknown> = {}) {
  return {
    n: 1, chunk_id: chunkId, document_id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    file_name: "lease.pdf", page: 4, fused_rank: 1, fused_score: 0.5, ...extra,
  };
}

function chunk(chunkId: string, documentId: string, extra: Partial<ReuseChunkRow> = {}): ReuseChunkRow {
  return {
    chunk_id: chunkId, document_id: documentId, tenant_id: TENANT,
    file_name: "lease.pdf", page: 4, content: `content of ${chunkId}`, ...extra,
  };
}

function doc(id: string, extra: Partial<ReuseDocumentRow> = {}): ReuseDocumentRow {
  return { id, tenant_id: TENANT, status: "ready", expires_at: null, conversation_id: null, ...extra };
}

function evaluate(overrides: Parameters<typeof evaluateEvidenceReuse>[0] extends infer T
  ? Partial<T>
  : never = {}) {
  const base = {
    tenantId: TENANT,
    sources: [source("c1")],
    chunkRows: [chunk("c1", "dddddddd-dddd-dddd-dddd-dddddddddddd")],
    documentRows: [doc("dddddddd-dddd-dddd-dddd-dddddddddddd")],
    currentConversationId: CONV,
    currentScopeIds: null as string[] | null,
    nowIso: NOW,
  };
  return evaluateEvidenceReuse({ ...base, ...overrides } as Parameters<typeof evaluateEvidenceReuse>[0]);
}

/* ------------------------------------------------------------ validation */

Deno.test("sources: empty or non-array is no-prior-evidence", () => {
  assertEquals(validatePriorSources([]), { ok: false, reason: "no-prior-evidence" }, "empty array");
  assertEquals(validatePriorSources(null), { ok: false, reason: "no-prior-evidence" }, "null");
  assertEquals(validatePriorSources(undefined), { ok: false, reason: "no-prior-evidence" }, "undefined");
});

Deno.test("sources: any malformed entry fails the whole set closed", () => {
  assertEquals(validatePriorSources([{ chunk_id: "c1" }, { n: 2 }]), { ok: false, reason: "malformed-sources" }, "missing id");
  assertEquals(validatePriorSources([{ chunk_id: "" }]), { ok: false, reason: "malformed-sources" }, "empty id");
  assertEquals(validatePriorSources(["c1"]), { ok: false, reason: "malformed-sources" }, "string entry");
  assertEquals(validatePriorSources([null]), { ok: false, reason: "malformed-sources" }, "null entry");
});

Deno.test("sources: duplicates drop keep-first with their position preserved", () => {
  const out = validatePriorSources([
    source("c1", { fused_rank: 7 }), source("c1", { fused_rank: 9 }), source("c2"),
  ]);
  assert(out.ok, "valid");
  if (out.ok) {
    assertEquals(out.duplicates_dropped, 1, "duplicates");
    assertEquals(out.entries.map((e) => e.chunk_id), ["c1", "c2"], "order");
    assertEquals(out.entries[0].fused_rank, 7, "first kept");
  }
});

/* ---------------------------------------------------------- reconstruction */

Deno.test("all chunks present: eligible with metadata and order preserved", () => {
  const result = evaluateEvidenceReuse({
    tenantId: TENANT,
    sources: [
      source("c2", { n: 2, fused_rank: 2, page: 9 }),
      source("c1", { n: 1, fused_rank: 1, page: 4 }),
    ],
    chunkRows: [chunk("c1", "dddddddd-dddd-dddd-dddd-dddddddddddd"), chunk("c2", "dddddddd-dddd-dddd-dddd-dddddddddddd", { page: 9 })],
    documentRows: [doc("dddddddd-dddd-dddd-dddd-dddddddddddd")],
    currentConversationId: CONV,
    currentScopeIds: null,
    nowIso: NOW,
  });
  assert(result.eligible, "eligible");
  if (result.eligible) {
    assertEquals(result.evidence.map((e) => e.chunk_id), ["c2", "c1"], "prior order preserved");
    assertEquals(result.evidence[0].page, 9, "page preserved from chunk row");
    assertEquals(result.evidence[0].fused_rank, 2, "fused rank preserved");
    assertEquals(result.evidence[0].file_name, "lease.pdf", "file name preserved");
    assert(result.evidence[0].content.includes("c2"), "content fetched live");
    assertEquals(result.evidence[0].dense_score, null, "no fabricated dense score");
  }
});

Deno.test("missing chunk: fail closed", () => {
  const result = evaluate({ sources: [source("c1"), source("gone")] });
  assert(!result.eligible && result.reason === "missing-chunk", "missing-chunk");
  assertEquals(result.evidence, [], "no partial evidence");
});

Deno.test("missing document row: fail closed", () => {
  const result = evaluate({ documentRows: [] });
  assert(!result.eligible && result.reason === "missing-document", "missing-document");
});

Deno.test("wrong tenant on chunk or document: fail closed", () => {
  const wrongChunk = evaluate({ chunkRows: [chunk("c1", "dddddddd-dddd-dddd-dddd-dddddddddddd", { tenant_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" })] });
  assert(!wrongChunk.eligible && wrongChunk.reason === "tenant-mismatch", "chunk tenant");
  const wrongDoc = evaluate({ documentRows: [doc("dddddddd-dddd-dddd-dddd-dddddddddddd", { tenant_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" })] });
  assert(!wrongDoc.eligible && wrongDoc.reason === "tenant-mismatch", "document tenant");
});

/* --------------------------------------------------------- temp documents */

Deno.test("expired temporary document: fail closed", () => {
  const result = evaluate({
    documentRows: [doc("dddddddd-dddd-dddd-dddd-dddddddddddd", { expires_at: "2026-09-19T11:59:59.000Z", conversation_id: CONV })],
  });
  assert(!result.eligible && result.reason === "temp-expired", "temp-expired");
});

Deno.test("temporary document of another conversation: fail closed", () => {
  const result = evaluate({
    documentRows: [doc("dddddddd-dddd-dddd-dddd-dddddddddddd", { expires_at: "2026-09-20T12:00:00.000Z", conversation_id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee" })],
  });
  assert(!result.eligible && result.reason === "temp-scope-mismatch", "temp-scope-mismatch");
});

Deno.test("unexpired temp doc of this conversation: eligible", () => {
  const result = evaluate({
    documentRows: [doc("dddddddd-dddd-dddd-dddd-dddddddddddd", { expires_at: "2026-09-20T12:00:00.000Z", conversation_id: CONV })],
  });
  assert(result.eligible, "eligible");
});

Deno.test("temporary document not ready: fail closed", () => {
  const result = evaluate({
    documentRows: [doc("dddddddd-dddd-dddd-dddd-dddddddddddd", { expires_at: "2026-09-20T12:00:00.000Z", conversation_id: CONV, status: "pending" })],
  });
  assert(!result.eligible && result.reason === "document-not-ready", "document-not-ready");
});

/* ---------------------------------------------------------------- scope */

Deno.test("scoped turn: evidence outside the resolved scope fails closed", () => {
  const result = evaluate({ currentScopeIds: ["ffffffff-ffff-ffff-ffff-ffffffffffff"] });
  assert(!result.eligible && result.reason === "scope-mismatch", "scope-mismatch");
});

Deno.test("scoped turn: evidence inside the resolved scope is eligible", () => {
  const result = evaluate({ currentScopeIds: ["dddddddd-dddd-dddd-dddd-dddddddddddd"] });
  assert(result.eligible, "eligible");
});

/* --------------------------------------------------------------- shapes */

Deno.test("page mismatch between persisted source and live chunk: fail closed", () => {
  const result = evaluate({ sources: [source("c1", { page: 99 })] });
  assert(!result.eligible && result.reason === "page-mismatch", "page-mismatch");
});

Deno.test("empty chunk content: fail closed", () => {
  const result = evaluate({ chunkRows: [chunk("c1", "dddddddd-dddd-dddd-dddd-dddddddddddd", { content: "" })] });
  assert(!result.eligible && result.reason === "empty-content", "empty-content");
});

Deno.test("multiple documents: all validated, order preserved", () => {
  const result = evaluateEvidenceReuse({
    tenantId: TENANT,
    sources: [source("c1", { n: 1 }), source("c2", { n: 2, document_id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", page: 2 })],
    chunkRows: [
      chunk("c1", "dddddddd-dddd-dddd-dddd-dddddddddddd"),
      chunk("c2", "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", { page: 2, file_name: "policy.pdf" }),
    ],
    documentRows: [doc("dddddddd-dddd-dddd-dddd-dddddddddddd"), doc("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")],
    currentConversationId: CONV,
    currentScopeIds: ["dddddddd-dddd-dddd-dddd-dddddddddddd", "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"],
    nowIso: NOW,
  });
  assert(result.eligible, "eligible");
  if (result.eligible) {
    assertEquals(result.evidence.length, 2, "count");
    assertEquals(result.evidence.map((e) => e.document_id), [
      "dddddddd-dddd-dddd-dddd-dddddddddddd",
      "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    ], "order across documents");
  }
});

Deno.test("duplicate sources: eligible once, duplicates reported", () => {
  const result = evaluate({ sources: [source("c1"), source("c1", { n: 2 })] });
  assert(result.eligible, "eligible");
  if (result.eligible) {
    assertEquals(result.evidence.length, 1, "deduped");
    assertEquals(result.duplicates_dropped, 1, "duplicates reported");
  }
});

/* -------------------------------------------------- reuse-use decision */

Deno.test("decision: use requires FOLLOW_UP, valid evidence, and a non-insufficient gate", () => {
  assert(
    shouldUseReusedEvidence({ classification: "FOLLOW_UP", evidenceEligible: true, gateVerdict: "SUPPORTED" }),
    "supported follow-up",
  );
  assert(
    shouldUseReusedEvidence({ classification: "FOLLOW_UP", evidenceEligible: true, gateVerdict: "PARTIAL" }),
    "partial is produced by the same downstream path",
  );
  assert(
    shouldUseReusedEvidence({ classification: "FOLLOW_UP", evidenceEligible: true, gateVerdict: "CONFLICTING" }),
    "conflict follows existing production semantics",
  );
});

Deno.test("decision: INSUFFICIENT always falls back to fresh retrieval", () => {
  assert(
    !shouldUseReusedEvidence({ classification: "FOLLOW_UP", evidenceEligible: true, gateVerdict: "INSUFFICIENT" }),
    "insufficient discards reuse",
  );
  assert(
    !shouldUseReusedEvidence({ classification: "FOLLOW_UP", evidenceEligible: true, gateVerdict: null }),
    "no gate verdict means no reuse",
  );
});

Deno.test("decision: never reuse for non-follow-up or invalid evidence", () => {
  for (const classification of ["STANDALONE", "UNKNOWN"] as const) {
    assert(
      !shouldUseReusedEvidence({ classification, evidenceEligible: true, gateVerdict: "SUPPORTED" }),
      `${classification} never uses reuse`,
    );
  }
  assert(
    !shouldUseReusedEvidence({ classification: "FOLLOW_UP", evidenceEligible: false, gateVerdict: "SUPPORTED" }),
    "invalid evidence never reused",
  );
});
