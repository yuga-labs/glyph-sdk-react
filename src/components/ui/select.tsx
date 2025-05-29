import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../../lib/utils";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
            "gw-flex gw-h-10 gw-w-full gw-items-center gw-justify-between gw-rounded-full gw-shadow-buttonMd gw-bg-background gw-p-2 gw-text-sm gw-ring-offset-background data-[placeholder]:gw-text-muted-foreground focus:gw-outline-none focus:gw-ring-2 focus:gw-ring-ring focus:gw-ring-offset-2 disabled:gw-cursor-not-allowed disabled:gw-opacity-50 [&>span]:gw-line-clamp-1",
            className
        )}
        {...props}
    >
        {children}
        <SelectPrimitive.Icon asChild>
            <ChevronDown className="gw-h-4 gw-w-4 gw-opacity-50" />
        </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollUpButton
        ref={ref}
        className={cn("gw-flex gw-cursor-default gw-items-center gw-justify-center gw-py-1", className)}
        {...props}
    >
        <ChevronUp className="gw-h-4 gw-w-4" />
    </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollDownButton
        ref={ref}
        className={cn("gw-flex gw-cursor-default gw-items-center gw-justify-center gw-py-1", className)}
        {...props}
    >
        <ChevronDown className="gw-h-4 gw-w-4" />
    </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
    <SelectPrimitive.Portal>
        <SelectPrimitive.Content
            ref={ref}
            className={cn(
                "gw-relative gw-z-50 gw-max-h-[--radix-select-content-available-height] gw-min-w-[8rem] gw-overflow-y-auto gw-overflow-x-hidden gw-rounded-xl gw-bg-popover gw-text-popover-foreground gw-shadow-md data-[state=open]:gw-animate-in data-[state=closed]:gw-animate-out data-[state=closed]:gw-fade-out-0 data-[state=open]:gw-fade-in-0 data-[state=closed]:gw-zoom-out-95 data-[state=open]:gw-zoom-in-95 data-[side=bottom]:gw-slide-in-from-top-2 data-[side=left]:gw-slide-in-from-right-2 data-[side=right]:gw-slide-in-from-left-2 data-[side=top]:gw-slide-in-from-bottom-2 gw-origin-[--radix-select-content-transform-origin]",
                position === "popper" &&
                    "data-[side=bottom]:gw-translate-y-1 data-[side=left]:gw--translate-x-1 data-[side=right]:gw-translate-x-1 data-[side=top]:gw--translate-y-1",
                className
            )}
            position={position}
            {...props}
        >
            <SelectScrollUpButton />
            <SelectPrimitive.Viewport
                className={cn(
                    "gw-p-1",
                    position === "popper" &&
                        "gw-h-[var(--radix-select-trigger-height)] gw-w-full gw-min-w-[var(--radix-select-trigger-width)]"
                )}
            >
                {children}
            </SelectPrimitive.Viewport>
            <SelectScrollDownButton />
        </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.Label
        ref={ref}
        className={cn("gw-py-1.5 gw-pl-8 gw-pr-2 gw-typography-body2", className)}
        {...props}
    />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
        ref={ref}
        className={cn(
            "gw-relative gw-flex gw-w-full gw-cursor-default gw-select-none gw-items-center gw-rounded-lg gw-py-1.5 gw-pl-8 gw-pr-2 gw-typography-caption gw-outline-none focus:gw-bg-muted data-[disabled]:gw-pointer-events-none data-[disabled]:gw-opacity-50",
            className
        )}
        {...props}
    >
        <span className="gw-absolute gw-left-2 gw-flex gw-h-3.5 gw-w-3.5 gw-items-center gw-justify-center">
            <SelectPrimitive.ItemIndicator>
                <Check className="gw-h-4 gw-w-4" />
            </SelectPrimitive.ItemIndicator>
        </span>

        {children}
    </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.Separator ref={ref} className={cn("gw-mx-1 gw-my-1 gw-h-px gw-bg-muted", className)} {...props} />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectLabel,
    SelectItem,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton
};
