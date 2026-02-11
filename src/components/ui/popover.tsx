import * as PopoverPrimitive from "@radix-ui/react-popover";
import { ComponentPropsWithoutRef, ComponentRef, forwardRef } from "react";
import { cn } from "../../lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = forwardRef<
    ComponentRef<typeof PopoverPrimitive.Content>,
    ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
    <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
            ref={ref}
            align={align}
            sideOffset={sideOffset}
            className={cn(
                "gw-PopoverContent gw-z-50 gw-w-72 gw-rounded-3xl gw-overflow-y-auto gw-bg-popover gw-p-6 gw-text-popover-foreground gw-shadow-buttonMd gw-outline-none data-[state=open]:gw-animate-in data-[state=closed]:gw-animate-out data-[state=closed]:gw-fade-out-0 data-[state=open]:gw-fade-in-0 data-[state=closed]:gw-zoom-out-95 data-[state=open]:gw-zoom-in-95 data-[side=bottom]:gw-slide-in-from-top-2 data-[side=left]:gw-slide-in-from-right-2 data-[side=right]:gw-slide-in-from-left-2 data-[side=top]:gw-slide-in-from-bottom-2",
                className
            )}
            {...props}
        />
    </PopoverPrimitive.Portal>
));

export { Popover, PopoverContent, PopoverTrigger };
