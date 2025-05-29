import react from "@vitejs/plugin-react";
import { defineConfig, ViteDevServer } from "vite";

export function pluginWatchNodeModules(modules: string[]) {
	// Merge module into pipe separated string for RegExp() below.
	const pattern = `/node_modules\\/(?!${modules.join("|")}).*/`;
	return {
		name: "watch-node-modules",
		configureServer: (server: ViteDevServer): void => {
			server.watcher.options = {
				...server.watcher.options,
				ignored: [new RegExp(pattern), "**/.git/**"],
			};
		},
	};
}

// https://vite.dev/config/
export default defineConfig(({ command }) => {
	const isDev = command !== "build";

	return {
		base: "/privy",
		plugins: [react(), pluginWatchNodeModules(["@use-glyph/sdk-react"])],
		optimizeDeps: {
			exclude: ["@use-glyph/sdk-react"],
		},
		// Dev server config only used in development
		...(isDev
			? {
					server: {
						port: 3003,
						hmr: {
							overlay: true,
						},
						allowedHosts: true,
					},
				}
			: {}),
		resolve: {
			alias: {
				"@use-glyph/sdk-react/*": "../../lib/*",
			},
		},
		root: ".",
		publicDir: "public",
		build: {
			outDir: "dist",
			emptyOutDir: true,
			copyPublicDir: true,
			assetsDir: "assets",
		},
	};
});
