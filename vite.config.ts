import react from "@vitejs/plugin-react";
import { basename, resolve } from "path";
import { readFileSync } from "fs";
import { createHash } from "crypto";
import type { Plugin } from "vite";
import { defineConfig, loadEnv } from "vite";
import dts from "vite-plugin-dts";
import { peerDependencies } from "./package.json";

// Vite library mode inlines assets regardless of assetsInlineLimit. Emit the
// widget images and fonts so consumers can cache them independently.
function emittedWidgetAssets(): Plugin {
    return {
        name: "glyph-emitted-widget-assets",
        enforce: "pre",
        load(id) {
            if (!id.includes("/src/assets/images/") || !id.endsWith(".png")) return;
            const reference = this.emitFile({ type: "asset", name: basename(id), source: readFileSync(id) });
            return `export default import.meta.ROLLUP_FILE_URL_${reference};`;
        },
        generateBundle: {
            order: "post",
            handler(_options, bundle) {
                for (const asset of Object.values(bundle)) {
                    if (asset.type !== "asset" || !asset.fileName.endsWith(".css")) continue;
                    asset.source = String(asset.source).replace(
                        /url\(data:font\/woff2;base64,([^)]*)\)/g,
                        (_match, encoded: string) => {
                            const source = Buffer.from(encoded, "base64");
                            const hash = createHash("sha256").update(source).digest("hex").slice(0, 12);
                            const fileName = `assets/font-${hash}.woff2`;
                            this.emitFile({ type: "asset", fileName, source });
                            return `url(./font-${hash}.woff2)`;
                        }
                    );
                }
            }
        }
    };
}

export default ({ mode }: { mode: string }) => {
    // Load app-level env vars to node-level env vars
    const envs = loadEnv(mode, process.cwd());

    const requiredVars = ["VITE_WIDGET_API_BASE_URL", "VITE_PROVIDER_PRIVY_APP_ID", "VITE_DASHBOARD_BASE_URL"];

    // Check for required environment variables
    const missingVars = requiredVars.filter((varName) => {
        const regularVar = envs[varName];

        return !regularVar;
    });

    if (missingVars.length > 0) {
        console.warn("\x1b[33m%s\x1b[0m", "Warning: Missing environment variables:");
        missingVars.forEach((varName) => {
            console.warn(`  - ${varName}`);
        });
    }

    return defineConfig({
        plugins: [
            emittedWidgetAssets(),
            react({
                // Ensure compatibility with both React 18 and 19
                jsxImportSource: "react",
                jsxRuntime: "automatic",
                // Explicitly disable React compiler for library compatibility
                babel: {
                    plugins: []
                }
            }),
            dts({
                // React type paths isolate this build; published imports stay package-relative.
                pathsToAliases: false,
                tsconfigPath: "./tsconfig.app.json",
                outDir: "dist/types",
                entryRoot: "src",
                include: "src",
                afterDiagnostic(diagnostics) {
                    if (diagnostics.some((diagnostic) => diagnostic.category === 1)) {
                        throw new Error(
                            "SDK declaration generation failed; fix TypeScript diagnostics before publishing."
                        );
                    }
                }
            })
        ],
        define: {
            "process.env.DASHBOARD_BASE_URL": JSON.stringify(envs.VITE_DASHBOARD_BASE_URL),
            "process.env.PROVIDER_PRIVY_APP_ID": JSON.stringify(envs.VITE_PROVIDER_PRIVY_APP_ID),
            "process.env.WIDGET_API_BASE_URL": JSON.stringify(envs.VITE_WIDGET_API_BASE_URL)
        },
        build: {
            lib: {
                entry: resolve(__dirname, "src/index.ts"),
                name: "GlyphWidget",
                fileName: (format) => `glyph-widget.${format}.js`,
                formats: ["es", "umd"]
            },
            sourcemap: true,
            rollupOptions: {
                external: [
                    ...Object.keys(peerDependencies).map(
                        (dep) => new RegExp(`^${dep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(/.*)?$`)
                    ),
                    "react/jsx-runtime",
                    "react/jsx-dev-runtime"
                ],
                output: ["es", "umd"].map((format) => ({
                    format,
                    name: "GlyphWidget",
                    inlineDynamicImports: format === "umd",
                    globals: (id) => {
                        // Only peer deps that are actually imported; subpaths mapped via fallback below
                        const baseGlobals: Record<string, string> = {
                            react: "React",
                            "react-dom": "ReactDOM",
                            "react/jsx-runtime": "React",
                            "react/jsx-dev-runtime": "React",
                            wagmi: "Wagmi",
                            viem: "Viem",
                            "@privy-io/react-auth": "PrivyAuth",
                            "@privy-io/wagmi": "PrivyWagmi",
                            "@privy-io/cross-app-connect": "PrivyCrossAppConnector",
                            "@rainbow-me/rainbowkit": "RainbowKit",
                            "@tanstack/react-query": "TanstackReactQuery"
                        };
                        if (baseGlobals[id]) return baseGlobals[id];
                        // Map subpaths (e.g. viem/chains) to parent package's global
                        const sorted = Object.entries(baseGlobals).sort(([a], [b]) => b.length - a.length);
                        for (const [pkg, globalName] of sorted) {
                            if (id.startsWith(pkg + "/")) return globalName;
                        }
                        // Fallback: valid identifier for unknown externals
                        return id.replace(/[^a-zA-Z0-9_]/g, "_");
                    },
                    assetFileNames: "assets/[name].[ext]",
                    chunkFileNames: "[name].js",
                    entryFileNames: "glyph-widget.[format].js"
                }))
            },
            assetsInlineLimit: 0 // Ensure all assets are emitted as files rather than inlined
        }
    });
};
