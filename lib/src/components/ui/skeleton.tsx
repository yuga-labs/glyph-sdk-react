import { cn } from "../../lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("gw-animate-pulse gw-rounded-md gw-bg-muted", className)} {...props}>
            {/* this char was here: ‎ */}
        </div>
    );
}

export { Skeleton };
