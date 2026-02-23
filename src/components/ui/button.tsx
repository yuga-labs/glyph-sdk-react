import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

const buttonVariantsClasses = cva(
    "gw-inline-flex gw-font-display gw-items-center gw-justify-center gw-ease-in-out gw-gap-2 gw-whitespace-nowrap gw-rounded-full gw-font-medium gw-ring-offset-background gw-transition focus-visible:gw-outline-none focus-visible:gw-ring-2 focus-visible:gw-ring-ring focus-visible:gw-ring-offset-2 disabled:gw-pointer-events-none disabled:gw-opacity-50 [&_svg]:gw-pointer-events-none [&_svg]:gw-size-4 [&_svg]:gw-shrink-0",
    {
        variants: {
            variant: {
                default:
                    "gw-bg-secondary/90 hover:gw-bg-secondary-light/90 active:gw-bg-secondary-dark/90 gw-text-secondary-foreground" +
                    " " +
                    "gw-backdrop-blur-sm gw-border gw-border-border/10 gw-shadow-liquidSmButton",
                destructive:
                    "gw-bg-destructive/90 gw-text-destructive-foreground" +
                    " " +
                    "gw-backdrop-blur-sm gw-border gw-border-border/10 gw-shadow-liquidSmButton",
                secondary:
                    "gw-bg-foreground/80 hover:gw-bg-foreground/90 active:gw-bg-foreground/80 gw-text-background" +
                    " " +
                    "gw-backdrop-blur-sm gw-border gw-border-border/10 gw-shadow-liquidSmButton",
                outline:
                    "gw-border gw-border-muted gw-bg-background/90 gw-text-foreground active:gw-bg-brand-clay" +
                    " " +
                    "gw-backdrop-blur-sm gw-border gw-border-border/10 gw-shadow-liquidSmButton",
                tertiary:
                    "gw-bg-brand-deep-moss/90 hover:gw-bg-brand-deep-moss-light/90 active:gw-bg-brand-deep-moss-dark/90 gw-text-background" +
                    " " +
                    "gw-backdrop-blur-sm gw-border gw-border-border/10 gw-shadow-liquidSmButton",
                ghost:
                    "gw-text-primary hover:gw-bg-accent/90 hover:gw-text-accent-foreground" +
                    " " +
                    "hover:gw-backdrop-blur-sm gw-border gw-border-transparent hover:gw-border-border/10 hover:gw-shadow-liquidSmButton",
                link: "gw-text-secondary hover:gw-text-secondary-light active:gw-text-secondary-dark gw-underline-offset-4 hover:gw-underline",
                "link-inline":
                    "gw-text-secondary hover:gw-text-secondary-light active:gw-text-secondary-dark gw-underline-offset-4 gw-underline",
                cube: "gw-bg-brand-white gw-text-brand-gray-black [&_svg]:gw-text-secondary [&_svg]:hover:gw-text-secondary-light [&_svg]:active:gw-text-secondary-dark",
                liquidGlass:
                    "gw-bg-brand-white/40 gw-backdrop-blur-sm gw-border gw-border-border/10 gw-shadow-liquidSmButton"
            },
            size: {
                default: "gw-h-12 gw-px-4 gw-py-3 gw-typography-body1",
                xs: "gw-h-7 gw-px-2 gw-typography-body2",
                "xs-inline": "gw-h-7 gw-px-1 gw-typography-body2",
                sm: "gw-h-10 gw-px-3 gw-typography-body1",
                lg: "gw-h-14 gw-px-8 gw-typography-body1",
                icon: "gw-h-12 gw-w-10 gw-typography-body1",
                login: "gw-h-12 gw-p-2.5 gw-pr-6 gw-typography-body1 !gw-font-normal",
                cube: "gw-p-2 gw-h-16 gw-aspect-square !gw-rounded-xl gw-typography-body2 [&_svg]:!gw-size-5"
            },
            shadow: {
                true: "gw-drop-shadow-buttonLg hover:gw-drop-shadow-lg active:gw-drop-shadow-md"
            },
            scale: {
                true: "gw-scale-100 hover:gw-scale-[1.02]"
            }
        },
        defaultVariants: {
            variant: "default",
            size: "default",
            shadow: false,
            scale: false
        }
    }
);

export interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariantsClasses> {
    asChild?: boolean;
    shadow?: boolean;
    scale?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, shadow, scale, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariantsClasses({ variant, size, className, shadow, scale }))}
                ref={ref}
                {...props}
            />
        );
    }
);

export { Button, buttonVariantsClasses as buttonVariants };
