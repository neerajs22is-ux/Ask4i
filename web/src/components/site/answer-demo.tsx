"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  FileText,
  SearchX,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { EvidenceStatusBadge } from "@/components/foundation/evidence-status";
import { cn } from "cn";

/**
 * Interactive Answer Demo & Grounding Inspector.
 *
 * Demonstrates RAG-4i's core capability:
 * 1. Switch between query presets (Statutory policy, fail-closed refusal, tax code).
 * 2. Click citation markers [1], [2] to inspect verbatim source passages.
 * 3. Shows zero-hallucination honest refusal behavior when documents lack evidence.
 */

type QueryPreset = {
  id: string;
  tabLabel: string;
  badgeLabel: string;
  question: string;
  state: "supported" | "insufficient";
  retrievedCount: number;
  citedCount: number;
  corpusNote: string;
  answerParagraphs: {
    text: string;
    citations?: number[];
  }[];
  sources: {
    n: number;
    file: string;
    page: number;
    excerpt: string;
    highlight: string;
  }[];
  refusalNote?: string;
};

const PRESETS: QueryPreset[] = [
  {
    id: "depreciation",
    tabLabel: "Policy & Audit",
    badgeLabel: "Standard Query",
    question:
      "What should we confirm before finalising a client's depreciation schedule?",
    state: "supported",
    retrievedCount: 8,
    citedCount: 2,
    corpusNote: "Accounting & Audit Workspace",
    answerParagraphs: [
      {
        text: "Confirm the asset register reconciles with the fixed-asset ledger line by line before the schedule is finalised.",
        citations: [1],
      },
      {
        text: "For assets acquired during the year, depreciation runs from the date the asset was first put to use, not the invoice date.",
        citations: [2],
      },
    ],
    sources: [
      {
        n: 1,
        file: "Year-End Procedures.pdf",
        page: 22,
        excerpt:
          "Do not finalise a depreciation schedule until the asset register and the fixed-asset ledger reconcile, line by line, for every class of asset.",
        highlight: "reconcile, line by line, for every class of asset",
      },
      {
        n: 2,
        file: "Fixed Assets Advisory Note.pdf",
        page: 9,
        excerpt:
          "For additions during the year, compute depreciation from the date the asset was first put to use; the invoice date is not the acquisition date for this purpose.",
        highlight: "from the date the asset was first put to use",
      },
    ],
  },
  {
    id: "refusal",
    tabLabel: "Honest Refusal (Zero Hallucination)",
    badgeLabel: "Fail-Closed Gate",
    question: "What was the firm's advisory revenue in Germany for Q3?",
    state: "insufficient",
    retrievedCount: 7,
    citedCount: 0,
    corpusNote: "Out-of-Domain Gap Test",
    answerParagraphs: [
      {
        text: "I could not find enough relevant information in the documents to answer that.",
      },
      {
        text: "The indexed workspace documents contain no records or statements regarding German advisory revenue for Q3. RAG-4i has refused unbacked claim generation to eliminate hallucination.",
      },
    ],
    sources: [],
    refusalNote:
      "Deterministic verifyEvidence gate triggered: All 7 retrieved chunks scored below cosine and BM25 threshold. LLM generation bypassed in <150ms with 0 hallucinated facts.",
  },
  {
    id: "taxcode",
    tabLabel: "Statutory Tax Code (§92CB)",
    badgeLabel: "Indian Income Tax Act",
    question: "What are the safe harbour rules under Section 92CB?",
    state: "supported",
    retrievedCount: 12,
    citedCount: 2,
    corpusNote: "78-Page Statutory Extract (899 Chunks)",
    answerParagraphs: [
      {
        text: "Under Section 92CB, determination of an arm's length price by the taxpayer is accepted by the tax authorities where the transfer price margins satisfy prescribed thresholds.",
        citations: [1],
      },
      {
        text: "Safe harbour provisions apply strictly to eligible international transactions, including software development services and information technology enabled services.",
        citations: [2],
      },
    ],
    sources: [
      {
        n: 1,
        file: "Indian Income Tax Act 1961.pdf",
        page: 41,
        excerpt:
          "Section 92CB (1): The determination of arm's length price under section 92C or section 92CA shall be subject to safe harbour rules.",
        highlight: "subject to safe harbour rules",
      },
      {
        n: 2,
        file: "Safe Harbour Rules — Advisory 10TD.pdf",
        page: 43,
        excerpt:
          "Eligible international transaction means an international transaction between associated enterprises in software development services with operating margins >= 17%.",
        highlight: "operating margins >= 17%",
      },
    ],
  },
];

