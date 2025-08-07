import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectCardSkeleton() {
  return (
    <Card className="cursor-pointer select-none border-none rounded-xl aspect-[3/2]">
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Emoji placeholder */}
            <Skeleton className="w-12 h-12 rounded-lg" />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Actions menu placeholder */}
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </CardHeader>
      
      <div>
        <CardContent className="px-6 pt-0 pb-2">
          <div className="min-w-0 flex-1 space-y-2">
            {/* Title placeholder - 2 lines max */}
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>
        </CardContent>
        
        <CardFooter>
          <div className="flex items-center gap-2">
            {/* Date and sources placeholder */}
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        </CardFooter>
      </div>
    </Card>
  );
}