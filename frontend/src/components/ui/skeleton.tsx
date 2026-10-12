import React from "react";
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-slate-200/70 dark:bg-slate-800/70 animate-shimmer",
        className
      )}
      {...props}
    />
  );
}

interface TableRowsSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const TableRowsSkeleton: React.FC<TableRowsSkeletonProps> = ({
  rows = 10,
  columns = 7,
  className = "",
}) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className={`border-b dark:border-slate-800/60 ${className}`}>
          {Array.from({ length: columns }).map((_, cIdx) => (
            <td key={cIdx} className="p-3.5">
              <Skeleton
                className={cn(
                  "h-4 w-full",
                  cIdx === 0 && "w-20",
                  cIdx === 1 && "w-16",
                  cIdx === 2 && "w-14",
                  cIdx === columns - 1 && "w-24 ml-auto",
                  cIdx === columns - 2 && "w-28 ml-auto"
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export { Skeleton };
