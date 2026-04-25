import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * ErrorBoundary — isolates rendering errors so a single component crash
 * doesn't unmount the entire route as a white page.
 *
 * Background (Pass 20 Hotfix Round 2, SEV-1):
 * Recharts crashed inside an unguarded `type.replace(...)` call in
 * AdminOverview's ActivityTypePill, which surfaced inside a Recharts
 * commit-phase callback and tore down the whole /admin route. With
 * defensive guards in place, residual class-of-bug errors should now
 * isolate to the failing panel and leave every other panel rendered.
 *
 * Wrap each independent chart / panel container so a downstream payload
 * surprise (undefined field, NaN, malformed type) only blacks out one tile.
 *
 *   <ErrorBoundary label="Daily Revenue chart">
 *     <ResponsiveContainer>...</ResponsiveContainer>
 *   </ErrorBoundary>
 */

interface Props {
  children: ReactNode;
  /** Human label for logs and the inline fallback. */
  label?: string;
  /** Custom fallback override; default is a small inline error tile. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: null };
  }

  static getDerivedStateFromError(err: unknown): State {
    return {
      hasError: true,
      message: err instanceof Error ? err.message : 'Unknown error',
    };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(
      `[ErrorBoundary${this.props.label ? ' · ' + this.props.label : ''}]`,
      err,
      info,
    );
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;
    return (
      <div className="rounded-xl border border-red-800/40 bg-red-950/20 p-4 text-xs text-red-300/90">
        <p className="font-semibold mb-1">
          {this.props.label ?? 'Component'} failed to render
        </p>
        <p className="font-mono text-[11px] text-red-300/60 break-all">
          {this.state.message}
        </p>
      </div>
    );
  }
}

export default ErrorBoundary;
