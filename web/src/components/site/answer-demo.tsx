"use client";

import { useState } from "react";
import {
  FileText,
  SearchX,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import { EvidenceStatusBadge } from "@/components/foundation/evidence-status";
import { cn } from "cn";

/**
 * Interactive Answer Demo & Grounding Inspector.
 *
 * Designed for immediate, tactile interactivity:
 * 1. Prominent segmented tab switcher for 3 query types.
 * 2. Instant inline citation inspector popover when clicking [1] or [2].
 * 3. Quick question prompt pills for 1-click test queries.
 * 4. Demonstrates live claim verification and fail-closed refusal.
 */

type QueryPreset = {
  id: string;
  tabLabel: string;
  shortLabel: string;
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
    score: string;
  }[];
  refusalNote?: string;
};

const PRESETS: QueryPreset[] = [
  {
    id: "depreciation",
    tabLabel: "Policy & Audit",
    shortLabel: "Depreciation Audit",
    badgeLabel: "Accounting Matter",
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
        score: "99.0% Grounded",
      },
      {
        n: 2,
        file: "Fixed Assets Advisory Note.pdf",
        page: 9,
        excerpt:
          "For additions during the year, compute depreciation from the date the asset was first put to use; the invoice date is not the acquisition date for this purpose.",
        highlight: "from the date the asset was first put to use",
        score: "98.5% Grounded",
      },
    ],
  },
  {
    id: "refusal",
    tabLabel: "Honest Refusal (Zero Hallucination)",
    shortLabel: "Gap Refusal",
    badgeLabel: "verifyEvidence Gate",
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
    shortLabel: "Tax Act §92CB",
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
        score: "99.4% Statutory Anchor",
      },
      {
        n: 2,
        file: "Safe Harbour Rules — Advisory 10TD.pdf",
        page: 43,
        excerpt:
          "Eligible international transaction means an international transaction between associated enterprises in software development services with operating margins >= 17%.",
        highlight: "operating margins >= 17%",
        score: "98.8% Statutory Anchor",
      },
    ],
  },
];

