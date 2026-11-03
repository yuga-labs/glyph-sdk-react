type DemoConfig = {
    APP_ENV: string;
    VITE_DASHBOARD_BASE_URL: string;
    VITE_WIDGET_API_BASE_URL: string;
    VITE_PROVIDER_PRIVY_APP_ID: string;
    VITE_DEMO_PRIVY_APP_ID: string;
    VITE_DEMO_PRIVY_CLIENT_ID: string;
    VITE_DYNAMIC_ENVIRONMENT_ID: string;
};

declare global {
    interface Window { __GLYPH_DEMO_CONFIG__?: DemoConfig }
}

// The image never uses build-time demo values. Vite env is only for local dev.
export function demoConfig(env?: Partial<DemoConfig>) {
    const id = env?.VITE_PROVIDER_PRIVY_APP_ID;
    const url = env?.VITE_WIDGET_API_BASE_URL || env?.VITE_DASHBOARD_BASE_URL;
    const idTenant = id === "clxt9p8e601al6tgmsyhu7j3t" ? "staging" : id === "cly38x0w10ac945q9yg9sm71i" ? "production" : undefined;
    const urlTenant = url === "https://staging.useglyph.io" ? "staging" : url === "https://useglyph.io" ? "production" : undefined;
    const envTenant = env?.APP_ENV ? (env.APP_ENV === "production" ? "production" : "staging") : undefined;
    if (id && !idTenant || env?.APP_ENV && !["development", "staging", "production"].includes(env.APP_ENV) ||
        env?.VITE_WIDGET_API_BASE_URL && env.VITE_DASHBOARD_BASE_URL && env.VITE_WIDGET_API_BASE_URL !== env.VITE_DASHBOARD_BASE_URL ||
        [idTenant, urlTenant, envTenant].filter(Boolean).some((value, _, values) => value !== values[0])) {
        throw new Error("Conflicting demo tenant configuration");
    }
    const tenant = envTenant || idTenant || urlTenant || "staging";
    const glyphUrl = url || (tenant === "staging" ? "https://staging.useglyph.io" : "https://useglyph.io");
    const config = window.__GLYPH_DEMO_CONFIG__ ?? (env ? {
        APP_ENV: env.APP_ENV || tenant,
        VITE_DASHBOARD_BASE_URL: glyphUrl,
        VITE_WIDGET_API_BASE_URL: glyphUrl,
        VITE_PROVIDER_PRIVY_APP_ID: id || (tenant === "staging" ? "clxt9p8e601al6tgmsyhu7j3t" : "cly38x0w10ac945q9yg9sm71i"),
        VITE_DEMO_PRIVY_APP_ID: env.VITE_DEMO_PRIVY_APP_ID || "",
        VITE_DEMO_PRIVY_CLIENT_ID: env.VITE_DEMO_PRIVY_CLIENT_ID || "",
        VITE_DYNAMIC_ENVIRONMENT_ID: env.VITE_DYNAMIC_ENVIRONMENT_ID || ""
    } : undefined);
    if (!config) throw new Error("Missing demo runtime configuration");
    return { ...config, glyphUrl: config.VITE_WIDGET_API_BASE_URL, useStagingTenant: config.APP_ENV !== "production" };
}
