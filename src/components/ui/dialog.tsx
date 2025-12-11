import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
    React.ComponentRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            "gw-fixed gw-inset-0 gw-z-50 gw-bg-black/40 data-[state=open]:gw-animate-in data-[state=closed]:gw-animate-out data-[state=closed]:gw-fade-out-0 data-[state=open]:gw-fade-in-0 gw-rounded-t-3xl md:gw-rounded-3xl",
            className
        )}
        {...props}
    />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
    React.ComponentRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
        container?: HTMLElement | null;
    }
>(({ className, children, container, ...props }, ref) => (
    <DialogPortal container={container}>
        <DialogOverlay />
        <DialogPrimitive.Content
            ref={ref}
            className={cn(
                "gw-fixed gw-left-[50%] gw-top-[50%] gw-z-50 gw-grid gw-w-[calc(100%-1rem)] gw-max-h-[calc(100vh-2rem)] gw-overflow-auto sm:gw-max-w-lg gw-translate-x-[-50%] gw-translate-y-[-50%] gw-gap-4 gw-bg-popover gw-p-4 gw-shadow-buttonLg gw-duration-200 data-[state=open]:gw-animate-in data-[state=closed]:gw-animate-out data-[state=closed]:gw-fade-out-0 data-[state=open]:gw-fade-in-0 data-[state=closed]:gw-zoom-out-95 data-[state=open]:gw-zoom-in-95 data-[state=closed]:gw-slide-out-to-left-1/2 data-[state=closed]:gw-slide-out-to-top-[48%] data-[state=open]:gw-slide-in-from-left-1/2 data-[state=open]:gw-slide-in-from-top-[48%] gw-rounded-2xl",
                className
            )}
            {...props}
        >
            {children}
            <DialogPrimitive.Close className="gw-absolute gw-right-4 gw-top-4 gw-rounded-sm gw-opacity-70 gw-ring-offset-background gw-transition-opacity hover:gw-opacity-100 focus:gw-outline-none focus:gw-ring-2 focus:gw-ring-ring focus:gw-ring-offset-2 disabled:gw-pointer-events-none data-[state=open]:gw-bg-accent data-[state=open]:gw-text-muted-foreground">
                <X className="gw-h-4 gw-w-4" />
                <span className="gw-sr-only">Close</span>
            </DialogPrimitive.Close>
        </DialogPrimitive.Content>
    </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("gw-flex gw-flex-col gw-space-y-1.5 gw-text-center", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn("gw-flex gw-flex-col-reverse sm:gw-flex-row sm:gw-justify-end sm:gw-space-x-2", className)}
        {...props}
    />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
    React.ComponentRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn(
            "gw-typography-subtitle1 !gw-text-lg gw-font-semibold gw-leading-none gw-tracking-tight",
            className
        )}
        {...props}
    />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
    React.ComponentRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        className={cn("gw-typography-body2 gw-text-muted-foreground", className)}
        {...props}
    />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger
};
