import type { Metadata } from "next";

import { ArchitectureSection } from "@/components/site/architecture-section";
import { EvidenceSection } from "@/components/site/evidence-section";
import { FinalCta } from "@/components/site/final-cta";
import { Hero } from "@/components/site/hero";
import { SecuritySection } from "@/components/site/security-section";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { SpacesSection } from "@/components/site/spaces-section";
import { StepsSection } from "@/components/site/steps-section";

/**
 * Public landing page.
 *
 * Rendered at `/` for everyone, signed in or not: the entry button adapts
 * (Sign in / Open workspace) so real employees have immediate, unbroken access.
 * Evaluators, recruiters and technical leads can explore the interactive
 * citation inspector and verified benchmark scorecard.
 */
export const metadata: Metadata = {
  title: {
    absolute:
      "RAG-4i: Zero-GPU Production Enterprise RAG & Statutory Grounding Engine",
  },
  description:
    "Zero-GPU, high-precision enterprise RAG running on Deno Edge and PostgreSQL pgvector. 99.0% checkable citation grounding, zero hallucinations, and fail-closed evidence gating.",
  openGraph: {
    title: "RAG-4i: answers from your documents, with the evidence attached",
    description:
      "Zero-GPU production statutory RAG engine with 99.0% citation grounding entailment and zero hallucinations.",
    siteName: "RAG-4i",
    type: "website",
    locale: "en",
  },
};

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav />
      <main id="main" className="flex-1">
        <Hero />
        <EvidenceSection />
        <ArchitectureSection />
        <StepsSection />
        <SpacesSection />
        <SecuritySection />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
