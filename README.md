# ContextShield

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge)](https://contextshield-547bb.web.app)

**Privacy-first Hybrid AI Security Assistant**

Detect phishing threats. Protect personal information. Understand every decision.

🌐 **Live Demo:** https://contextshield-547bb.web.app


# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
"# ContextShield" 


## Phase 3.2 — Manual Browser & Network Verification

**Verification Status: 5/5 Tests Passed**

Manual browser verification was conducted using Google Chrome and Chrome DevTools Protocol (CDP) on the local Vite application.

| Test | Result |
|---|---|
| Local Rules Network Isolation | PASS |
| Gemini Nano Unavailable Handling | PASS |
| Local Fallback on Cloud Quota Exhaustion | PASS |
| Consent Snapshot Invalidation | PASS |
| Actual Inference Source Attribution | PASS |

### Key Verification Results

- **Network Isolation:** Local rule-based analysis completed without Fetch/XHR requests.
- **On-Device Safety:** Unsupported Gemini Nano inference correctly returned `ON_DEVICE_UNAVAILABLE`, without silent cloud fallback.
- **Quota Handling:** A mocked HTTP 429 response correctly triggered daily quota handling without automatic retries.
- **Privacy Consent:** Editing the message invalidated previous cloud consent.
- **Attribution Integrity:** Gemini Nano, Gemini Cloud, and Local Rules maintained separate source identities.

### Reliability Improvements

Fixed an indefinite Prompt API readiness probe by introducing a 1,500ms timeout in `src/services/onDeviceAi.ts`.

### Known Limitations

- Local rules use deterministic lexical and regex-based detection, not semantic AI.
- Domain reputation relies on offline static lists.
- Real Gemini Nano inference still requires a compatible device and browser.
- Cloud quota testing used a mocked HTTP 429 response.
- These manual tests were conducted locally; production verification remains pending.