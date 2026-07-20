import { LoaderCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  title: string;
  description: string;
  className?: string;
  rows?: number;
}

const LoadingState = ({
  title,
  description,
  className,
  rows = 3,
}: LoadingStateProps) => (
  <Card
    role="status"
    aria-live="polite"
    className={cn(
      "overflow-hidden border-primary/20 bg-card p-5 shadow-soft sm:p-6",
      className,
    )}
  >
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <LoaderCircle className="h-5 w-5 motion-safe:animate-spin" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
    {rows > 0 ? (
      <div className="mt-5 grid gap-3" aria-hidden="true">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-xl border bg-background/60 p-3"
          >
            <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>
        ))}
      </div>
    ) : null}
    <span className="sr-only">Loading</span>
  </Card>
);

export default LoadingState;
