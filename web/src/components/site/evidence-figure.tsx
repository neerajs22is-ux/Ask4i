import { FileText } from "lucide-react";

/**
 * Source Passage Figures for the Evidence Section.
 *
 * Renders the verbatim document passages behind citations, visually distinct
 * from the conversational answer surface in the hero.
 */

export function DocumentPassageDemo() {
  return (
    <div className="space-y-4">
      {/* Passage Card 1 */}
      <div className="bg-background hairline rounded-2xl border p-4.5 shadow-sm sm:p-5">
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5 text-xs">
          <div className="flex items-center gap-2">
            <FileText className="size-3.5 text-primary-strong" />
            <span className="font-medium text-foreground">
              Year-End Procedures.pdf
            </span>
            <span className="text-muted-foreground font-mono text-2xs">
              · p. 22
            </span>
          </div>
          <span className="bg-primary/10 text-primary-strong rounded px-1.5 py-0.5 font-mono text-2xs font-semibold">
            Citation [1]
          </span>
        </div>

        <blockquote className="border-primary text-foreground mt-3.5 border-l-2 pl-3.5 text-sm leading-relaxed text-pretty sm:text-base">
          &ldquo;Do not finalise a depreciation schedule until the asset
          register and the fixed-asset ledger reconcile, line by line, for every
          class of asset.&rdquo;
        </blockquote>

        <p className="text-muted-foreground mt-3 text-2xs font-mono">
          Cited by: &ldquo;Confirm the asset register reconciles with the
          fixed-asset ledger before the schedule is finalised.&rdquo;
        </p>
      </div>

      {/* Passage Card 2 */}
      <div className="bg-background hairline rounded-2xl border p-4.5 shadow-sm sm:p-5">
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5 text-xs">
          <div className="flex items-center gap-2">
            <FileText className="size-3.5 text-primary-strong" />
            <span className="font-medium text-foreground">
              Fixed Assets Advisory Note.pdf
            </span>
            <span className="text-muted-foreground font-mono text-2xs">
              · p. 9
            </span>
          </div>
          <span className="bg-primary/10 text-primary-strong rounded px-1.5 py-0.5 font-mono text-2xs font-semibold">
            Citation [2]
          </span>
        </div>

        <blockquote className="border-primary text-foreground mt-3.5 border-l-2 pl-3.5 text-sm leading-relaxed text-pretty sm:text-base">
          &ldquo;For additions during the year, compute depreciation from the
          date the asset was first put to use; the invoice date is not the
          acquisition date for this purpose.&rdquo;
        </blockquote>

        <p className="text-muted-foreground mt-3 text-2xs font-mono">
          Cited by: &ldquo;Depreciation runs from the date first put to use, not
          the invoice date.&rdquo;
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
export function DocumentProvenanceViewer() {
  return <DocumentPassageDemo />;
}
