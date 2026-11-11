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

---

## Phase 3.4 — Execution Reliability, Cancellation & Cloud Latency Improvements

Phase 3.4 hardens execution across all three analysis engines (`src/services/onDeviceAi.ts`, `src/services/cloudAi.ts`, `src/services/errorUtils.ts`, `src/features/analysis/OnDeviceAnalysisCard.tsx`, and `src/features/analysis/CloudAnalysisCard.tsx`) to eliminate first-click blocks, multi-minute cloud hangs, and stale concurrency locks.

### Implemented Engineering Improvements

1. **Synchronous Gemini Nano Availability Detection**
   - `getSynchronousReadiness()` in `src/services/onDeviceAi.ts` evaluates `hasOnDevicePromptApiSupport()` (`window.LanguageModel || window.ai?.languageModel`) synchronously (`0ms`) when `OnDeviceAnalysisCard` initializes.
   - Unsupported browsers no longer wait on an asynchronous mount probe with disabled buttons; when a Prompt API object is present, `checkOnDeviceReadiness()` falls back to the 1,500ms timeout-guarded capability probe and caches the result.

2. **Explicit `ON_DEVICE_UNAVAILABLE` Handling**
   - On unsupported browsers (or when availability resolves to `'unsupported'` / `'no'`), `OnDeviceAnalysisCard` immediately sets `errorState.code = 'ON_DEVICE_UNAVAILABLE'` (`retryable: false`) and surfaces a **Run Local Rule-Based Analysis** action.
   - Unsupported on-device checks never silently fall back to Gemini Cloud and never label Local Rule-Based results as Gemini Nano (`on_device`).

3. **Bounded Cloud Timeouts (12s Fast-Fail Retry Gate & 35s Request Cap) and `AbortController` Cancellation**
   - In `src/services/cloudAi.ts`, `CLOUD_REQUEST_TIMEOUT_MS` is set to `35000` ms (35 seconds) for both `getGenerativeModel` initialization and each `model.generateContent(..., { timeout, signal })` call.
   - Automatic retries in `runCloudAiAnalysis` are capped at `MAX_RETRIES = 1` and only trigger for transient errors when the failed attempt completed in under `12000` ms (12 seconds), total generation elapsed time is under `24000` ms (24 seconds), and the request was not aborted. Slow failures or 35-second timeouts fail fast without stacking back-to-back long waits.
   - *(Code note: the unused/legacy `hybridAiService.ts` still sets `timeout: 35000` at model initialization while passing `timeout: 90000` on `generateContent`; primary UI cloud execution routes through `cloudAi.ts`.)*
   - Each active cloud request attaches a fresh `AbortController` signal via `activeAbortController`, and `abortCloudAiAnalysis()` aborts the in-flight `fetch()` and clears `inFlightCloudRequests`.

4. **Real-Time Cloud Analysis Timer**
   - `CloudAnalysisCard` maintains an `elapsedSeconds` counter updated every second while `isAnalyzing` is `true`, rendering live elapsed timing in both the action button (`Analyzing in Cloud (<n>s)...`) and footer (`Inference in progress (<n>s) • Bounded 35s timeout`).

5. **Cancel & Run Local Functionality**
   - While cloud inference is running, `CloudAnalysisCard` displays a **Cancel & Run Local** button that calls `abortCloudAiAnalysis()`, clears the analyzing state, and invokes `runLocalRuleBasedAnalysis()` immediately to display deterministic local findings.

6. **Improved High-Demand Error Classification**
   - `parseQuotaErrorDetails()` in `src/services/errorUtils.ts` classifies high-traffic messages (`overloaded`, `high demand`, `spikes in demand`, `experiencing high demand`, `service unavailable`, `deadline_expired` / `deadline expired`, and HTTP `503`/`504`) under `MODEL_OVERLOADED`.
   - `toAnalysisErrorState()` maps `MODEL_OVERLOADED` to **"Cloud AI Model Overloaded"** (`retryable: true` for manual retry alongside immediate local rule-based fallback).

7. **Immediate Consent Revocation & Concurrency Lock Cleanup**
   - Clicking **Revoke** in `CloudAnalysisCard` immediately calls `abortCloudAiAnalysis()`, resets `isAnalyzing` to `false`, and clears `cloudConsent` (`hasConsented: false`, `consentedAt: null`, `consentedMessageSnapshot: null`).
   - `runCloudAiAnalysis` releases `activeAbortController` and deletes the message entry from `inFlightCloudRequests` in its `finally` block (and `CloudAnalysisCard` also aborts active requests on unmount), preventing stuck `RATE_LIMITED` ("Analysis in Progress") locks.

8. **Independent Execution of All Three Analysis Engines**
   - **On-Device AI (`onDeviceAi.ts`, source `on_device`)**: Uses Chrome Prompt API locally with zero network requests.
   - **Local Rule-Based Engine (`localSecurityEngine.ts`, source `local_rules`)**: Runs deterministically in browser memory regardless of cloud consent, cloud failures/aborts, or Prompt API support.
   - **Cloud AI (`cloudAi.ts`, source `in_cloud`, `gemini-3.8-flash`)**: Executes strictly via `InferenceMode.ONLY_IN_CLOUD` only when explicit per-snapshot consent is active.

---

### Implemented vs. Independently Verified Scope

- **Implemented in Codebase**: All 8 engineering capabilities above are implemented in the repository source files and verified by static build (`npm run build`) and automated unit/runtime audit suites (`npm test`: 8 test suites passing).
- **Independently Verified in Live Production**: Live CDP browser verification against `https://contextshield-547bb.web.app` confirmed unsupported-device first-click handling, Local Rule-Based network isolation, live cloud request dispatch with real-time timer and `Cancel & Run Local` abort behavior, and immediate consent revocation cleanup.
- **Not Tested in Production**:
  - **Real Gemini Nano (`on_device`) inference was NOT tested**, as the test browser environment did not have Chrome Prompt API / Gemini Nano enabled (`ON_DEVICE_UNAVAILABLE` path was verified instead).
  - Full waiting through the automatic 35-second timeout expiry without manual abort, and live HTTP 500/503 high-demand retries under real server spikes, were verified via code inspection and error-classification unit tests rather than induced against live Vertex AI in the CDP run.

---

### Phase 3.4 — Production Verification Summary (`https://contextshield-547bb.web.app`)

| Task | Verification Scenario | Observed Production Result | Evidence Artifact | Status |
|---|---|---|---|---|
| **Task A** | On-Device First Click & Attribution | Unsupported browser immediately rendered `ON_DEVICE_UNAVAILABLE`; first click executed Local Rule-Based Engine (`0ms` wait, zero false Gemini Nano attribution). | `scratch/phase34_taskA_ondevice_first_attempt.png` | **PASS** *(unsupported path; real Nano not tested)* |
| **Task B** | Local Engine Independence & Network Isolation | Executed without cloud consent and after errors; deterministic findings produced with `0` Fetch/XHR requests. | `scratch/phase34_taskB_local_independence.png` | **PASS** |
| **Task C** | Cloud Execution, Live Timer & `Cancel & Run Local` | Dispatched live POST request to Vertex AI, ticked real-time elapsed timer, and aborted in-flight fetch via **Cancel & Run Local** while triggering local analysis. | `scratch/phase34_taskC_cloud_in_flight.png`, `scratch/phase34_taskC_cloud_aborted.png` | **PASS** |
| **Task D** | Consent Revocation & Concurrency Lock Release | Clicking **Revoke** aborted the active cloud call, reset analyzing state, cleared consent, and kept Local Rule-Based Analysis functional. | `scratch/phase34_taskD_consent_revoked.png` | **PASS** |