# ContextShield

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge)](https://contextshield-547bb.web.app)

**Privacy-first Hybrid AI Security Assistant**

Detect phishing threats. Protect personal information. Understand every decision.

🌐 **Live Demo:** https://contextshield-547bb.web.app

---

## Architecture & Privacy Guarantees

ContextShield enforces strict separation across three independent analysis engines and never silently upgrades local execution to cloud inference:

- **Client-Side PII Masking (`src/features/privacy/piiDetection.ts`)**: Detects and masks personal identifiers (emails, phones, SSNs, cards, IPs, credentials, etc.) in the browser before any cloud payload preview or `localStorage` scan-history persistence.
- **Explicit Snapshot-Bound Cloud Consent (`src/features/analysis/CloudConsentModal.tsx`, `src/services/cloudAi.ts`)**: Gemini Cloud calls require active consent tied strictly to the exact protected message snapshot. Editing the message or revoking consent immediately invalidates consent and aborts any in-flight request.
- **Strict Engine & Attribution Separation**:
  - **Local Rule-Based Engine (`src/services/localSecurityEngine.ts`, attribution `local_rules`)**: Deterministic offline heuristics with `0` network calls; functions cleanly regardless of cloud consent, quota limits, or browser Prompt API support.
  - **On-Device AI (`src/services/onDeviceAi.ts`, attribution `on_device`)**: Chrome Prompt API (`window.LanguageModel` / `window.ai.languageModel`) via `InferenceMode.ONLY_ON_DEVICE`. Unsupported browsers immediately surface `ON_DEVICE_UNAVAILABLE` with zero silent cloud fallback.
  - **Cloud AI (`src/services/cloudAi.ts`, attribution `in_cloud`)**: `gemini-3.8-flash` via Firebase AI Logic using `InferenceMode.ONLY_IN_CLOUD` and `CLOUD_REQUEST_TIMEOUT_MS = 60000` (`60s`).
- **Transparent Unified Reporting (`src/services/hybridReportEngine.ts`, `src/features/analysis/analysisUtils.ts`)**: Prevents deterministic `local_rules` from masquerading as `on_device` Gemini Nano AI or generating fabricated hybrid AI corroboration.

---

## Execution Reliability, Cancellation & Cloud Latency Improvements

Execution reliability across all three analysis engines (`src/services/onDeviceAi.ts`, `src/services/cloudAi.ts`, `src/services/hybridAiService.ts`, `src/services/errorUtils.ts`, `src/features/analysis/OnDeviceAnalysisCard.tsx`, and `src/features/analysis/CloudAnalysisCard.tsx`) includes:

1. **Synchronous Gemini Nano Availability Detection**
   - `getSynchronousReadiness()` in `src/services/onDeviceAi.ts` evaluates `hasOnDevicePromptApiSupport()` (`window.LanguageModel || window.ai?.languageModel`) synchronously (`0ms`) when `OnDeviceAnalysisCard` initializes.
   - Unsupported browsers do not block on an asynchronous mount probe; when a Prompt API object is present, `checkOnDeviceReadiness()` falls back to the 1,500ms timeout-guarded capability probe and caches the result.

2. **Explicit `ON_DEVICE_UNAVAILABLE` Handling**
   - On unsupported browsers (or when availability resolves to `'unsupported'` / `'no'`), `OnDeviceAnalysisCard` immediately sets `errorState.code = 'ON_DEVICE_UNAVAILABLE'` (`retryable: false`) and surfaces a **Run Local Rule-Based Analysis** action.
   - Unsupported on-device checks never silently fall back to Gemini Cloud and never label Local Rule-Based results as Gemini Nano (`on_device`).

3. **Reconciled 60s Bounded Cloud Timeout, Retry Gating & `AbortController` Cancellation**
   - `CLOUD_REQUEST_TIMEOUT_MS` is reconciled to `60000` ms (`60` seconds) in both `src/services/cloudAi.ts` and `src/services/hybridAiService.ts`, governing `getGenerativeModel`, `model.generateContent(..., { timeout, signal })`, `runWithAbortAndTimeout`, and `sleepWithAbort` so initialization and inference share the same bounded timeout budget.
   - Automatic retries in `runCloudAiAnalysis` are capped at `MAX_RETRIES = 1` via `shouldAutoRetryCloudError()`, triggering only for fast, genuinely transient errors completed in under `12000` ms (`12` seconds) with total generation time under `24000` ms (`24` seconds), and explicitly blocking automatic retries on `DAILY_QUOTA_EXCEEDED`, `TOKEN_QUOTA_EXCEEDED`, `BILLING_REQUIRED`, `MODEL_OVERLOADED`, `TIMEOUT`, and `CANCELLED`.
   - Each active cloud request attaches a fresh `AbortController` signal via `activeAbortController` and a unique request token in `inFlightCloudRequests` (`Map<string, symbol>`), and `abortCloudAiAnalysis()` aborts in-flight requests and releases concurrency locks.

4. **Real-Time Cloud Analysis Timer**
   - `CloudAnalysisCard` maintains an `elapsedSeconds` counter updated every second while `isAnalyzing` is `true`, rendering live elapsed timing (`{elapsedSeconds}s / 60s`, `Analyzing ({elapsedSeconds}s)...`, and `{elapsedSeconds}s` progress with a `60s bounded timeout` indicator).

5. **Cancel & Run Local Functionality**
   - While cloud inference is running, `CloudAnalysisCard` provides **Cancel & Run Local** (alongside **Cancel**), aborting the active cloud call via `abortCloudAiAnalysis()`, resetting the analyzing state, and triggering deterministic local rule-based analysis immediately.

6. **Root-Cause `[Code: 20]` Fix & Quota / High-Demand Classification**
   - `extractStatusCode()` in `src/services/errorUtils.ts` ignores legacy `DOMException.code === 20` (`AbortError`) so client aborts and timeouts are never misclassified as HTTP status codes.
   - `parseQuotaErrorDetails()` classifies quota exhaustion (`GenerateRequestsPerDayPerProjectPerModel` -> `DAILY_QUOTA_EXCEEDED`, rate limits -> `RATE_LIMIT_EXCEEDED`, token limits -> `TOKEN_QUOTA_EXCEEDED`) and high-demand errors (`overloaded`, `high demand`, `deadline_expired`, HTTP `503`/`504` -> `MODEL_OVERLOADED`), blocking automatic retry loops while allowing deterministic local analysis immediately.

7. **Immediate Consent Revocation & Stale-Response Guards**
   - Clicking **Revoke** / **Revoke Consent** or editing the message snapshot immediately calls `abortCloudAiAnalysis()` (with `CONSENT_REVOKED` / cancellation handling), resets `isAnalyzing`, clears consent state, and uses `activeRequestIdRef` in `CloudAnalysisCard` to discard any stale responses.
   - `finally` blocks clean up `inFlightCloudRequests` tokens and `activeAbortController` references so subsequent scans never stall on stale concurrency locks.

---

## Cybersecurity Defense Center UI/UX & Real Telemetry

- **Dark-Mode-First Palette & Light Mode (`src/index.css`, `src/context/ThemeContext.tsx`)**: Deep navy (`#071827`), dark teal panels (`#0B2735`), teal controls (`#0D5663`), cyan accents (`#22D3EE`), and persistent Light Mode toggle (defaults to dark unless `cs_theme === 'light'`).
- **Standardized Components & Badge Alignment (`src/components/common/StatusBadge.tsx`, `src/components/common/Button.tsx`, analysis/report/privacy/history views)**: Unified pill heights, `flex-wrap items-center gap-2` badge/action wrapping, button alignment, and `focus-visible` cyan rings.
- **Zero Fabricated Telemetry (`src/context/SecurityContext.tsx`, `src/pages/DashboardPage.tsx`, `src/layouts/TopNav.tsx`)**: Removed seeded sample counts/ratios (`142`, `68%/18%/14%`, `Hackathon Solo`); Dashboard, TopNav notifications, and Scan History persist only real, masked scan records in `cs_scan_history_v1` (`0` default).

---

## Verification Scope: Local vs. Production

### Local Verification (Current Working Tree)

- **Unit & Runtime Verification (`npm test`)**: Passed — all 4 suites passed (`errorUtils.test.ts` [11 subtests covering `DOMException` code 20, `CANCELLED`, quota classification, and `shouldAutoRetryCloudError`], `hybridSynthesis.test.ts`, `quotaAndLocalEngine.test.ts`, and `runtimeVerification.test.ts`).
- **Linter (`npm run lint`)**: Passed — `0` errors via `oxlint`.
- **TypeScript & Production Bundle (`npm run build`)**: Passed (`tsc -b && vite build`).
- **Headless Chrome CDP Verification (local `dist/` preview)**: Verified `1440px`, `1280px`, `768px`, and `375px` viewports (`0` horizontal overflow, `0` badge overlaps, `0` console/page errors), dark-mode default and light toggle, `0` initial scan telemetry, PII redaction in Step 2 and Consent Modal, `0` Fetch/XHR requests on Local Rule-Based Analysis, `ON_DEVICE_UNAVAILABLE` handling without silent cloud fallback, and masked `localStorage` scan-history updates.
- **Historical Local Phase 3.2 Browser Checks (`5/5` Scenarios)**: Confirmed Local Rules network isolation, `ON_DEVICE_UNAVAILABLE` safety, mocked HTTP 429 daily-quota no-retry handling, consent snapshot invalidation on edit, and strict source attribution (`local_rules`, `on_device`, `in_cloud`).

### Production Verification Status (`https://contextshield-547bb.web.app`)

- **Current Working Tree Not Yet Deployed**: The latest Cloud Reliability fixes (`60s` unified timeout, `[Code: 20]` classification fix) and Cybersecurity Defense Center UI redesign have **not yet been deployed** to Firebase Hosting.
- **Prior Deployed Builds**: Earlier CDP checks verified pre-redesign Phase 3.4 behavior against live hosting (unsupported `ON_DEVICE_UNAVAILABLE` first-click flow, Local Rules network isolation, live cloud request dispatch/cancellation via **Cancel & Run Local**, and immediate consent revocation), **without** testing real Chrome Gemini Nano hardware or waiting through automatic `60s` Cloud timeout expiry.

### Known Limitations & Pending Live Verification

- **Real Gemini Nano (`on_device`) Hardware Untested**: Test environments lacked compatible Chrome Prompt API / Gemini Nano hardware, so only the `ON_DEVICE_UNAVAILABLE` fallback path was verified locally and in prior hosting checks.
- **Live Cloud Inference on Current Build Pending**: Live `gemini-3.8-flash` inference, automatic `60s` (`CLOUD_REQUEST_TIMEOUT_MS`) timeout handling, and live HTTP 429/503 responses have not yet been executed against the current working-tree build once deployed.
- **Static Rules & Mocked Quota Tests**: Local rule-based detection relies on deterministic patterns and offline domain lists (not semantic AI), and prior HTTP 429 browser quota tests used controlled mocked responses rather than exhausting real project quotas.