import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SourcesListSkeleton() {
  return (
    <div className="min-h-full flex flex-col w-1/4 bg-white rounded-3xl text-black">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-5 w-16" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={`skeleton-${i}`} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* File icon placeholder */}
                    <Skeleton className="h-4 w-4" />
                    <div className="min-w-0 flex-1">
                      {/* Document name placeholder */}
                      <Skeleton className="h-4 w-full mb-1" />
                      {/* File type and size placeholder */}
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  {/* Status badge placeholder */}
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  {/* Date placeholder */}
                  <Skeleton className="h-3 w-24" />

                  <div className="flex items-center gap-1">
                    {/* Action buttons placeholders */}
                    <Skeleton className="h-7 w-7 rounded" />
                    <Skeleton className="h-7 w-7 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}