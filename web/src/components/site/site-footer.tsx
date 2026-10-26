import { EntryAction } from "@/components/site/entry-action";

const LINKS = [
  { href: "#evidence", label: "Evidence" },
  { href: "#benchmarks", label: "Architecture & Benchmarks" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#security", label: "Security" },
];

const PROOF_LINKS = [
  {
    href: "https://github.com/neerajs22is-ux/Ask4i",
    label: "GitHub Repository",
  },
  {
    href: "https://github.com/neerajs22is-ux/Ask4i/blob/main/ARCHITECTURE.md",
    label: "Architecture Specs (D1–D83)",
  },
  {
    href: "https://github.com/neerajs22is-ux/Ask4i/blob/main/ENTERPRISE_BENCHMARK_SCORECARD.md",
    label: "Benchmark Scorecard (99% Grounded)",
  },
  {
    href: "https://github.com/neerajs22is-ux/Ask4i/blob/main/PENTAGI_SECURITY_TEST_RESULTS.md",
    label: "PentAGI Security Audit (9.5/10)",
  },
];

export function SiteFooter() {
  return (
    <footer className="hairline border-t bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
        {/* Brand & Engineering Provenance */}
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <span
              className="bg-primary text-primary-foreground text-2xs inline-flex size-6 shrink-0 items-center justify-center rounded-md font-semibold"
              aria-hidden="true"
            >
              4i
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight text-foreground">
                RAG-4i
              </p>
              <p className="text-muted-foreground text-xs">
                Zero-GPU Production Statutory Grounding Engine
              </p>
            </div>
          </div>
          <p className="text-muted-foreground mt-3 text-xs leading-relaxed text-pretty">
            Architected and engineered by{" "}
            <a
              href="https://linkedin.com/in/neeraj-shivkumar-5b991a33b"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary-strong font-medium underline underline-offset-2"
            >
              Neeraj Shivkumar
            </a>
            , Forward-Deployed AI & Systems Engineer. Zero third-party AI
            framework dependencies. Pure TypeScript on Supabase Edge &
            PostgreSQL pgvector.
          </p>
        </div>

        {/* Navigation & Engineering Proof Links */}
        <div className="flex flex-wrap gap-10">
          <div>
            <p className="text-foreground text-xs font-semibold uppercase tracking-wider font-mono">
              Product
            </p>
            <nav
              aria-label="Product navigation"
              className="mt-3 flex flex-col gap-2"
            >
              {LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground text-xs transition-colors duration-[var(--duration-fast)]"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-1">
                <EntryAction text />
              </div>
            </nav>
          </div>

          <div>
            <p className="text-foreground text-xs font-semibold uppercase tracking-wider font-mono">
              Engineering & Audits
            </p>
            <nav
              aria-label="Engineering proofs"
              className="mt-3 flex flex-col gap-2"
            >
              {PROOF_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground text-xs transition-colors duration-[var(--duration-fast)]"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="hairline border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 sm:flex-row sm:px-6">
          <p className="text-muted-foreground text-2xs">
            © 2026 RAG-4i · All Rights Reserved
          </p>
          <p className="text-muted-foreground font-mono text-2xs">
            Frozen Benchmark Suites Verified · 99.0% Grounding
          </p>
        </div>
      </div>
    </footer>
  );
}
