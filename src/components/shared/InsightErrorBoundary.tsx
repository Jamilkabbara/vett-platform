import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Pass 40 CRASH40-3 — defensive error boundary for the results-page tree.
 *
 * Background: Pass 39 CRASH-1 fixed the top-level RecommendationList
 * crash (React error #31 — rendering an object as a React child). But
 * the live audit after Pass 39 still reported a React #31 with stack
 * trace originating inside `vendor-charts-CIiDHUhl.js` (Recharts).
 *
 * The exact offending consumer of `{goal, title, rationale}` could not
 * be located from source — no Recharts component in ResearchResultsPage,
 * no chart in any imported child component, no Tooltip/Label/LabelList
 * formatter that resolves to an object payload directly. Two plausible
 * explanations:
 *   1. The audit's console retained a stale React #31 from a previous
 *      tab/navigation. Console errors survive across in-tab navigations.
 *   2. A transitive Recharts code path runs on this page (e.g. via a
 *      site-wide widget or analytics) that we haven't located.
 *
 * Either way, defense-in-depth: this boundary catches any React render
 * error inside a results-page subtree and renders a styled "couldn't
 * render this section" message. This means:
 *   - Future AI schema drift (new field, removed field, type change)
 *     no longer blanks the whole page tree.
 *   - The audit gate stays useful — a section visibly degrading is
 *     fixable; a blank black page is not.
 *
 * Pair with renderInsightItem (Pass 39 CRASH-1) which already
 * JSON-stringifies unknown object shapes as a last-resort visible
 * fallback. ErrorBoundary covers React-level throws; renderInsightItem
 * covers data-level type mismatches.
 */
interface InsightErrorBoundaryProps {
  children: ReactNode;
  // Optional section label so the fallback can name what failed
  // ("Couldn't render Recommendations") rather than a generic message.
  label?: string;
}

interface InsightErrorBoundaryState {
  hasError: boolean;
  message: string | null;
}

export class InsightErrorBoundary extends Component<
  InsightErrorBoundaryProps,
  InsightErrorBoundaryState
> {
  constructor(props: InsightErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: null };
  }

  static getDerivedStateFromError(error: Error): InsightErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message ?? 'Unknown render error',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log so we can grep production logs / Sentry for prod occurrences.
    // No PII — only the error message + component stack snippet.
    console.error(
      '[InsightErrorBoundary] caught render error',
      { label: this.props.label, message: error.message, stack: info.componentStack },
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const sectionName = this.props.label ?? 'this section';
      return (
        <div className="rounded-2xl bg-bg2 border border-amber-500/30 p-6">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-amber-300 font-display font-bold text-sm uppercase tracking-widest mb-1">
                Couldn&apos;t render {sectionName}
              </p>
              <p className="text-t2 text-sm leading-relaxed">
                A render error occurred in this section. The rest of the
                page should still be usable. We&apos;ve logged the error
                for investigation.
              </p>
              {this.state.message && (
                <p className="text-t3 text-xs font-mono mt-2 break-all">
                  {this.state.message}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
