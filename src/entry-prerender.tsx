/**
 * Build-time render of a public route to HTML, for scripts/prerender.mjs.
 *
 * Renders the exact tree src/main.tsx renders in the browser - StrictMode,
 * AuthProvider, ToastProvider and AppShell - with a StaticRouter in place of
 * BrowserRouter. Matching trees are what let the browser HYDRATE the
 * prerendered page (keep it on screen and attach to it) rather than throwing it
 * away and showing a loading spinner while the page's code downloads.
 *
 * renderToPipeableStream with onAllReady, not renderToString: the public pages
 * are React.lazy chunks, and renderToString cannot wait for a lazy component -
 * it would emit the Suspense fallback (the page loader) instead of the page.
 * onAllReady resolves once every lazy page has loaded and rendered.
 *
 * Nothing here runs in a browser, and no effect runs on the server, so auth,
 * data fetching and anything else done in effects is simply absent from the
 * HTML - which is the correct static shell for a crawler.
 */
import { StrictMode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { PassThrough } from 'node:stream';
import { AppShell } from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';

export function renderRoute(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const errors: unknown[] = [];
    const { pipe } = renderToPipeableStream(
      <StrictMode>
        <AuthProvider>
          <ToastProvider>
            <StaticRouter location={url}>
              <AppShell />
            </StaticRouter>
          </ToastProvider>
        </AuthProvider>
      </StrictMode>,
      {
        onAllReady() {
          if (errors.length) {
            reject(errors[0]);
            return;
          }
          const sink = new PassThrough();
          const chunks: Buffer[] = [];
          sink.on('data', (c: Buffer) => chunks.push(c));
          sink.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
          pipe(sink);
        },
        onShellError(err) { reject(err); },
        // A component that throws while rendering is recorded, not swallowed:
        // React would otherwise emit a client-render fallback and the build
        // would ship a page with a hole in it.
        onError(err) { errors.push(err); },
      },
    );
  });
}
