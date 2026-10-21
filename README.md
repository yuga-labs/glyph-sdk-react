# Glyph Widget (React SDK)

See it in action 🚀: [https://demo.useglyph.io](https://demo.useglyph.io)

Dashboard ⚙️: [https://useglyph.io/](https://useglyph.io/)

Documentation 📝: [https://docs.useglyph.io/](https://docs.useglyph.io/)

## Diagnostics

SDK debug and informational logs are disabled by default. Warnings and errors remain visible.
Import `setGlyphDebugLogging` from `@use-glyph/sdk-react` and call it with `true` for temporary diagnostics.
Call it with `false` to disable diagnostics again. Third-party wallet logging is separate.
Authentication logs never contain signatures, tokens, nonces, or raw provider errors.
