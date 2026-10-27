# Compatible security resolutions

Reviewed on 2026-10-27 (UTC), using Node `24.22.1` and pnpm `9.9.0`.
This review covers the SDK development workspace and its examples, not every
consumer installation. It does not approve publication or claim a clean audit.

## Selected changes

Package declarations, peer ranges, existing overrides, and wallet package versions
are unchanged. These resolutions remain inside their installed parents' ranges:

| Consumer | Resolution | Reason |
| --- | --- | --- |
| Express `5.2.1` → router `2.2.0` | path-to-regexp `8.3.0` → `8.4.0`, allowed by `^8.0.0` | Bound optional-route expansion. |
| Express `5.2.1` | body-parser `2.2.2` → `2.4.0`, allowed by `^2.2.1` | Detach completed decompression streams safely. |
| vite-plugin-dts `4.5.4` | API Extractor `7.55.2` → `7.58.1`, allowed by `^7.50.1` | Adopt minimatch `10.2.3` and lodash `4.18.1`. |
| Existing Coinbase/Solana/borsh consumers | bn.js `5.2.2` → `5.2.3`, allowed by their existing major-5 ranges | Preserve a valid zero after `maskn(0)`. |

API Extractor's old exact minimatch pin and lodash `~4.17.15` range prevent a
leaf-only refresh. Its compatible parent update also changes its RushStack/model
helpers and required parser dependencies. The root TypeScript stays `5.9.3`;
the extractor now uses that version instead of its separate `5.8.2`.
This deliberately avoids API Extractor `7.60.0`, which uses TypeScript `6.0.3`.

The lock changes add 21 package records and remove 18 unreachable records.
No surviving package metadata changes. Seven surviving snapshots change only
their bn.js, body-parser, path-to-regexp, or API Extractor dependency edge.
All importer records and wallet peer contexts remain unchanged.
Primary npm registry integrity records match all 21 additions; the frozen strict
install accepts the resulting lock. No new override is required.

## Advisories and applicability

