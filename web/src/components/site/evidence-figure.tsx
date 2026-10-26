"use client";

import { useState } from "react";
import {
  Check,
  FileText,
  ShieldCheck,
} from "lucide-react";

import { cn } from "cn";

/**
 * Document Provenance & Passage Viewer.
 *
 * Replaces redundant chat bubbles with an authentic statutory document viewer,
 * demonstrating how RAG-4i anchors every generated claim directly to page-level
 * passages in the source PDF.
 */

const PASSAGES = [
  {
    id: 1,
    label: "Citation [1]",
    claim:
      "Confirm the asset register reconciles with the fixed-asset ledger line by line before the schedule is finalised.",
    document: "Year-End Procedures.pdf",
    page: 22,
    section: "Section 4.2 — Depreciation Finalisation Protocol",
    passageText:
      "Do not finalise a depreciation schedule until the asset register and the fixed-asset ledger reconcile, line by line, for every class of asset.",
    contextBefore:
      "...4.2.1 Statutory reconciliation mandates strict alignment between physical asset logs and general ledger accounts prior to closing the accounting period.",
    contextAfter:
      "Any discrepancy exceeding immaterial ledger rounding must be flagged for partner review prior to issuance of draft statements...",
  },
  {
    id: 2,
    label: "Citation [2]",
    claim:
      "For additions during the year, compute depreciation from the date first put to use, not invoice date.",
    document: "Fixed Assets Advisory Note.pdf",
    page: 9,
    section: "Section 2.4 — Timing of Asset Capitalisation",
    passageText:
      "For additions during the year, compute depreciation from the date the asset was first put to use; the invoice date is not the acquisition date for this purpose.",
    contextBefore:
      "...2.4.3 Applicable statutory standards require precise depreciation timing based on operational readiness rather than commercial vendor billing.",
    contextAfter:
      "Supporting delivery receipts and commissioning certificates serve as primary audit evidence for establishing put-to-use dates...",
  },
];

export function DocumentProvenanceViewer() {
  const [activePassageId, setActivePassageId] = useState<number>(1);

  const activePassage =
    PASSAGES.find((p) => p.id === activePassageId) ?? PASSAGES[0];

  return (
    <div className="bg-card hairline rounded-2xl border shadow-lg overflow-hidden">
      {/* 1. PDF Document Header Bar */}
      <div className="bg-muted/70 flex items-center justify-between border-b border-border/80 px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="bg-primary text-primary-foreground inline-flex size-6 shrink-0 items-center justify-center rounded font-mono text-2xs font-bold">
            PDF
          </span>
          <span className="text-xs font-semibold text-foreground truncate">
            {activePassage.document}
          </span>
          <span className="text-muted-foreground text-2xs font-mono shrink-0 hidden sm:inline">
            · Page {activePassage.page} of 78
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="bg-background text-foreground hairline border rounded px-2 py-0.5 font-mono text-2xs">
            100% Zoom
          </span>
          <span className="text-success hidden sm:inline-flex items-center gap-1 font-mono text-2xs">
            <ShieldCheck className="size-3" />
            SHA-256 Verified
          </span>
        </div>
      </div>

      {/* 2. Interactive Citation Selector Tabs */}
      <div className="bg-background/95 border-b border-border/60 px-4 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xs font-mono uppercase text-muted-foreground">
            Inspect Passage:
          </span>
          {PASSAGES.map((passage) => {
            const isSelected = passage.id === activePassageId;
            return (
              <button
                key={passage.id}
                type="button"
                onClick={() => setActivePassageId(passage.id)}
                className={cn(
                  "cursor-pointer rounded-md px-2.5 py-1 font-mono text-xs font-semibold transition-colors duration-[var(--duration-fast)]",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {passage.label}
              </button>
            );
          })}
        </div>
        <span className="text-2xs text-muted-foreground font-mono hidden sm:inline">
          Click passage to inspect
        </span>
      </div>

      {/* 3. Physical Document Page Canvas */}
      <div className="bg-background/60 p-5 font-serif sm:p-6 text-foreground/90">
        <div className="text-2xs font-mono uppercase tracking-widest text-muted-foreground border-b border-border/60 pb-1.5 font-sans">
          {activePassage.section}
        </div>

        <div className="mt-4 text-xs sm:text-sm leading-relaxed space-y-3 font-sans">
          <p className="text-muted-foreground/80 leading-relaxed">
            {activePassage.contextBefore}
          </p>

          {/* Highlighted Passage in Source Document */}
          <div className="relative my-3 rounded-lg border-2 border-primary/50 bg-primary/10 p-3 shadow-xs">
            <div className="absolute -top-2.5 right-3 flex items-center gap-1 bg-primary text-primary-foreground px-2 py-0.5 rounded font-mono text-2xs font-bold">
              <Check className="size-3" />
              Grounded Passage [{activePassage.id}]
            </div>
            <p className="font-semibold text-foreground leading-relaxed text-pretty">
              &ldquo;{activePassage.passageText}&rdquo;
            </p>
          </div>

          <p className="text-muted-foreground/80 leading-relaxed">
            {activePassage.contextAfter}
          </p>
        </div>
      </div>

      {/* 4. Bidirectional Entailment Mapping Footer */}
      <div className="bg-muted/40 border-t border-border/80 p-3.5 text-xs font-sans">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <FileText className="size-3.5 text-primary-strong" />
          <span>Claim Verification Contract</span>
          <span className="bg-success-muted text-success border border-success/30 ml-auto rounded px-1.5 py-0.2 font-mono text-2xs">
            Entailment: 1.000
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-2xs leading-relaxed text-pretty">
          <strong className="text-foreground">Generated Claim:</strong> &ldquo;
          {activePassage.claim}&rdquo;
        </p>
      </div>
    </div>
  );
}

/** Legacy exports for backwards compatibility */
export function RefusalDemo() {
  return null;
}
export function MarkerLinkDemo() {
  return null;
}
