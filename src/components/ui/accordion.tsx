import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";
import { cn } from "../../lib/utils";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = forwardRef<
    ElementRef<typeof AccordionPrimitive.Item>,
    ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => <AccordionPrimitive.Item ref={ref} className={cn(className)} {...props} />);

const AccordionTrigger = forwardRef<
    ElementRef<typeof AccordionPrimitive.Trigger>,
    ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Header className="gw-flex">
        <AccordionPrimitive.Trigger
            ref={ref}
            className={cn("gw-flex gw-flex-1 gw-items-center gw-justify-between gw-py-3 gw-transition-all", className)}
            {...props}
        >
            {children}
        </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
));

const AccordionContent = forwardRef<
    ElementRef<typeof AccordionPrimitive.Content>,
    ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Content
        ref={ref}
        className="gw-overflow-hidden gw-text-sm gw-transition-all data-[state=closed]:gw-animate-accordion-up data-[state=open]:gw-animate-accordion-down"
        {...props}
    >
        <div className={cn("gw-pb-2 gw-pt-0", className)}>{children}</div>
    </AccordionPrimitive.Content>
));

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
