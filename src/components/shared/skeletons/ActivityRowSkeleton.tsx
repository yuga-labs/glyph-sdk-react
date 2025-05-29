import { cn } from "../../../lib/utils";
import { Skeleton } from "../../ui/skeleton";

export function ActivityRowSkeleton() {
    return (
        <div className="gw-flex gw-items-center gw-typography-body1 gw-flex-1 gw-space-x-3 gw-py-3.5">
            <div
                className={cn(
                    "gw-rounded-full gw-overflow-hidden gw-size-10 gw-flex-shrink-0 gw-flex gw-justify-center gw-items-center"
                )}
            >
                <Skeleton className="gw-w-full gw-h-full gw-rounded-full" />
            </div>
            <div className="gw-flex gw-justify-between gw-items-center gw-flex-1">
                <div className="gw-flex gw-flex-col gw-text-start gw-space-y-1">
                    <div className="gw-font-medium gw-capitalize">
                        <Skeleton className="gw-w-14 gw-h-4" />
                    </div>
                    <div className={cn("gw-typography-caption")}>
                        <Skeleton className="gw-w-14 gw-h-3" />
                    </div>
                </div>
                <div className="gw-flex gw-flex-col gw-text-end gw-space-y-1">
                    <div className="gw-font-medium">
                        <Skeleton className="gw-w-10 gw-h-4" />
                    </div>
                    <div className="gw-typography-caption gw-text-brand-gray-500">
                        <Skeleton className="gw-w-10 gw-h-3" />
                    </div>
                </div>
            </div>
        </div>
    );
}