| Advisory | Affected installed version | Patched floor and exposure condition |
| --- | --- | --- |
| [minimatch repeated wildcards](https://github.com/advisories/GHSA-3ppc-4f35-3m26) | `10.0.3`; affected `>=10.0.0 <10.2.1` | `10.2.1`; untrusted glob patterns can backtrack excessively. |
| [minimatch globstars](https://github.com/advisories/GHSA-7r86-cg39-jmmj), [nested extglobs](https://github.com/advisories/GHSA-23c5-xmqv-rm74) | `10.0.3`; affected `>=10.0.0 <10.2.3` | `10.2.3`; adversarial patterns and nonmatching input can exhaust CPU. |
| [lodash template imports](https://github.com/advisories/GHSA-r5fr-rjxr-66jc) | `4.17.23`; affected `>=4.0.0 <=4.17.23` | `4.18.0`; untrusted template import names or prototype pollution can inject code. |
| [path-to-regexp optional groups](https://github.com/advisories/GHSA-j3q9-mxjg-w52f) | `8.3.0`; affected `>=8.0.0 <8.4.0` | `8.4.0`; route definitions with many optional groups cause excessive expansion. |
| [body-parser decompression](https://github.com/advisories/GHSA-27r3-jxmh-p828) | `2.2.2`; affected `>=2.0.0 <2.4.0` | `2.4.0`; trailing compressed bytes can trigger an uncaught decoder error. |
| [bn.js zero-bit mask](https://github.com/advisories/GHSA-378v-28hj-76wf) | `5.2.2`; affected `>=5.0.0 <5.2.3` | `5.2.3`; `maskn(0)` corrupts state and later operations can loop indefinitely. |

The minimatch/lodash paths are declaration-build tooling, not first-party browser
handlers. No first-party use of untrusted glob patterns or lodash templates was
found. `examples/server.js` has fixed routes and no JSON/urlencoded body parser.
The release Docker image runs Nginx and removes that optional Express entrypoint,
although it still copies dependency files. A development classification is not
proof that a package is absent from the image or safe in another deployment.

## Audit scope and remaining risk

Baseline and candidate snapshots use the same pnpm version, complete workspace,
and commands, before and after the compatible resolutions above. Counts are
affected findings across versions, not unique vulnerabilities or packages.
Registry results can change after the review date.

| Command | Baseline high / moderate / low | Candidate high / moderate / low |
| --- | --- | --- |
| `pnpm audit --json` | 11 / 16 / 4 | 5 / 11 / 3 |
| `pnpm audit --prod --json` | 5 / 7 / 1 | 5 / 6 / 1 |

The production-only audit includes all examples' runtime dependencies. It excludes
root development dependencies such as Express, even though that package can be
used by the optional example server. It is not an audit of an npm consumer's graph.

Two high-severity advisory families remain:

- [bigint-buffer](https://github.com/advisories/GHSA-3gc7-fjrx-p6mg) `1.1.5`,
  affected `<=1.1.5`, has no published fix. The Dynamic example reaches it through
  Dynamic Ethereum/WaaS → Solana Core → SPL Token `0.4.12` → buffer-layout-utils
  `0.2.0`. The advisory concerns native `toBigIntLE()` handling of a supplied
  buffer. Its browser mapping uses JavaScript, but that is not a remediation or
  proof about every Node consumer. Do not substitute a wallet major silently.
- [Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), affected `<4.6.6`,
  remains at `3.22.4`, `3.25.76`, `4.0.5`, and `4.3.5`. Oversized failing
  collections can accumulate enough validation issues to exhaust memory.
  Dynamic wallet-book pins `4.0.5`; Reown pins Zod 3; abitype accepts
  `^3.22.0 || ^4.0.0`. A global Zod 4 override would cross incompatible contracts,
  not provide a verified Zod 3 patch. A consumer-scoped Zod 4 refresh needs its own
  parse/input/output and wallet qualification. No first-party Zod parser was found
  here; dependency parsers and externally supplied provider data remain relevant.

Other unresolved findings include stream-json `1.9.1` through Jayson/Solana,
MetaMask SDK/communication-layer, qs, Ajv 6, fast-copy, @humanfs/node, Babel, and
postcss-selector-parser. Their ranges and migration work remain separate.
No advisory is ignored or marked fixed because a path was not observed at runtime.

## Built SDK, peers, and publication

The SDK bundles Relay `3.2.0`; its first-party browser use and public `RelayChain`
type still require server/client compatibility. Relay is not upgraded here.
Inspection of all five existing library source maps found no actual source modules
for Zod, bigint-buffer, minimatch, lodash, path-to-regexp, or body-parser. A Zod
version in a pnpm peer-context directory name is not a bundled Zod module.
This is artifact evidence, not a proof that dependency paths are unreachable.

React, viem, wagmi, Privy, RainbowKit, and other declared peers remain external.
Consumers resolve those dependencies and their transitive parsers themselves.
Workspace overrides and this pnpm lock do not propagate to npm consumers or the
public source mirror. The registry's existing published SDK `2.1.12` also differs
from this candidate `2.2.0`; this patch does not retroactively fix that package.
Public publication remains subject to explicit advisory disposition and release review.

## Verification

The workspace security suite exercises actual consumer-relative modules,
without wallet credentials or provider calls.
Five vulnerable-version cases fail before the changes and pass afterward:
bounded nested-glob completion, template import rejection, route-expansion bounds,
zero-bit BN masking, and completed-decoder/trailing-byte handling in a child process.
An actual example-server health/404 check preserves its route behavior.

Frozen strict physical installation, 45 wallet tests, 36 security tests (including
the six new cases), six logging tests, routing, typecheck, and the library plus all
six example builds passed locally. Declaration diagnostics remain fatal.
These checks do not replace authenticated browser flows or qualify real signing.

Re-run the scoped audits against your own installation before release.
Passing workspace checks does not establish that an npm consumer has the same
dependency resolutions or remove the remaining advisory risks above.
