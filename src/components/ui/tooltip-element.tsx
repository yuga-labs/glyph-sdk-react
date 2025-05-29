"use client";

import React, { useState } from "react";
import { HelpIcon } from "../../assets/svg/HelpIcon";
import { cn } from "../../lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

function TooltipElement({
    contentClassName,
    triggerClassName,
    description,
    children,
    side,
    align,
    defaultOpen,
    open,
    onOpenChange,
    stopPropagation
}: {
    contentClassName?: string;
    triggerClassName?: string;
    description: React.ReactNode;
    stopPropagation: boolean;
    children?: React.ReactNode;
    side?: "bottom" | "top" | "right" | "left" | undefined;
    align?: "center" | "end" | "start" | undefined;
    defaultOpen?: boolean;
    // When open is undefined internal state is used, but if open is null, undefined is passed
    open?: boolean | null;
    onOpenChange?: ((open: boolean) => void) | undefined;
}): React.ReactElement {
    const [openInternal, setOpenInternal] = useState<boolean>(false);
    return (
        <Tooltip
            defaultOpen={defaultOpen}
            delayDuration={0}
            onOpenChange={onOpenChange === undefined ? setOpenInternal : onOpenChange}
            open={open === undefined ? openInternal : open === null ? undefined : open}
        >
            <TooltipTrigger
                asChild
                onClick={(e) => {
                    if (stopPropagation) {
                        e.stopPropagation();
                    }
                    if (open === undefined && !onOpenChange) {
                        setOpenInternal((v) => !v);
                    }
                }}
            >
                {children ?? (
                    <div>
                        <HelpIcon className={cn("gw-text-brand-gray-500 gw-size-5", triggerClassName)} />
                    </div>
                )}
            </TooltipTrigger>
            <TooltipContent align={align} className={cn("gw-max-w-72", contentClassName)} side={side}>
                <div>{description}</div>
            </TooltipContent>
        </Tooltip>
    );
}

export default TooltipElement;
