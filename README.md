# Glyph Widget (React SDK)

See it in action 🚀: [https://demo.useglyph.io](https://demo.useglyph.io)

Dashboard ⚙️: [https://useglyph.io/](https://useglyph.io/)

Documentation 📝: [https://docs.useglyph.io/](https://docs.useglyph.io/)

## Wallet compatibility (2.2.0)

Tested with wagmi `2.19.5`, viem `2.57.5`, RainbowKit `2.2.11`,
Privy React `3.48.1`, Privy wagmi `4.0.19`, and Relay SDK `3.2.0`.
Keep the app's Relay version aligned when passing `RelayChain` values to Glyph.
Privy uses nested viem `2.56.5`; do not force a global viem override.

React 18 and 19 are supported. ConnectKit `1.9.2` requires React 18.
Dynamic's Glyph connector `4.5.0` requires cross-app-connect `0.2.3`;
other tested adapters use cross-app-connect `0.7.3`.
Do not force those separate adapter generations onto one version.

See the integration-specific installation commands in the documentation.
The examples cover native, Privy, RainbowKit, ConnectKit, cross-app, and Dynamic integrations.
User login and wallet confirmation remain required; installing this SDK does not
grant an agent permission to sign or send transactions.

## Dependency security

Wallet peers remain external to the SDK bundle. Compatibility is not a clean-audit
guarantee. Audit the consuming application's resolved dependency graph, including
its wallet adapters. Overrides in the SDK source workspace do not propagate to
consuming applications. See the [security policy and guidance](https://github.com/yuga-labs/glyph-sdk-react/blob/main/SECURITY.md).
Legacy Dynamic/Solana dependencies still include an unpatched `bigint-buffer`
advisory; track its upstream replacement before enabling affected server-side code.

## SDK diagnostics

SDK debug and informational logs are disabled by default. Warnings and errors remain visible.
Import `setGlyphDebugLogging` from `@use-glyph/sdk-react` and call it with `true` for temporary diagnostics.
Call it with `false` to disable diagnostics again. Third-party wallet logging is separate.
Authentication logs never contain signatures, tokens, nonces, or raw provider errors.

## Wallet sign-in and recovery

For the EIP1193 strategy, `useGlyph()` exposes `signIn(): Promise<boolean>`,
`needsSignature`, and `authError`. Existing `login()` uses the same sign-in path.
Call `signIn()` directly from a fresh click; do not await a fetch first. It returns
`false` if message preparation is pending, a popup needs activation, or sign-in
fails. Wait for `ready`, then offer another click. `askForSignature={false}` prepares
only; it never automatically signs. A rejected or blocked attempt never starts an
automatic signing retry loop.

`onAuthError` receives only a static reason (`popup_blocked`, `rejected`,
`verify_failed`, or `network`), message and optional `retryAt`. No alert or raw
provider error is exposed. A 429 blocks authentication requests and signing until
`Retry-After`; missing headers use bounded backoff. A current credential's 401
clears that session and prepares a message for manual retry. A 403 does not log out,
and late old responses cannot revoke replacement credentials.

Persistence binds the wallet, API origin and connector family (`id`, `type`).
Recreating wagmi configuration on reload can restore that scoped credential without
another signature. Live callbacks also bind the connector instance (`uid`): a
committed live scope change revokes old callbacks, forgets the old record and
requires sign-in. Normal unmount and StrictMode replay retain persistence; explicit
logout and external disconnect clear it. Restored credentials still face server
session checks. Legacy unbound token/nonce records are cleared, so an existing user
may need one new sign-in; the SDK does not guess their wallet or origin binding.

Privy retains its existing login and wallet-selection behavior. Its `signIn()`
returns `true` when the login call completes, which does not guarantee an EVM wallet
or Glyph authentication. Check `authenticated` for wallet/API readiness. Privy
reports `needsSignature: false` and `authError: null`.
