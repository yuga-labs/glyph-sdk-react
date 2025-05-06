Using the Widget
Setup
To use the widget, you need to set up access to Glyph users through Privy's cross-app ecosystem and configure wagmi for EIP1193 wallets.

Accessing Glyph Users through Privy

1. Install the Privy SDK:

```sh
npm install @privy-io/privy-sdk
```

2. Initialize the Privy client in your application:

```js
import { PrivyClient } from "@privy-io/privy-sdk";

const privy = new PrivyClient({
    apiKey: "YOUR_PRIVY_API_KEY",
    appId: "YOUR_APP_ID"
});
```

Use the Priv client to access Glyph users:

```js
const user = await privy.getUser("USER_ID");
console.log(user);
```

1. Setting up wagmi for EIP1193 Wallets

Install wagmi and ethers:

```sh
npm install wagmi ethers
```

2. Configure wagmi in your application:

```js
import { createClient, configureChains, defaultChains } from "wagmi";
import { publicProvider } from "wagmi/providers/public";

const { chains, provider } = configureChains(defaultChains, [publicProvider()]);

const client = createClient({
    autoConnect: true,
    provider
});
```

3. Use wagmi hooks to interact with wallets:

```js
import { useAccount, useConnect, useDisconnect } from "wagmi";

function Wallet() {
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();

    if (isConnected) {
        return (
            <div>
                <div>Connected to {address}</div>
                <button onClick={() => disconnect()}>Disconnect</button>
            </div>
        );
    }

    return (
        <div>
            {connectors.map((connector) => (
                <button key={connector.id} onClick={() => connect(connector)}>
                    Connect with {connector.name}
                </button>
            ))}
        </div>
    );
}
```

## Using with Next.js

When using this widget in a Next.js application, you may encounter the following error in the console:

```
URL scheme "webpack-internal" is not supported.
```

This happens because Next.js uses webpack for bundling, while this widget is built with Vite, and they handle asset URLs differently.

### Solution

1. Make sure you're using the latest version of the widget which includes fixes for Next.js compatibility.

2. If you're still experiencing the issue, create a `next.config.js` file in your project root (or modify your existing one) to properly handle the widget's assets:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        // This helps resolve the "URL scheme webpack-internal is not supported" error
        config.module.rules.push({
            test: /\.(woff2|jpg|jpeg|png|svg|webp)$/,
            type: "asset/resource"
        });

        return config;
    }
};

module.exports = nextConfig;
```

3. Import the CSS file explicitly in your Next.js application:

```jsx
// In your _app.js or layout.js
import "@yuga-labs/glyph-sdk-react/style.css";
```

4. If you're using Next.js App Router, you may need to add the following to your `app/layout.js` file:

```jsx
export const metadata = {
    // your existing metadata
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                {/* Add this line to ensure fonts are loaded correctly */}
                <link
                    href="/assets/Gramatika-Regular.woff2"
                    rel="preload"
                    as="font"
                    type="font/woff2"
                    crossOrigin="anonymous"
                />
            </head>
            <body>{children}</body>
        </html>
    );
}
```

5. Copy the font files from `node_modules/@yuga-labs/glyph-sdk-react/dist/assets/` to your `public/assets/` directory to ensure they're available at runtime.

By following these steps, you can set up the widget to access Glyph users through Privy's cross-app ecosystem and configure wagmi for EIP1193 wallets.
