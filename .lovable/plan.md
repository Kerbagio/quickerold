## Goal
Make the app fully translated across English, French and Arabic — no leftover hardcoded English strings, and no missing keys in FR/AR.

## Current state (verified)

**1. Missing keys in FR and AR translation maps** (`src/contexts/LanguageContext.tsx`)
The English map has 267 keys; FR and AR each have 259. These 8 keys exist only in English and fall back to raw key text on the Settings page:
- `settings.appearance`, `settings.theme`, `settings.themeDesc`
- `settings.light`, `settings.dark`, `settings.system`
- `toast.themeUpdated`, `toast.themeChanged`

**2. Hardcoded English strings in components/pages** (not wired to `t(...)`)
Confirmed by scanning JSX and string literals:

- `src/pages/Index.tsx` — ETA-source labels (`"Live traffic"`, `"Distance estimate"`, road-network label), toast titles (`"Location is unavailable"`, `"Current location unavailable"`, `"Try hospital search again"`), loading title (`"Comparing nearby hospitals"`).
- `src/pages/Options.tsx` — filter labels (`"All candidates"`, `"Wheelchair tagged"`, `"Emergency tagged"`), toasts (`"Load at least two hospitals first"`, `"Scenario reranked"`), loading titles (`"Preparing the Scenario Lab"`, `"Building the accessibility view"`), stat labels (`"Candidates"`, `"Wheelchair tagged"`, `"Emergency tagged"`), fallback strings (`"Unknown"`, `"Estimated circles"`).
- `src/pages/Dashboard.tsx` — recommendation reason strings (`"Closest and selected option matched"`, `"Comparison not recorded in this earlier search"`), CSV export headers (`"Emergency type"`, `"ETA minutes"`, `"ETA source"`, `"Closest hospital"`, `"Closest ETA"`, `"Potential minutes faster"`, `"Selection reason"`, `"Not recorded"`), loading title, chart legend names (`"Comparisons"`, `"Average ETA"`), badge labels (`"Wheelchair"`, `"Emergency"`).
- `src/pages/Onboarding.tsx` — location toast titles/descriptions (`"Location not supported"`, `"Location enabled"`, `"Location access denied"`), `"QuickER setup"` step label.
- `src/pages/About.tsx` — technology partner blocks (`purpose`, `mode` strings, TomTom description) and privacy bullet list (`"No automatic paid overages"`, etc.).
- `src/pages/Settings.tsx` — language `<SelectItem>` label shows literal `English` (French/Arabic items likely similar; needs a full pass).
- `src/components/DecisionEvidenceCard.tsx` — `"Selected"` badge, eyebrow labels (`"Closest route"`, `"Fastest ETA"`, `"Fastest suitable"`).
- `src/components/AIDecisionBrief.tsx` — `"Verified rules fallback"`, `"Enhancing locally…"`, `"Regenerate brief"`.
- `src/pages/TermsOfService.tsx`, `src/pages/PrivacyPolicy.tsx` — need a full read to confirm which body copy is already keyed vs. hardcoded.
- `src/components/OfflineNotice.tsx`, `src/components/RouteLoading.tsx`, `src/components/LoadingState.tsx`, `src/components/Header.tsx`, `src/components/BottomNav.tsx` — need a quick pass to confirm they use `t(...)` for every visible label.

Untouched: shadcn `src/components/ui/*` internal `displayName`s (not user-visible text — leaving alone).

## Plan

1. **Add the 8 missing Settings/Theme keys** to the `fr` and `ar` maps in `LanguageContext.tsx` so no key falls back to raw text.
2. **Add new translation keys** to all three language maps for every hardcoded string listed above (grouped by page: `index.*`, `options.*`, `dashboard.*`, `onboarding.*`, `about.*`, `decision.*`, `ai.*`).
3. **Replace hardcoded strings** in each page/component with `t('...')` calls, importing `useLanguage` where it isn't already.
4. **Full sweep of the remaining files** (`TermsOfService`, `PrivacyPolicy`, `Settings` language select items, `Header`, `BottomNav`, `OfflineNotice`, `RouteLoading`, `LoadingState`) — read each, key any leftover English text, and translate.
5. **Verify parity** by re-running the key-diff (`en` vs `fr` vs `ar` should all have the same key set) and by loading the app in FR and AR to confirm no English leaks visually on Home, Options, Dashboard, Settings, About, Privacy, Terms, Onboarding.

## Out of scope
- Backend/data content (hospital names from OSM, country names in emergency lookup) — stays as source data.
- shadcn primitive internals (`displayName`, `aria-label="Toggle Sidebar"` inside unused sidebar component).
- RTL layout tweaks beyond what's already handled by the existing `dir="rtl"` toggle.
