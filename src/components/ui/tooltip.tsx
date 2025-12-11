import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { ComponentPropsWithoutRef, ComponentRef, forwardRef } from "react";
import { cn } from "../../lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipArrow = TooltipPrimitive.TooltipArrow;

const TooltipContent = forwardRef<
    ComponentRef<typeof TooltipPrimitive.Content>,
    ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
            "gw-z-50 gw-overflow-hidden gw-typography-caption gw-rounded-lg gw-bg-popover gw-px-3 gw-py-1.5 gw-text-popover-foreground gw-shadow-inputFocus gw-animate-in gw-fade-in-0 gw-zoom-in-95 data-[state=closed]:gw-animate-out data-[state=closed]:gw-fade-out-0 data-[state=closed]:gw-zoom-out-95 data-[side=bottom]:gw-slide-in-from-top-2 data-[side=left]:gw-slide-in-from-right-2 data-[side=right]:gw-slide-in-from-left-2 data-[side=top]:gw-slide-in-from-bottom-2",
            className
        )}
        {...props}
    />
));

export { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger };
