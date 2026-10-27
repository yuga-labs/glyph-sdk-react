# Public source workspace

This repository contains the SDK at its root and six local examples. Use Node
22.12 or newer and pnpm 9.9.0. Run `pnpm install --frozen-lockfile
--strict-peer-dependencies`, `pnpm typecheck`, and `pnpm build:all`.
Examples use the root SDK through `workspace:*`; no published SDK is required.
Copy `.env.example` locally and supply your own public application configuration.
Templates contain placeholders, not working credentials.

The committed lock preserves the tested source workspace's per-consumer React,
Query, Privy, wagmi, viem, Relay and WalletConnect resolutions. ConnectKit uses
React 18; other examples use React 19. Dynamic retains its separate cross-app
connector version. The root package's 14 pnpm overrides are an explicit source
workspace compatibility/security policy, including WalletConnect 2.26.0. They
are not an npm consumer policy and do not change the SDK's published peer ranges.
Do not add a global viem override or deduplicate consumer-specific peer contexts.

The private source-of-truth exporter projects only this public layout's reachable
lock records. Releases verify the committed snapshot and use frozen installation;
they never resolve a fresh dependency graph. Dependency maintenance requires a
reviewed snapshot, strict installation and library/all-six-example builds.
See SECURITY.md for remaining advisory limits. Source builds and npm consumers
have different dependency scopes; a passing source build is not a clean-audit claim.
