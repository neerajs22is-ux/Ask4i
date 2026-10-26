import { InteractiveAnswerDemo } from "@/components/site/answer-demo";
import { EntryAction } from "@/components/site/entry-action";

/**
 * Hero.
 *
 * The product is the hero: the headline and the interactive answer surface sit
 * side by side (stacked on smaller viewports), and the answer demonstrably
 * carries its evidence. Real employees retain the primary "Sign in" action,
 * while visitors and technical evaluators can interactively test citation
 * inspection and refusal behavior directly on the canvas.
 */

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative">
      <div
        aria-hidden="true"
        className="bg-[radial-gradient(ellipse_90%_70%_at_70%_-10%,color-mix(in_oklab,var(--accent)_75%,transparent),transparent_70%)] pointer-events-none absolute inset-0"
      />
      <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center lg:gap-12 lg:pt-20 lg:pb-24">
        <div className="max-w-xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-2xs font-mono font-medium text-primary-strong">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ZERO-GPU PRODUCTION STATUTORY RAG
          </div>
          <h1
            id="hero-heading"
            className="text-[clamp(2.25rem,4.6vw,3.4rem)] leading-[1.07] font-semibold tracking-[-0.025em] text-balance"
          >
            Ask your documents. Get answers with the evidence attached.
          </h1>
          <p className="text-muted-foreground mt-5 max-w-[54ch] text-base text-pretty">
            RAG&#8209;4i answers questions from the documents in your
            workspace, citing the exact passage behind every claim. When the
            documents don&apos;t cover a question, it says so.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
            {/* Primary Action for Working Employees */}
            <EntryAction size="lg" />

            {/* Architecture / Engineering Deep-Dive for Evaluators */}
            <a
              href="#benchmarks"
              className="border-border/80 bg-background hover:bg-muted/60 text-foreground inline-flex items-center gap-1.5 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors duration-[var(--duration-fast)]"
            >
              Architecture & Benchmarks →
            </a>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            <span>Enterprise accounts provisioned by administrator.</span>
            <span className="hidden sm:inline text-border/80">•</span>
            <a
              href="#demo"
              className="text-primary-strong hover:underline font-medium inline-flex items-center gap-1"
            >
              Try interactive demo below ↓
            </a>
          </div>
        </div>

        <div id="demo" className="min-w-0 scroll-mt-20">
          <InteractiveAnswerDemo />
          <p className="text-muted-foreground mt-3 text-center text-xs">
            Interactive answer surface running claim-level citation validation
            and pre-inference evidence gating.
          </p>
        </div>
      </div>
    </section>
  );
}
