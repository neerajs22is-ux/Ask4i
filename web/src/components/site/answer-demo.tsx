"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { EvidenceStatusBadge } from "@/components/foundation/evidence-status";
import { cn } from "cn";

/**
 * Interactive Answer Demo.
 *
 * Restrained, production-grade replica of the real answer surface:
 * 1. Clean, airy typography matching the original design.
 * 2. Subtle query toggle (Supported answer vs. Honest refusal).
 * 3. Interactive citation markers [1] and [2] that smoothly highlight
 *    the corresponding source passage below when clicked.
 */

const EVIDENCE = [
  {
    n: 1,
    file: "Year-End Procedures.pdf",
    page: 22,
    excerpt:
      "Do not finalise a depreciation schedule until the asset register and the fixed-asset ledger reconcile, line by line, for every class of asset.",
  },
  {
    n: 2,
    file: "Fixed Assets Advisory Note.pdf",
    page: 9,
    excerpt:
      "For additions during the year, compute depreciation from the date the asset was first put to use; the invoice date is not the acquisition date for this purpose.",
  },
];

export function InteractiveAnswerDemo() {
  const [mode, setMode] = useState<"supported" | "refusal">("supported");
  const [activeCitation, setActiveCitation] = useState<number | null>(null);

  const toggleCitation = (n: number) => {
    setActiveCitation((curr) => (curr === n ? null : n));
  };

  return (
    <div className="bg-background hairline site-reveal rounded-2xl border p-4 shadow-lg sm:p-5">
      {/* Quiet Query Switcher */}
      <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-2.5 text-2xs font-mono">
        <span className="text-muted-foreground uppercase tracking-wider">
          Example Answer Surface
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("supported");
              setActiveCitation(null);
            }}
            className={cn(
              "cursor-pointer transition-colors duration-[var(--duration-fast)]",
              mode === "supported"
                ? "text-foreground font-semibold underline underline-offset-4 decoration-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Cited answer
          </button>
          <span className="text-border" aria-hidden="true">
            /
          </span>
          <button
            type="button"
            onClick={() => {
              setMode("refusal");
              setActiveCitation(null);
            }}
            className={cn(
              "cursor-pointer transition-colors duration-[var(--duration-fast)]",
              mode === "refusal"
                ? "text-foreground font-semibold underline underline-offset-4 decoration-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Honest refusal
          </button>
        </div>
      </div>

      {mode === "supported" ? (
        <>
          {/* Question */}
          <div className="bg-secondary/70 hairline rounded-xl border px-3.5 py-2.5">
            <p className="text-base leading-relaxed break-words whitespace-pre-wrap text-foreground">
              What should we confirm before finalising a client&apos;s
              depreciation schedule?
            </p>
          </div>

          {/* Answer */}
          <article className="mt-3" aria-label="Example answer">
            <div className="flex flex-wrap items-center gap-2">
              <EvidenceStatusBadge state="supported" />
              <span className="text-muted-foreground font-mono text-2xs">
                8 retrieved · 2 cited
              </span>
            </div>

            <div className="bg-card hairline mt-2.5 rounded-xl border px-4 py-3 text-base shadow-xs">
              <p className="my-3 leading-relaxed text-pretty text-foreground first:mt-1 last:mb-1">
                Confirm the asset register reconciles with the fixed-asset
                ledger before the schedule is finalised.
                <button
                  type="button"
                  onClick={() => toggleCitation(1)}
                  className={cn(
                    "ml-1 inline-flex cursor-pointer items-center rounded-md border px-1 font-mono text-2xs align-super transition-all duration-[var(--duration-fast)]",
                    activeCitation === 1
                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                      : "bg-muted text-foreground border-border hover:border-foreground/50",
                  )}
                  title="Click to highlight source passage [1]"
                  aria-label="Citation 1"
                >
                  [1]
                </button>
              </p>
              <p className="my-3 leading-relaxed text-pretty text-foreground first:mt-1 last:mb-1">
                For assets acquired during the year, depreciation runs from the
                date the asset was first put to use, not the invoice date.
                <button
                  type="button"
                  onClick={() => toggleCitation(2)}
                  className={cn(
                    "ml-1 inline-flex cursor-pointer items-center rounded-md border px-1 font-mono text-2xs align-super transition-all duration-[var(--duration-fast)]",
                    activeCitation === 2
                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                      : "bg-muted text-foreground border-border hover:border-foreground/50",
                  )}
                  title="Click to highlight source passage [2]"
                  aria-label="Citation 2"
                >
                  [2]
                </button>
              </p>
            </div>
          </article>

          {/* Supporting Evidence List */}
          <div className="mt-3" aria-label="Example supporting evidence">
            <div className="border-border/60 flex w-full items-center gap-2 border-t pt-2">
              <span className="text-foreground text-2xs font-medium tracking-wide uppercase">
                Supporting evidence
              </span>
              <span className="text-muted-foreground text-2xs">
                2 sources · 2 documents
              </span>
              <ChevronDown
                aria-hidden="true"
                className="text-muted-foreground ml-auto size-3.5 shrink-0 rotate-180"
              />
            </div>

            <ol className="divide-border/70 mt-1 divide-y">
              {EVIDENCE.map((source) => {
                const isSelected = activeCitation === source.n;
                return (
                  <li
                    key={source.n}
                    onClick={() => toggleCitation(source.n)}
                    className={cn(
                      "flex cursor-pointer items-start gap-2.5 py-2 px-1.5 rounded-lg transition-colors duration-[var(--duration-fast)]",
                      isSelected
                        ? "bg-primary/10 hairline border-primary/30"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex size-5 shrink-0 items-center justify-center rounded font-mono text-2xs font-medium transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground border border-transparent",
                      )}
                      title={`Citation ${source.n}`}
                    >
                      {source.n}
                    </span>
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="flex min-w-0 items-baseline gap-1 text-xs">
                        <span
                          className="text-foreground min-w-0 flex-1 truncate font-medium"
                          title={source.file}
                        >
                          {source.file}
                        </span>
                        <span className="text-muted-foreground shrink-0 font-mono">
                          · p. {source.page}
                        </span>
                      </p>
                      <blockquote className="border-border text-foreground/80 mt-1 border-l-2 pl-2 text-xs leading-relaxed break-words whitespace-pre-wrap">
                        {source.excerpt}
                      </blockquote>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </>
      ) : (
        <>
          {/* Question in Refusal Mode */}
          <div className="bg-secondary/70 hairline rounded-xl border px-3.5 py-2.5">
            <p className="text-base leading-relaxed break-words whitespace-pre-wrap text-foreground">
              What notice period applies to the supplier renewal clause?
            </p>
          </div>

          {/* Refusal Answer */}
          <article className="mt-3" aria-label="Example refusal">
            <div className="flex flex-wrap items-center gap-2">
              <EvidenceStatusBadge state="insufficient" />
              <span className="text-muted-foreground font-mono text-2xs">
                0 cited · 6 retrieved
              </span>
            </div>

            <div className="bg-card hairline mt-2.5 rounded-xl border px-4 py-3 text-base shadow-xs">
              <p className="my-2 leading-relaxed text-pretty text-foreground">
                I could not find enough relevant information in the documents to
                answer that.
              </p>
              <p className="text-muted-foreground mt-2 text-xs text-pretty leading-relaxed">
                The documents in this workspace do not cover notice periods for
                supplier renewal clauses. RAG&#8209;4i refuses the query rather
                than inventing ungrounded wording.
              </p>
            </div>
          </article>
        </>
      )}
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
