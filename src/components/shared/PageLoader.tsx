/** Full-screen centered spinner used as the Suspense fallback for lazy-loaded pages. */
export function PageLoader() {
  return (
    <div className="w-full min-h-[100dvh] bg-[#0B0C15] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}
