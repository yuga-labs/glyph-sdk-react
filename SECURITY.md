# Compatible security resolutions

Reviewed on 2026-10-27 (UTC), using Node `24.22.1` and pnpm `9.9.0`.
This review covers the SDK development workspace and its examples, not every
consumer installation. It does not approve publication or claim a clean audit.

## Earlier compatible resolutions (PR128)

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

## Earlier audit scope and remaining risk (PR128)

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

At the PR128 baseline, two high-severity advisory families remained:

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
Npm consumers do not inherit workspace overrides or this private pnpm lock.
The public source workspace instead carries its own explicitly reviewed policy with 16 overrides and a committed public-layout lock, projected from the tested private graph.
That projection must be regenerated and qualified after dependency changes; it is
not a fresh release-time resolution or an npm consumer policy. Published packages
and workspace graphs can differ. These lock changes do not retroactively change
any published package or an existing consumer installation.
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

## Compatible leaf follow-up (2.2.1 workspace)

Reviewed on 2026-10-27 using pnpm `9.9.0`. Root and library versions stay `2.2.1`.
Package declarations, overrides, wallet protocol versions, and runtime source are unchanged.
This follow-up replaces only these declared-compatible resolutions:

| Actual consumer path | Resolution | Existing parent range |
| --- | --- | --- |
| SDK/examples → wagmi `2.19.5` → connectors `6.2.0` → Porto `0.2.35` | Zod `4.3.5` → `4.6.7` | Porto `^4.1.5`; abitype `1.2.3` peer `^3.22.0 || ^4.0.0` |
| SDK/examples → Privy `3.48.1` → pino-pretty `10.3.1` | fast-copy `3.0.2` → `3.1.0` | `^3.0.0` |
| Workspace/examples → Vite React plugin `5.1.2` | Babel core `7.28.6` → `7.29.6` | `^7.28.5` |

Babel core requires the following same-major closure: code-frame/types/traverse
`7.29.0`, helpers `7.29.2`, parser `7.29.3`, and generator `7.29.6`.
These are the lowest versions required by the new manifests. Existing compatible
Babel helpers, plugins, and non-Babel dependencies retain their versions.

The lock replaces nine package records. All surviving package records are unchanged.
Importer declarations and snapshot structures are identical after normalizing only
these nine versions. Zod's compatible peer-context references change throughout
the lock; Zod `3.22.4`, `3.25.76`, and Dynamic's exact `4.0.5` remain unchanged.
Registry integrity and every changed parent range were checked. No global Zod
replacement, forced peer, or new override is used.

### Fixed paths and limits

- [Zod GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5):
  the selected Porto/abitype Zod 4 path now exceeds the `4.6.6` patched floor.
  A constrained oversized collection fails before parsing its elements. This
  does not add size limits to unconstrained schemas or fix the retained Zod copies.
