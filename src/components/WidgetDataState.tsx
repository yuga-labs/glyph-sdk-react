import { useEffect, useRef, useState } from "react";

type WidgetDataErrorProps = {
    message: string;
    onRetry: () => void | Promise<unknown>;
    compact?: boolean;
};

export function WidgetLoadingShell() {
    return (
        <div
            className="gw-flex gw-min-h-140 gw-flex-col gw-gap-4 gw-p-4 gw-bg-background"
            role="status"
            aria-live="polite"
        >
            <span className="gw-sr-only">Loading Glyph wallet</span>
            <div className="gw-flex gw-items-center gw-justify-between">
                <div className="gw-h-5 gw-w-28 gw-rounded-full gw-bg-muted motion-safe:gw-animate-pulse motion-reduce:gw-animate-none" />
                <div className="gw-h-9 gw-w-9 gw-rounded-full gw-bg-muted motion-safe:gw-animate-pulse motion-reduce:gw-animate-none" />
            </div>
            <div className="gw-flex gw-flex-1 gw-flex-col gw-items-center gw-justify-center gw-gap-3">
                <div className="gw-h-14 gw-w-32 gw-rounded-md gw-bg-muted motion-safe:gw-animate-pulse motion-reduce:gw-animate-none" />
                <div className="gw-h-4 gw-w-24 gw-rounded-full gw-bg-muted motion-safe:gw-animate-pulse motion-reduce:gw-animate-none" />
            </div>
            <div className="gw-flex gw-justify-center gw-gap-2">
                {[0, 1, 2, 3].map((item) => (
                    <div
                        key={item}
                        className="gw-h-16 gw-w-16 gw-rounded-xl gw-bg-muted motion-safe:gw-animate-pulse motion-reduce:gw-animate-none"
                    />
                ))}
            </div>
        </div>
    );
}

export function WidgetDataError({ message, onRetry, compact = false }: WidgetDataErrorProps) {
    const [retrying, setRetrying] = useState(false);
    const pending = useRef(false);
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);
    const retry = async () => {
        if (pending.current) return;
        pending.current = true;
        setRetrying(true);
        try {
            await onRetry();
        } catch {
            // The owning query keeps the failure state and its static message.
        } finally {
            pending.current = false;
            if (mounted.current) setRetrying(false);
        }
    };
    return (
        <div
            className={
                compact
                    ? "gw-flex gw-flex-col gw-items-center gw-justify-center gw-gap-2 gw-p-3 gw-text-center"
                    : "gw-flex gw-flex-col gw-items-center gw-justify-center gw-gap-2 gw-p-4 gw-text-center"
            }
            role="alert"
        >
            <span className="gw-typography-body2 gw-text-brand-gray-700">{message}</span>
            <button
                type="button"
                className="gw-rounded-full gw-px-3 gw-py-2 gw-typography-caption gw-text-secondary gw-underline-offset-4 hover:gw-underline focus-visible:gw-outline-none focus-visible:gw-ring-2 focus-visible:gw-ring-ring"
                disabled={retrying}
                aria-busy={retrying || undefined}
                onClick={retry}
            >
                {retrying ? "Retrying…" : "Try again"}
            </button>
        </div>
    );
}
