import {
  EvidenceStatusBadge,
  evidenceStateConfig,
  type EvidenceState,
} from "@/components/foundation/evidence-status";
import { DocumentProvenanceViewer } from "@/components/site/evidence-figure";

/**
 * Evidence section.
 *
 * Demonstrates the underlying document inspection surface:
 * The right side displays the authentic PDF Document & Passage Viewer
 * with highlighted statutory citations and claim verification contracts,
 * completely distinct from the conversational chat surface in the hero.
 */

const STATES: EvidenceState[] = [
  "supported",
  "partial",
  "conflicting",
  "insufficient",
];

export function EvidenceSection() {
  return (
    <section
      id="evidence"
      aria-labelledby="evidence-heading"
      className="hairline border-t"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16 lg:items-center">
          <div className="lg:self-center">
            <div className="mb-2 inline-flex items-center gap-1.5 font-mono text-2xs uppercase tracking-wider text-primary-strong">
              <span>Passage-Level Provenance</span>
            </div>
            <h2
              id="evidence-heading"
              className="text-[clamp(1.75rem,3vw,2.25rem)] leading-tight font-semibold tracking-[-0.02em] text-balance"
            >
              Every answer shows where it came from.
            </h2>
            <p className="text-muted-foreground mt-4 max-w-[48ch] text-base text-pretty leading-relaxed">
              Citations open the exact statutory passage a claim was drawn from,
              with its original document and page number. You inspect the
              evidence directly before you rely on an answer.
            </p>
            <p className="text-muted-foreground mt-4 max-w-[48ch] text-base text-pretty leading-relaxed">
              And when the retrieved passages don&apos;t tell the whole story,
              RAG&#8209;4i labels the answer or refuses unbacked claims instead
              of smoothing over gaps.
            </p>
          </div>

          <div className="min-w-0">
            <DocumentProvenanceViewer />
            <p className="text-muted-foreground mt-3 text-center text-xs">
              Simulated statutory PDF document inspector. Demonstrates exact
              highlight anchoring and claim entailment verification.
            </p>
          </div>
        </div>

        <dl className="hairline mt-14 grid gap-x-10 gap-y-7 border-t pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {STATES.map((state) => {
            const config = evidenceStateConfig(state);
            return (
              <div key={state}>
                <dt>
                  <EvidenceStatusBadge state={state} />
                </dt>
                <dd className="text-muted-foreground mt-2.5 max-w-[40ch] text-sm text-pretty">
                  {config.description}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
