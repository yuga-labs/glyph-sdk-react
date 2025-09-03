import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig, loadEnv } from "vite";
import dts from "vite-plugin-dts";
import { peerDependencies } from "./package.json";

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
                tsconfigPath: "./tsconfig.app.json",
                outDir: "dist/types",
                entryRoot: "src",
                include: "src"
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
                    ...Object.keys(peerDependencies),
                    "react/jsx-runtime",
                    "react/jsx-dev-runtime"
                ],
                output: {
                    globals: {
                        react: "React",
                        "react-dom": "ReactDOM",
                        "react/jsx-runtime": "React",
                        "react/jsx-dev-runtime": "React",
                        wagmi: "Wagmi",
                        "@privy-io/react-auth": "PrivyAuth",
                        viem: "Viem",
                        "@privy-io/cross-app-connect": "PrivyCrossAppConnector",
                        "@privy-io/wagmi": "PrivyWagmi",
                        "@tanstack/react-query": "TanstackReactQuery"
                    },
                    assetFileNames: "assets/[name].[ext]",
                    chunkFileNames: "[name].js",
                    entryFileNames: "glyph-widget.[format].js"
                }
            },
            assetsInlineLimit: 0 // Ensure all assets are emitted as files rather than inlined
        }
    });
};
