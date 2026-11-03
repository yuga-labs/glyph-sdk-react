// Public demo values only. Resolved once when the local server starts.
const STAGING_ID = 'clxt9p8e601al6tgmsyhu7j3t';
const PRODUCTION_ID = 'cly38x0w10ac945q9yg9sm71i';

function runtimeConfig(env) {
    const appEnv = env.APP_ENV || env.VITE_APP_ENV;
    const id = env.VITE_PROVIDER_PRIVY_APP_ID;
    const urls = [env.VITE_WIDGET_API_BASE_URL, env.VITE_DASHBOARD_BASE_URL].filter(Boolean);
    if (urls.length === 2 && urls[0] !== urls[1]) throw new Error('Glyph API and dashboard URLs must match');
    if (appEnv && !['development', 'staging', 'production'].includes(appEnv)) throw new Error('Invalid demo environment');
    if (id && id !== STAGING_ID && id !== PRODUCTION_ID) throw new Error('Invalid Privy tenant');
    const url = urls[0];
    const urlTenant = url === 'https://staging.useglyph.io' ? 'staging' : url === 'https://useglyph.io' ? 'production' : undefined;
    const envTenant = appEnv ? (appEnv === 'production' ? 'production' : 'staging') : undefined;
    const idTenant = id ? (id === STAGING_ID ? 'staging' : 'production') : undefined;
    const tenants = [envTenant, idTenant, urlTenant].filter(Boolean);
    if (tenants.some((tenant) => tenant !== tenants[0])) throw new Error('Conflicting demo tenant configuration');
    const tenant = tenants[0] || 'staging';
    const glyphUrl = url || (tenant === 'staging' ? 'https://staging.useglyph.io' : 'https://useglyph.io');
    return {
        APP_ENV: appEnv || tenant,
        VITE_DASHBOARD_BASE_URL: glyphUrl,
        VITE_WIDGET_API_BASE_URL: glyphUrl,
        VITE_PROVIDER_PRIVY_APP_ID: id || (tenant === 'staging' ? STAGING_ID : PRODUCTION_ID),
        VITE_DEMO_PRIVY_APP_ID: env.VITE_DEMO_PRIVY_APP_ID || '',
        VITE_DEMO_PRIVY_CLIENT_ID: env.VITE_DEMO_PRIVY_CLIENT_ID || '',
        VITE_DYNAMIC_ENVIRONMENT_ID: env.VITE_DYNAMIC_ENVIRONMENT_ID || ''
    };
}

function runtimeScript(env) {
    const json = JSON.stringify(runtimeConfig(env)).replace(/[<>&\u2028\u2029]/g, (character) =>
        `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
    return `window.__GLYPH_DEMO_CONFIG__=${json};\n`;
}

function runtimeMiddleware(env) {
    const script = runtimeScript(env);
    return (req, res, next) => {
        if (req.url?.split('?')[0] !== '/runtime-config') return next();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(script);
    };
}
module.exports = { runtimeConfig, runtimeScript, runtimeMiddleware };
