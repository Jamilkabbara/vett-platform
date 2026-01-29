export const SkeletonLoader = () => {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-gray-950 via-black to-gray-900 font-display text-white px-4 sm:px-6 py-6 pb-32 animate-pulse">
      <div className="max-w-7xl mx-auto">
        <div className="h-16 bg-white/5 rounded-2xl mb-8" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="h-32 bg-white/5 rounded-2xl" />
          <div className="h-32 bg-white/5 rounded-2xl" />
          <div className="h-32 bg-white/5 rounded-2xl" />
        </div>

        <div className="h-24 bg-white/5 rounded-2xl mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-white/5 rounded-2xl" />
          <div className="h-96 bg-white/5 rounded-2xl" />
          <div className="h-96 bg-white/5 rounded-2xl" />
        </div>
      </div>
    </div>
  );
};
