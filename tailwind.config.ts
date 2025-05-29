import tailwindScrollbar from "tailwind-scrollbar";
import type { Config } from "tailwindcss";
import tailwindAnimation from "tailwindcss-animate";

/**
 * Returns a list of fallback fonts
 * @param fontVar - The font variable to use as the first fallback
 */
function withFallbackFonts(fontVar: string) {
    return [
        fontVar,
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "Roboto",
        "Helvetica",
        "Arial",
        "sans-serif",
        "Apple Color Emoji",
        "Segoe UI Emoji",
        "Segoe UI Symbol"
    ];
}

export default {
    darkMode: ["class"],
    prefix: "gw-", // This is the prefix for the tailwind classes. If you change this, you need to change the prefix in the components.json file and update the tailwindMerge config in the utils.ts file.
    content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
    theme: {
        extend: {
            spacing: {
                "25": "6.25rem",
                "85": "21.25rem",
                "135": "33.75rem",
                "140": "35rem"
            },
            backgroundImage: {
                "success-gradient":
                    "linear-gradient(0deg, #FAFAFA, #FAFAFA), linear-gradient(180deg, rgba(85, 245, 138, 0.05) 0%, rgba(255, 255, 255, 0.5) 92.17%)",
                "wallet-gradient": "linear-gradient(to bottom, rgb(246, 237, 226, 0.2), rgb(55, 101, 71, 0.2))"
            },
            colors: {
                brand: {
                    earth: "hsl(var(--gw-brand-earth))",
                    grass: {
                        DEFAULT: "hsl(var(--gw-brand-grass))",
                        light: "hsl(var(--gw-brand-grass-light))",
                        dark: "hsl(var(--gw-brand-grass-dark))"
                    },
                    forest: "hsl(var(--gw-brand-forest))",
                    "deep-moss": {
                        DEFAULT: "hsl(var(--gw-brand-deep-moss))",
                        light: "hsl(var(--gw-brand-deep-moss-light))",
                        dark: "hsl(var(--gw-brand-deep-moss-dark))"
                    },
                    bone: "hsl(var(--gw-brand-bone))",
                    clay: "hsl(var(--gw-brand-clay))",
                    black: "hsl(var(--gw-brand-black))",
                    white: "hsl(var(--gw-brand-white))",
                    gray: {
                        "500": "hsl(var(--gw-brand-gray-500))",
                        "600": "hsl(var(--gw-brand-gray-600))",
                        "700": "hsl(var(--gw-brand-gray-700))",
                        "800": "hsl(var(--gw-brand-gray-800))",
                        "900": "hsl(var(--gw-brand-gray-900))",
                        black: "hsl(var(--gw-brand-gray-black))"
                    },
                    success: "hsl(var(--gw-brand-success))",
                    warning: "hsl(var(--gw-brand-warning))",

                    failure: "hsl(var(--gw-brand-failure))"
                },
                background: "hsl(var(--gw-background))",
                foreground: "hsl(var(--gw-foreground))",
                card: {
                    DEFAULT: "hsl(var(--gw-card))",
                    foreground: "hsl(var(--gw-card-foreground))"
                },
                popover: {
                    DEFAULT: "hsl(var(--gw-popover))",
                    foreground: "hsl(var(--gw-popover-foreground))"
                },
                primary: {
                    DEFAULT: "hsl(var(--gw-primary))",
                    foreground: "hsl(var(--gw-primary-foreground))"
                },
                secondary: {
                    DEFAULT: "hsl(var(--gw-secondary))",
                    light: "hsl(var(--gw-brand-grass-light))",
                    dark: "hsl(var(--gw-brand-grass-dark))",
                    foreground: "hsl(var(--gw-secondary-foreground))"
                },
                muted: {
                    DEFAULT: "hsl(var(--gw-muted))",
                    foreground: "hsl(var(--gw-muted-foreground))"
                },
                accent: {
                    DEFAULT: "hsl(var(--gw-accent))",
                    foreground: "hsl(var(--gw-accent-foreground))"
                },
                destructive: {
                    DEFAULT: "hsl(var(--gw-destructive))",
                    foreground: "hsl(var(--gw-destructive-foreground))"
                },
                border: "hsl(var(--gw-border))",
                input: "hsl(var(--gw-input))",
                ring: "hsl(var(--gw-ring))",
                chart: {
                    "1": "hsl(var(--gw-chart-1))",
                    "2": "hsl(var(--gw-chart-2))",
                    "3": "hsl(var(--gw-chart-3))",
                    "4": "hsl(var(--gw-chart-4))",
                    "5": "hsl(var(--gw-chart-5))"
                }
            },
            boxShadow: {
                buttonSm: "0px 2px 3px 0px hsla(0, 0%, 0%, 0.1)",
                buttonLg: "0px 6px 32px 0px hsla(0, 0%, 0%, 0.1)",
                buttonMd: "0px 1px 10px 0px rgba(0, 0, 0, 0.12), 0px 1px 1px 0px rgba(0, 0, 0, 0.25)",
                inputFocus: "0px 1px 2px 0px rgba(0, 0, 0, 0.08), 0px 1px 24px 0px rgba(0, 0, 0, 0.15)"
            },
            dropShadow: {
                buttonLg: ["0px 2px 1px hsla(0, 0%, 0%, 0.1)", "0px 3px 4px hsla(0, 0%, 0%, 0.1)"]
            },
            fontSize: {
                "4.375rem": "4.375rem",
                "2.5rem": "2.5rem",
                "2rem": "2rem",
                "1.75rem": "1.75rem"
            },
            fontFamily: {
                display: withFallbackFonts("var(--font-gramatika)"),
                secondary: withFallbackFonts("var(--font-gramatika)")
            },
            borderRadius: {
                lg: "var(--gw-radius)",
                md: "calc(var(--gw-radius) - 2px)",
                sm: "calc(var(--gw-radius) - 4px)",
                "4xl": "1.75rem"
            },
            transitionDelay: {
                "600": "600ms"
            },
            keyframes: {
                "accordion-down": {
                    from: {
                        height: "0"
                    },
                    to: {
                        height: "var(--radix-accordion-content-height)"
                    }
                },
                "accordion-up": {
                    from: {
                        height: "var(--radix-accordion-content-height)"
                    },
                    to: {
                        height: "0"
                    }
                }
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out"
            }
        }
    },
    plugins: [tailwindAnimation, tailwindScrollbar({ nocompatible: true, preferredStrategy: "pseudoelements" })]
} satisfies Config;
