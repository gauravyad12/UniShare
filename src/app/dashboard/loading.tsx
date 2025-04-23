export default function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8 flex flex-col gap-8 items-center justify-center min-h-[60vh]">
      <div className="space-y-4 w-full max-w-3xl">
        <div className="h-8 bg-secondary/50 rounded w-1/3"></div>
        <div className="h-4 bg-secondary/30 rounded w-full"></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="h-40 bg-secondary/20 rounded"></div>
          <div className="h-40 bg-secondary/20 rounded"></div>
          <div className="h-40 bg-secondary/20 rounded"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="h-64 bg-secondary/20 rounded md:col-span-1"></div>
          <div className="h-64 bg-secondary/20 rounded md:col-span-2"></div>
        </div>
      </div>
    </div>
  );
}
