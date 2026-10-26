import Link from "next/link";

import { EntryAction } from "@/components/site/entry-action";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Public navigation.
 *
 * One quiet row: identity, four in-page sections, github repository link,
 * the theme control and the primary entry action ("Sign in" / "Open workspace").
 * Real employees maintain immediate 1-click access to the workspace.
 */

const LINKS = [
  { href: "#evidence", label: "Evidence" },
  { href: "#benchmarks", label: "Architecture & Benchmarks" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#security", label: "Security" },
];

export function SiteNav() {
  return (
    <header className="bg-background/85 hairline sticky top-0 z-40 border-b backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6"
      >
        <Link
          href="/"
          className="focus-visible:ring-ring/50 flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2"
        >
          <span
            className="bg-primary text-primary-foreground text-2xs inline-flex size-6 shrink-0 items-center justify-center rounded-md font-semibold"
            aria-hidden="true"
          >
            4i
          </span>
          <span className="text-sm font-medium tracking-tight">RAG-4i</span>
        </Link>

        <div className="ml-4 hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-md px-2.5 py-1.5 text-sm transition-colors duration-[var(--duration-fast)] outline-none focus-visible:ring-2"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* GitHub Source Link */}
          <a
            href="https://github.com/neerajs22is-ux/Ask4i"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 hidden items-center justify-center rounded-md p-1.5 transition-colors sm:inline-flex outline-none focus-visible:ring-2"
            title="View Source on GitHub"
            aria-label="GitHub Repository"
          >
            <svg
              className="size-4"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
          </a>

          <ThemeToggle className="hidden sm:inline-flex" />

          {/* Primary Action for Staff & Employees */}
          <EntryAction size="sm" />
        </div>
      </nav>
    </header>
  );
}
