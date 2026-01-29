export const QuestionSkeleton = () => {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 bg-white/10 rounded"></div>
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-white/10 rounded-full"></div>
              <div className="h-6 w-6 bg-white/10 rounded"></div>
            </div>
          </div>

          <div className="h-6 w-3/4 bg-white/10 rounded"></div>

          <div className="space-y-2">
            <div className="h-12 w-full bg-white/5 rounded-lg"></div>
            <div className="h-12 w-full bg-white/5 rounded-lg"></div>
            <div className="h-12 w-full bg-white/5 rounded-lg"></div>
          </div>
        </div>
      ))}

      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 text-primary">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-sm font-bold">AI is generating your survey questions...</span>
        </div>
        <p className="text-white/40 text-xs mt-2">This usually takes 2-3 seconds</p>
      </div>
    </div>
  );
};