- [fast-copy GHSA-jggr-w7fw-pc2j](https://github.com/planttheidea/fast-copy/security/advisories/GHSA-jggr-w7fw-pc2j):
  the pino-pretty path now uses the fixed major-3 release. Excessive depth raises
  the catchable `MaxDepthExceededError` instead of traversing without a bound.
- [Babel GHSA-4x5r-pxfx-6jf8](https://github.com/babel/babel/security/advisories/GHSA-4x5r-pxfx-6jf8):
  Vite React's compiler now uses patched core `7.29.6`. The advisory requires
  attacker-controlled compiled input, access to the compiled output, and knowledge
  of a source-map path. Builds here compile repository source; the test uses only
  synthetic temporary maps and executes no supplied program.

The current full-workspace `pnpm audit --json` reports 4 high, 10 moderate,
2 low, and no critical findings. This is a dated registry observation, not a
clean-audit claim or a comparison against the earlier PR128 counts.
Upstream-constrained Zod 3 and exact Dynamic Zod `4.0.5` remain unresolved.
The Dynamic exact MetaMask SDK `0.33.0` and Jayson major-1 stream-json constraint
remain unchanged. The affected MetaMask advisory's malicious debug `4.4.2` is
absent from the lock, but the SDK is not marked patched or ignored.
Other remaining advisories still require separate compatible fixes or upstream
migration. No audit suppression is added.

### Regression evidence and publication boundary

Actual consumer-relative regressions fail on the old versions and pass on the
new graph: bounded Zod collection parsing, typed fast-copy depth rejection, and
Babel rejection of an outside-package source map. Ordinary Porto token schema
parsing/output/rejection, cyclic/date/array copying, pino-pretty formatting, and
local source-map/JSX handling are also tested. The existing security entry point
runs these cases; no release/export workflow is changed.

Workspace lock resolutions do not propagate into npm consumers or regenerate the
public source lock automatically. Refresh and qualify that public projection
separately, and audit each consumer's installed graph. Wallet peers remain external.
This follow-up neither qualifies signing nor authorizes publishing.

## Remaining high-severity findings: 2026-10-27 baseline and disposition

At the start of this review, the GitHub API reported four open high-severity alerts: Zod
[GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
and bigint-buffer
[GHSA-3gc7-fjrx-p6mg](https://github.com/advisories/GHSA-3gc7-fjrx-p6mg),
each reported against both the private workspace lock and the committed public
projection. These are two advisory families duplicated across two lockfiles.
They remain unresolved; this disposition adds no exception or suppression.

### Baseline consumers and upstream-release limits

| Installed path | Remaining copy | Primary upstream evidence |
| --- | --- | --- |
| SDK development matrix → Privy `3.48.1` → WalletConnect Ethereum provider `2.26.0` → Reown appkit/wallet `1.8.19` | Zod `3.22.4` | [Latest Reown wallet `1.8.24`](https://registry.npmjs.org/@reown%2fappkit-wallet/latest) still pins `3.22.4`. |
| SDK development matrix → Privy `3.48.1` → api-base `1.11.0` | Zod `3.25.76` | [Latest api-base `1.12.0`](https://registry.npmjs.org/@privy-io%2fapi-base/latest) requires `^3.25.76`. [Latest Coinbase CDP `1.60.0`](https://registry.npmjs.org/@coinbase%2fcdp-sdk/latest), another installed parent path, also requires Zod 3. |
| Dynamic example → Dynamic Ethereum/wallet-book `4.52.5`; client `0.1.2` is another parent | Zod `4.0.5` | Even [latest wallet-book `5.13.0`](https://registry.npmjs.org/@dynamic-labs%2fwallet-book/latest) and [client `1.47.0`](https://registry.npmjs.org/@dynamic-labs-sdk%2fclient/latest) still pin exactly `4.0.5`. A wallet major would not remove that pin. |
| Dynamic example → Ethereum/WaaS `4.52.5` → Solana Core `4.52.5` → SPL Token `0.4.12` → buffer-layout-utils `0.2.0` | bigint-buffer `1.1.5` | [Latest buffer-layout-utils `0.3.0`](https://registry.npmjs.org/@solana%2fbuffer-layout-utils/latest) still requires `^1.1.5`. [Latest bigint-buffer](https://registry.npmjs.org/bigint-buffer/latest) remains `1.1.5`; the advisory lists no patched release. |

The [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
lists `<4.6.6` as affected; the current published fixed version is
[`4.6.7`](https://registry.npmjs.org/zod/4.6.7). Zod 3 still ends at `3.25.76`.
The previously qualified Porto/abitype v4 path already uses `4.6.7`.
The retained Zod 3 contracts require separate v3-compatible remediation.
The Dynamic pins require explicit qualification for a scoped same-major override;
the follow-up below supplies that qualification. No global Zod 4 replacement or
wallet major is applied.

A bounded probe loaded each affected Zod copy from its real installed consumer,
through both CommonJS and ESM. For `z.array(z.string()).max(1)`, 512 invalid
elements caused 512 element reads and 513 issues in every retained version,
through both `safeParse` and `safeParseAsync`. An ordinary one-element string
array still parsed successfully. This confirms the constrained-collection behavior
without an unbounded memory-exhaustion test. It does not establish that a specific
first-party request reaches one of these schemas.

### Backport assessment and API preservation

The primary upstream fix is
[Zod commit a0ebf970](https://github.com/colinhacks/zod/commit/a0ebf970f2d752e5f58527cd2942ff48be4f46bd),
which implements [PR6652](https://github.com/colinhacks/zod/pull/6652).
It moves leading array/set/map upper-bound checks before element parsing in v4,
preserving checks that can rewrite a value. Unbounded collections remain unchanged.
The separate `abortEarly` proposal is not the published fix.

An application-specific hash-verified Zod3 backport was evaluated as a precedent.
Its script supports only
`3.25.76`, and its original CJS/ESM file hashes match this installation.
However, it also removes embedded v4 and source-condition exports. The baseline SDK graph
contains Reown's different `3.22.4` and Dynamic's `4.0.5`; its `3.25.76` package
still exposes working `zod/v4` entrypoints. Its version guard rejects `3.22.4`,
and its export restriction removes public APIs preserved here. It also assumes
npm's nested installation layout. The script is not applied.
A v3-only patch would also leave exported embedded-v4 code and Dynamic's separate
v4 copy outside its mitigation scope.

A defensible backport therefore needs a separately reviewed, version-specific
patch set that preserves every retained export and both module formats. It must
verify original npm/file hashes, cover the applicable embedded-v4/source paths,
retain valid parse outputs and custom errors, and demonstrate early bounded
rejection for synchronous and asynchronous parsing. The public projection must
carry the same patch files and explicit install policy, with frozen-install
verification of every copy. The current export projection has no patched-dependency
mapping; an install-only private patch would not provide that contract.
No partial patch is presented as remediation for the entire advisory.

For bigint-buffer, the repository has an
[open bounds-check PR67](https://github.com/no2chem/bigint-buffer/pull/67),
but it is unmerged and unreleased. That change addresses native `fromBigInt`
stack-width handling, while the advisory names `toBigIntLE`. The candidate needs
native safety review and regression coverage before it can support a complete
advisory-remediation claim. No unreviewed C patch or replacement serialization
implementation is introduced here.

### Published artifact, browser, and native evidence

The published SDK `2.2.1` tarball was checked against the registry's SHA512
integrity. Its five JavaScript source maps contain 600 source references and zero
actual Zod or bigint-buffer source modules. A fresh SDK library build produced
the same module counts. Counts use actual module paths, excluding package names
that appear only inside peer-context directory labels.

Declared Privy, wagmi, viem and other peers remain external, and the npm package
contains no workspace override policy. Consumers resolve their own peer graphs.
The public source workspace has its explicit reviewed policy and lock projection;
that policy is not inherited by npm consumers. Artifact evidence does not close
workspace findings or establish the safety of those external installations.

Bigint-buffer's manifest maps its Node entry to a JavaScript browser entry.
The browser entry's four conversion functions preserved a known eight-byte
little-endian round trip. In a separate, environment-isolated Node `24.22.1`
process on macOS ARM64, the actual native addon loaded and the same ordinary
round trip passed. Oversized native widths were not executed. Browser mapping
therefore does not establish native absence or remediate the package advisory.

The next acceptable bigint-buffer candidate needs reviewed upstream provenance,
browser/native output compatibility and native sanitizer coverage for aligned,
unaligned, empty and oversized widths on supported architectures. Until then,
keep this finding visible. Published-consumer fixes require independently qualified
parent updates or an explicitly adopted patch policy; a new SDK version alone
cannot patch external peers. No peer range, package export, publication or audit-suppression policy changes
accompany this disposition. The scoped source-workspace change
below updates only the two qualified Dynamic resolutions.


## Qualified scoped Dynamic Zod4 refresh

Two exact parent selectors override the installed Dynamic parents' `4.0.5` pins
with the already locked, registry-integrity-verified Zod `4.6.7`:

- `@dynamic-labs/wallet-book@4.52.5>zod`
- `@dynamic-labs-sdk/client@0.1.2>zod`

This is an explicit source-workspace exception to those exact pins, supported by
consumer qualification, rather than a claim that their manifests declare a range.
The 14 original overrides retain their values; the two selectors bring the private
and public source policies to 16. No global Zod override, Zod3 substitution, wallet
package update or application/signing edit is introduced. Root and library
versions advance together to `2.2.2` through this PR for a new immutable release;
the existing `2.2.1` tags remain unchanged.

The reviewed lock update changes only those two dependency edges and removes the
orphaned `zod@4.0.5` package/snapshot. It adds no package record and changes no
surviving package record, importer, Zod3 edge or peer-context key. A normal solver
attempt also rewrote unrelated peer contexts and metadata; that result was rejected.
The minimal retained graph passes pnpm9.9.0 frozen/strict installation. The public
lock is regenerated from the same reviewed graph and carries the same two selectors.

Actual Dynamic consumers use `zod/mini`. Forty-six bounded fixtures exercise the
published wallet/group/book schema modules and the client's actual state/session
schemas, observing constructor output without replacing validation. Valid inputs,
invalid code/path results, defaults, extension/mobile transforms, unknown-field
stripping and prototype canaries match the original4.0.5 results separately for
synchronous and asynchronous parsing. Wallet schema CommonJS/ESM outputs agree;
no network request, signing operation or provider method is invoked.

A separate red/green probe imports the actual mini implementations: with512 invalid
elements and an upper bound of1,4.0.5 reads512 elements and creates513 issues;
4.6.7 reads zero elements and creates one `too_big` issue, both sync and async.
Ordinary accepted output remains unchanged. The committed regressions also check
physical consumer resolution and preserve Reown/Privy's real Zod3 APIs. Public
installed-graph parity includes these two Zod4 parents and the retained Zod3 parents.
Unbounded collections gain no new input limit from this change.

This removes the standalone Dynamic4.0.5 path from the committed source-workspace
graphs. Zod3, its embedded-v4 surface and bigint-buffer remain unresolved; the
advisory families and their alerts are not marked globally fixed or suppressed.
The existing npm2.2.1 package and live public mirror are unchanged by this private
source change. Npm consumers inherit neither these overrides nor this lock.
The next parent-owned export/release must qualify the public projection and its
browser/artifact gates; no new tag or publication is authorized here.
