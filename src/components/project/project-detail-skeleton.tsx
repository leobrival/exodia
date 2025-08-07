import { Skeleton } from "@/components/ui/skeleton";
import SourcesListSkeleton from "./sources-list-skeleton";

export default function ProjectDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#edeffa] flex flex-col">
      {/* Header skeleton */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Back button */}
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div>
              {/* Project title */}
              <Skeleton className="h-7 w-64 mb-1" />
              {/* Project description */}
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Action buttons */}
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </div>
      </header>

      {/* Main content skeleton */}
      <main className="flex flex-1 w-full overflow-hidden px-6 pt-6 gap-6">
        {/* Sources list skeleton - 1/4 */}
        <SourcesListSkeleton />
        
        {/* Chat interface skeleton - 2/4 */}
        <div className="flex-1 bg-white rounded-3xl p-6">
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-80" />
            <Skeleton className="h-10 w-48 rounded-lg" />
          </div>
        </div>
        
        {/* Actions panel skeleton - 1/4 */}
        <div className="w-1/4 bg-white rounded-3xl p-6">
          <div className="space-y-4">
            {/* Panel title */}
            <Skeleton className="h-5 w-24" />
            
            {/* Action buttons */}
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
            
            {/* Stats section */}
            <div className="mt-8 space-y-3">
              <Skeleton className="h-4 w-16" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer skeleton */}
      <footer className="h-6 flex items-center justify-center">
        <Skeleton className="h-3 w-64" />
      </footer>
    </div>
  );
}