export function InteractiveAnswerDemo() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("depreciation");
  const [activeCitation, setActiveCitation] = useState<number | null>(1);
  const [evidenceOpen, setEvidenceOpen] = useState<boolean>(true);

  const activePreset =
    PRESETS.find((p) => p.id === selectedPresetId) ?? PRESETS[0];

  const handleSelectPreset = (id: string) => {
    setSelectedPresetId(id);
    const preset = PRESETS.find((p) => p.id === id);
    if (preset && preset.sources.length > 0) {
      setActiveCitation(1);
    } else {
      setActiveCitation(null);
    }
  };

  const handleCitationClick = (n: number) => {
    setActiveCitation((prev) => (prev === n ? null : n));
    setEvidenceOpen(true);
  };

  return (
    <div className="bg-background hairline site-reveal rounded-2xl border p-3.5 shadow-lg sm:p-5">
      {/* 1. Query Preset Selector Tabs */}
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex flex-wrap items-center gap-1">
          {PRESETS.map((preset) => {
            const isSelected = preset.id === selectedPresetId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-2xs font-medium transition-colors duration-[var(--duration-fast)]",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                {preset.tabLabel}
              </button>
            );
          })}
        </div>
        <span className="text-muted-foreground hidden font-mono text-2xs sm:inline-block">
          {activePreset.corpusNote}
        </span>
      </div>

      {/* 2. Question Surface */}
      <div className="bg-secondary/70 hairline rounded-xl border px-3.5 py-2.5">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-muted-foreground font-mono text-2xs uppercase tracking-wider">
            User Query
          </span>
          <span className="bg-background/80 text-foreground rounded px-1.5 py-0.5 font-mono text-2xs">
            {activePreset.badgeLabel}
          </span>
        </div>
        <p className="text-sm font-medium leading-relaxed break-words sm:text-base">
          {activePreset.question}
        </p>
      </div>

      {/* 3. Answer Surface */}
      <article className="mt-3" aria-label="Example answer">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <EvidenceStatusBadge state={activePreset.state} />
            <span className="text-muted-foreground font-mono text-2xs">
              {activePreset.retrievedCount} retrieved · {activePreset.citedCount}{" "}
              cited
            </span>
          </div>
          {activePreset.state === "supported" && (
            <span className="text-success inline-flex items-center gap-1 font-mono text-2xs">
              <ShieldCheck className="size-3" />
              99.0% Grounded
            </span>
          )}
        </div>

        <div className="bg-card hairline mt-2.5 rounded-xl border px-4 py-3 text-sm leading-relaxed shadow-xs sm:text-base">
          {activePreset.answerParagraphs.map((para, i) => (
            <p
              key={i}
              className="my-2.5 leading-relaxed text-pretty first:mt-1 last:mb-1"
            >
              {para.text}
              {para.citations?.map((c) => {
                const isActive = activeCitation === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleCitationClick(c)}
                    className={cn(
                      "ml-1 inline-flex cursor-pointer items-center rounded-md border px-1.5 py-0.2 font-mono text-2xs font-semibold align-super transition-all duration-[var(--duration-fast)]",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary scale-105 shadow-xs"
                        : "bg-muted text-foreground border-border hover:border-foreground/40",
                    )}
                    title={`Click to inspect verbatim source passage [${c}]`}
                    aria-label={`Citation [${c}]`}
                  >
                    [{c}]
                  </button>
                );
              })}
            </p>
          ))}

          {activePreset.refusalNote && (
            <div className="bg-neutral-state-muted/80 hairline mt-3 rounded-lg border border-border/80 p-3 text-xs">
              <div className="text-foreground flex items-center gap-1.5 font-semibold">
                <SearchX className="size-3.5 text-muted-foreground" />
                Evidence Gate Verdict: Fail-Closed
              </div>
              <p className="text-muted-foreground mt-1 leading-relaxed">
                {activePreset.refusalNote}
              </p>
            </div>
          )}
        </div>
      </article>

      {/* 4. Supporting Evidence Inspector */}
      {activePreset.sources.length > 0 && (
        <div className="mt-3" aria-label="Supporting evidence inspector">
          <button
            type="button"
            onClick={() => setEvidenceOpen(!evidenceOpen)}
            className="border-border/60 flex w-full cursor-pointer items-center gap-2 border-t pt-2 text-left"
          >
            <span className="text-foreground text-2xs font-medium tracking-wide uppercase">
              Supporting Evidence
            </span>
            <span className="text-muted-foreground text-2xs">
              {activePreset.sources.length} sources · Click citation to inspect
            </span>
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "text-muted-foreground ml-auto size-3.5 shrink-0 transition-transform duration-[var(--duration-normal)]",
                evidenceOpen && "rotate-180",
              )}
            />
          </button>

          {evidenceOpen && (
            <ol className="divide-border/70 mt-1 divide-y">
              {activePreset.sources.map((source) => {
                const isHighlighted = activeCitation === source.n;
                return (
                  <li
                    key={source.n}
                    onClick={() => handleCitationClick(source.n)}
                    className={cn(
                      "flex cursor-pointer items-start gap-2.5 rounded-lg p-2 transition-all duration-[var(--duration-fast)]",
                      isHighlighted
                        ? "bg-accent/40 hairline border-primary/40 ring-1 ring-primary/30"
                        : "hover:bg-muted/40",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex size-5 shrink-0 items-center justify-center rounded font-mono text-2xs font-semibold transition-colors",
                        isHighlighted
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground border border-border",
                      )}
                      title={`Citation ${source.n}`}
                    >
                      {source.n}
                    </span>
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="flex min-w-0 items-center justify-between gap-1 text-xs">
                        <span
                          className="text-foreground flex items-center gap-1 truncate font-medium"
                          title={source.file}
                        >
                          <FileText className="text-muted-foreground size-3" />
                          {source.file}
                        </span>
                        <span className="text-muted-foreground shrink-0 font-mono text-2xs">
                          p. {source.page}
                        </span>
                      </div>
                      <blockquote className="border-border/80 text-foreground/90 mt-1.5 border-l-2 pl-2 text-xs leading-relaxed break-words">
                        {source.excerpt}
                      </blockquote>
                      {isHighlighted && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-2xs font-medium text-primary-strong">
                          <Check className="size-3" />
                          <span>Entailment Grounding: Verified Entailed (1.000)</span>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}

      {/* 5. Interactive Instruction Hint */}
      <div className="bg-muted/50 mt-3 flex items-center justify-between rounded-lg px-2.5 py-1.5 text-2xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Sparkles className="size-3 text-primary-strong" />
          Interactive Demo: Click citations [1] or switch query tabs above
        </span>
        <span className="font-mono text-muted-foreground/75 hidden sm:inline">
          Zero-GPU Engine
        </span>
      </div>
    </div>
  );
}

/** Legacy exports for backwards compatibility */
export function DemoQuestion() {
  return null;
}
export function DemoAnswer() {
  return null;
}
export function DemoEvidence() {
  return null;
}
