export function PropertyCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
      <div className="aspect-[16/10] rk-skeleton" />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="h-6 w-28 rounded-md rk-skeleton" />
          <div className="h-5 w-20 rounded-full rk-skeleton" />
        </div>
        <div className="h-4 w-full rounded rk-skeleton" />
        <div className="h-4 w-3/4 rounded rk-skeleton" />
        <div className="flex gap-2 pt-1">
          <div className="h-6 w-16 rounded-full rk-skeleton" />
          <div className="h-6 w-20 rounded-full rk-skeleton" />
          <div className="h-6 w-16 rounded-full rk-skeleton" />
        </div>
      </div>
    </div>
  );
}

export function PropertyDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="h-5 w-48 rounded rk-skeleton" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-[16/10] rounded-2xl rk-skeleton" />
          <div className="h-8 w-3/4 rounded-lg rk-skeleton" />
          <div className="h-28 rounded-2xl rk-skeleton" />
          <div className="h-44 rounded-2xl rk-skeleton" />
        </div>
        <div className="space-y-4">
          <div className="h-64 rounded-2xl rk-skeleton" />
          <div className="h-36 rounded-2xl rk-skeleton" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 p-5 space-y-3">
      <div className="h-4 w-24 rounded rk-skeleton" />
      <div className="h-8 w-16 rounded-lg rk-skeleton" />
    </div>
  );
}
