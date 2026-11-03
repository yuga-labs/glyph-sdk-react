import { loadEnv, type Plugin } from 'vite';
import { createRequire } from 'node:module';

// Keep CommonJS evaluation in Node when Vite's module runner loads a config.
const { runtimeMiddleware } = createRequire(import.meta.url)('./runtime-config-server.cjs');

export function runtimeConfigPlugin(): Plugin {
    return {
        name: 'glyph-demo-runtime-config',
        configureServer(server) {
            server.middlewares.use(runtimeMiddleware({ ...loadEnv(server.config.mode, server.config.envDir, ''), ...process.env }));
        },
        configurePreviewServer(server) {
            server.middlewares.use(runtimeMiddleware({ ...loadEnv(server.config.mode, server.config.envDir, ''), ...process.env }));
        }
    };
}
