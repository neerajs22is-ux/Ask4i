import {
  Cpu,
  Database,
  ExternalLink,
  Network,
  ShieldCheck,
  Zap,
} from "lucide-react";

/**
 * Architecture & Verified Benchmarks Section.
 *
 * Demonstrates the technical depth, systems architecture, and verified
 * empirical results of RAG-4i for technical reviewers, hiring managers,
 * and enterprise evaluators.
 */

const BENCHMARKS = [
  {
    value: "99.0%",
    label: "Checkable Claims Supported",
    detail: "95 / 96 claims verified against gold human truth",
    badge: "Grounding Entailment",
    highlight: true,
  },
  {
    value: "0.000",
    label: "Contradiction Rate",
    detail: "0 / 106 contradictions observed on frozen suites",
    badge: "Zero Hallucination",
    highlight: true,
  },
  {
    value: "100%",
    label: "Honest Refusal Precision",
    detail: "7 / 7 out-of-domain queries refused with 0 invented facts",
    badge: "Fail-Closed Gate",
    highlight: false,
  },
  {
    value: "96.7%",
    label: "Recall@8 on Regulations",
    detail: "RRF-60 hybrid retrieval across 899 statutory chunks",
    badge: "Hybrid Search",
    highlight: false,
  },
  {
    value: "<120 MB",
    label: "Peak Memory Footprint",
    detail: "Deno 2.x V8 isolates; zero OS/Python compilation binaries",
    badge: "Zero-GPU Edge",
    highlight: false,
  },
  {
    value: "9.5 / 10",
    label: "PentAGI Security Rating",
    detail: "Certified production-ready: RLS isolation & prompt defense",
    badge: "Security Audit",
    highlight: true,
  },
];

const PILLARS = [
  {
    num: "01",
    title: "Zero-GPU Serverless Ingestion",
    icon: Cpu,
    tag: "<120MB RAM · $0.00 Idle",
    body: "Runs pure TypeScript unpdf inside Supabase Edge (Deno 2.x). Page-boundary chunking (1,000 chars / 200 overlap) permanently anchors every claim to its statutory legal page provenance without heavy PyMuPDF/Poppler dependencies.",
  },
  {
    num: "02",
    title: "Hybrid Retrieval with RRF-60",
    icon: Network,
    tag: "Dense + Sparse FTS",
    body: "Fuses dense semantic search (Jina v5 embeddings via pgvector HNSW) and sparse lexical search (PostgreSQL FTS GIN) via Reciprocal Rank Fusion (k=60). Repetitive running headers lose weight in BM25 IDF without wasting LLM tokens stripping them.",
  },
  {
    num: "03",
    title: "In-Index Traversal (Iterative Scan)",
    icon: Database,
    tag: "pgvector 0.8.0+",
    body: "Eliminates multi-tenant filter starvation under Row-Level Security (RLS) by configuring hnsw.iterative_scan = relaxed_order, guaranteeing full candidate retrieval even when strict workspace partition boundaries are enforced.",
  },
  {
    num: "04",
    title: "Pre-Inference Gating (verifyEvidence)",
    icon: ShieldCheck,
    tag: "<150ms Fast-Path",
    body: "H1 router bypasses vector search and LLMs on conversational turns. A deterministic evidence gate checks retrieved passage relevance before calling AWS Bedrock, saving ~4,500 tokens and 400ms while guaranteeing fail-closed refusals on information gaps.",
  },
];

export function ArchitectureSection() {
  return (
    <section
      id="benchmarks"
      aria-labelledby="benchmarks-heading"
      className="hairline border-t bg-muted/20"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        {/* Section Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-2xs font-mono font-medium text-primary-strong">
            <Zap className="size-3" />
            SYSTEMS ARCHITECTURE & VERIFIED BENCHMARKS
          </div>
          <h2
            id="benchmarks-heading"
            className="text-[clamp(1.75rem,3vw,2.35rem)] leading-tight font-semibold tracking-[-0.02em] text-balance mt-3"
          >
            Engineered for zero hallucination. Operating at zero GPU overhead.
          </h2>
          <p className="text-muted-foreground mt-4 text-base text-pretty leading-relaxed">
            RAG&#8209;4i is architected in pure TypeScript on Supabase Edge
            Functions (Deno) and PostgreSQL with <code className="font-mono text-foreground font-semibold">pgvector</code>.
            Every metric below was empirically measured against frozen enterprise
            test suites — nothing is estimated.
          </p>
        </div>

        {/* 1. Empirical Benchmark Scorecard */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
              Frozen Test Suite Scorecard (SciFact-30 & Statutory Corpus)
            </span>
            <span className="text-2xs font-mono text-primary-strong">
              Verified Production Suite
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENCHMARKS.map((metric) => (
              <div
                key={metric.label}
                className="bg-card hairline rounded-xl border p-4.5 shadow-xs transition-colors hover:border-border"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-mono text-muted-foreground uppercase tracking-wider">
                    {metric.badge}
                  </span>
                </div>
                <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {metric.value}
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">
                  {metric.label}
                </div>
                <div className="text-muted-foreground mt-1 text-xs text-pretty">
                  {metric.detail}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Four Architectural Pillars */}
        <div className="mt-14">
          <div className="mb-4">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Core Architectural Invariants
            </h3>
            <p className="text-muted-foreground mt-1 text-sm text-pretty">
              Hardened systems engineering decisions designed to scale under
              strict enterprise memory and security constraints.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.num}
                  className="bg-card hairline flex flex-col justify-between rounded-xl border p-5 shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="bg-primary/10 text-primary-strong inline-flex size-8 items-center justify-center rounded-lg font-mono text-xs font-bold">
                          <Icon className="size-4" />
                        </span>
                        <div>
                          <span className="text-2xs font-mono text-muted-foreground">
                            PILLAR {pillar.num}
                          </span>
                          <h4 className="text-base font-semibold text-foreground">
                            {pillar.title}
                          </h4>
                        </div>
                      </div>
                      <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 font-mono text-2xs font-medium">
                        {pillar.tag}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-3 text-sm leading-relaxed text-pretty">
                      {pillar.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Proof Artifacts & Source Code Links */}
        <div className="bg-card hairline mt-12 flex flex-col items-start justify-between gap-4 rounded-xl border p-5 sm:flex-row sm:items-center">
          <div>
            <div className="text-sm font-semibold text-foreground">
              Inspect Source Code & Architectural Decisions
            </div>
            <p className="text-muted-foreground text-xs mt-0.5">
              Review full test suites, decisions record (D1–D83), and grey-box
              penetration reports.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://github.com/neerajs22is-ux/Ask4i"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors"
            >
              GitHub Repository
              <ExternalLink className="size-3" />
            </a>
            <a
              href="https://github.com/neerajs22is-ux/Ask4i/blob/main/ARCHITECTURE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="border-border hover:bg-muted/70 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
            >
              Architecture Guide
              <ExternalLink className="size-3" />
            </a>
            <a
              href="https://github.com/neerajs22is-ux/Ask4i/blob/main/PENTAGI_SECURITY_TEST_RESULTS.md"
              target="_blank"
              rel="noopener noreferrer"
              className="border-border hover:bg-muted/70 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
            >
              PentAGI Audit (9.5/10)
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
