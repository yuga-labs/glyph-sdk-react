/** SDK diagnostics are off by default, including development and SSR. */
let debugLogging = false;

/** Enable SDK debug diagnostics explicitly. Warnings and errors remain enabled. */
export function setGlyphDebugLogging(enabled: boolean): void {
    debugLogging = enabled === true;
}

export const createLogger = (namespace: string) => {
    const name = `[GlyphWidget/${namespace}]`;
    return {
        debug: (...args: unknown[]) => {
            if (debugLogging) console.debug(name, ...args);
        },
        log: (...args: unknown[]) => {
            if (debugLogging) console.log(name, ...args);
        },
        warn: (...args: unknown[]) => {
            console.warn(name, ...args);
        },
        error: (...args: unknown[]) => {
            console.error(name, ...args);
        }
    };
};