export function InteractiveAnswerDemo() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("depreciation");
  const [activeCitation, setActiveCitation] = useState<number | null>(1);
  const [showCitationDrawer, setShowCitationDrawer] = useState<boolean>(true);

  const activePreset =
    PRESETS.find((p) => p.id === selectedPresetId) ?? PRESETS[0];

  const handleSelectPreset = (id: string) => {
    setSelectedPresetId(id);
    const preset = PRESETS.find((p) => p.id === id);
    if (preset && preset.sources.length > 0) {
      setActiveCitation(1);
      setShowCitationDrawer(true);
    } else {
      setActiveCitation(null);
      setShowCitationDrawer(false);
    }
  };

  const handleCitationClick = (n: number) => {
    if (activeCitation === n && showCitationDrawer) {
      setShowCitationDrawer(false);
    } else {
      setActiveCitation(n);
      setShowCitationDrawer(true);
    }
  };

  const activeSource = activePreset.sources.find((s) => s.n === activeCitation);

  return (
    <div className="bg-background hairline site-reveal rounded-2xl border p-4 shadow-xl sm:p-5.5">
      {/* 1. Header with Clear Instruction */}
      <div className="mb-3 flex items-center justify-between border-b border-border/70 pb-2.5">
        <span className="text-2xs font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
          Interactive Engine Sandbox
        </span>
        <span className="text-2xs font-mono text-muted-foreground">
          {activePreset.corpusNote}
        </span>
      </div>

      {/* 2. Prominent Preset Query Buttons */}
      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => {
          const isSelected = preset.id === selectedPresetId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset.id)}
              className={cn(
                "cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-[var(--duration-fast)] flex items-center gap-1.5",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30"
                  : "bg-muted/80 text-foreground hover:bg-muted border border-border/60 hover:border-foreground/30",
              )}
            >
              <span>{preset.tabLabel}</span>
            </button>
          );
        })}
      </div>

      {/* 3. User Question */}
      <div className="bg-secondary/70 hairline rounded-xl border px-4 py-3">
        <div className="mb-1 flex items-center justify-between text-2xs font-mono text-muted-foreground">
          <span className="uppercase tracking-wider">Simulated Query</span>
          <span className="bg-background/80 text-foreground rounded px-1.5 py-0.5">
            {activePreset.badgeLabel}
          </span>
        </div>
        <p className="text-sm font-medium leading-relaxed sm:text-base text-foreground">
          {activePreset.question}
        </p>
      </div>

      {/* 4. Generated Answer Box */}
      <article className="mt-3.5" aria-label="Example answer">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <EvidenceStatusBadge state={activePreset.state} />
            <span className="text-muted-foreground font-mono text-2xs">
              {activePreset.retrievedCount} retrieved · {activePreset.citedCount} cited
            </span>
          </div>
          {activePreset.state === "supported" && (
            <span className="text-success inline-flex items-center gap-1 font-mono text-2xs font-medium">
              <ShieldCheck className="size-3.5" />
              99.0% Grounding Entailment
            </span>
          )}
        </div>

        <div className="bg-card hairline mt-2.5 rounded-xl border p-4 text-sm leading-relaxed shadow-xs sm:text-base">
          {activePreset.answerParagraphs.map((para, i) => (
            <p
              key={i}
              className="my-2 leading-relaxed text-pretty text-foreground first:mt-0 last:mb-0"
            >
              {para.text}
              {para.citations?.map((c) => {
                const isSelected = activeCitation === c && showCitationDrawer;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleCitationClick(c)}
                    className={cn(
                      "ml-1.5 inline-flex cursor-pointer items-center gap-0.5 rounded-md px-2 py-0.5 font-mono text-xs font-bold align-super transition-all duration-[var(--duration-fast)]",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-md scale-110 ring-2 ring-primary/40"
                        : "bg-primary/15 text-primary-strong border border-primary/30 hover:bg-primary/25 hover:scale-105",
                    )}
                    title={`Click to inspect verbatim source passage for citation [${c}]`}
                    aria-label={`Citation [${c}]`}
                  >
                    <span>[{c}]</span>
                  </button>
                );
              })}
            </p>
          ))}

          {/* Refusal Explainer */}
          {activePreset.refusalNote && (
            <div className="bg-neutral-state-muted/80 hairline mt-3 rounded-lg border border-border/80 p-3.5 text-xs">
              <div className="text-foreground flex items-center gap-1.5 font-semibold">
                <SearchX className="size-4 text-warning" />
                Evidence Gate Invariant: Deterministic Refusal
              </div>
              <p className="text-muted-foreground mt-1.5 leading-relaxed text-pretty">
                {activePreset.refusalNote}
              </p>
            </div>
          )}
        </div>
      </article>

      {/* 5. Prominent Citation Inspector Drawer (Direct Visual Feedback) */}
      {showCitationDrawer && activeSource && (
        <div className="mt-3.5 rounded-xl border border-primary/40 bg-primary/5 p-3.5 shadow-sm transition-all duration-[var(--duration-fast)]">
          <div className="flex items-center justify-between border-b border-primary/20 pb-2">
            <div className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground inline-flex size-5 items-center justify-center rounded font-mono text-2xs font-bold">
                {activeSource.n}
              </span>
              <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                <FileText className="size-3.5 text-primary-strong" />
                {activeSource.file}
              </span>
              <span className="text-muted-foreground font-mono text-2xs">
                · Page {activeSource.page}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-success-muted text-success border border-success/30 rounded-full px-2 py-0.5 font-mono text-2xs font-medium">
                {activeSource.score}
              </span>
              <button
                type="button"
                onClick={() => setShowCitationDrawer(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                title="Close citation inspector"
                aria-label="Close citation inspector"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-2.5">
            <div className="text-2xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
              Verbatim passage in verified source PDF:
            </div>
            <blockquote className="border-l-2 border-primary pl-2.5 text-xs sm:text-sm text-foreground/90 font-sans leading-relaxed">
              &ldquo;{activeSource.excerpt}&rdquo;
            </blockquote>
          </div>
        </div>
      )}

      {/* 6. Quick Prompt Tester Pills */}
      <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-border/70 pt-2.5 text-2xs text-muted-foreground">
        <span className="font-semibold text-foreground flex items-center gap-1">
          <Sparkles className="size-3 text-primary-strong" />
          Quick Test:
        </span>
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handleSelectPreset(preset.id)}
            className="cursor-pointer underline decoration-border hover:decoration-foreground hover:text-foreground font-medium"
          >
            &ldquo;{preset.shortLabel}&rdquo;
          </button>
        ))}
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
