import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
      <div className="mx-auto w-full max-w-md">
        <Skeleton className="h-80 w-full rounded-[2rem]" />
      </div>
    </div>
  );
}
