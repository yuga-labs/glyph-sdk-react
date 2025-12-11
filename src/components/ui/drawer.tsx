import react, {
    ComponentProps,
    ComponentPropsWithoutRef,
    ComponentRef,
    forwardRef,
    HTMLAttributes,
    PropsWithChildren
} from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "../../lib/utils";

const Drawer = ({
    shouldScaleBackground = false,
    repositionInputs = false,
    ...props
}: ComponentProps<typeof DrawerPrimitive.Root>) => (
    <DrawerPrimitive.Root
        shouldScaleBackground={shouldScaleBackground}
        repositionInputs={repositionInputs}
        {...props}
    />
);

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal: react.FC<PropsWithChildren> = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerHandle = DrawerPrimitive.Handle;

const DrawerOverlay = forwardRef<
    ComponentRef<typeof DrawerPrimitive.Overlay>,
    ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DrawerPrimitive.Overlay
        ref={ref}
        className={cn("gw-fixed gw-inset-0 gw-z-50 gw-backdrop-blur-sm gw-bg-black/50", className)}
        {...props}
    />
));

const DrawerContent = forwardRef<
    ComponentRef<typeof DrawerPrimitive.Content>,
    ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & {
        childrenWrapperClassName?: string;
    }
>(({ className, children, childrenWrapperClassName, ...props }, ref) => (
    <DrawerPortal>
        <DrawerOverlay />
        <DrawerPrimitive.Content
            ref={ref}
            className={cn(
                "gw-fixed gw-left-0 gw-right-0 gw-bottom-0 gw-z-50 gw-flex gw-max-h-[82vh] gw-flex-col gw-rounded-t-3xl gw-bg-popover gw-text-popover-foreground gw-shadow-md",
                className
            )}
            {...props}
        >
            <div
                className={cn(
                    "gw-w-full gw-mx-auto gw-overflow-auto gw-rounded-t-3xl gw-pt-2",
                    childrenWrapperClassName
                )}
            >
                {children}
            </div>
        </DrawerPrimitive.Content>
    </DrawerPortal>
));

const DrawerHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("gw-grid gw-gap-1.5 gw-p-4 gw-text-center sm:gw-text-left", className)} {...props} />
);

const DrawerFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("gw-mt-auto gw-flex gw-flex-col gw-gap-2 gw-p-4", className)} {...props} />
);

const DrawerTitle = forwardRef<
    ComponentRef<typeof DrawerPrimitive.Title>,
    ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DrawerPrimitive.Title
        ref={ref}
        className={cn("gw-text-lg gw-font-semibold gw-leading-none gw-tracking-tight", className)}
        {...props}
    />
));

const DrawerDescription = forwardRef<
    ComponentRef<typeof DrawerPrimitive.Description>,
    ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DrawerPrimitive.Description
        ref={ref}
        className={cn("gw-text-sm gw-text-muted-foreground", className)}
        {...props}
    />
));

export {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHandle,
    DrawerHeader,
    DrawerOverlay,
    DrawerPortal,
    DrawerTitle,
    DrawerTrigger
};
