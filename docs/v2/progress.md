# SDD ledger — plan: docs/superpowers/plans/2026-11-18-idle-traveler-v2.md

## Setup
- Existing feature branch: claude/vigilant-cerf-avqftv; main is not modified. Prior v1.67 changes remain in place.
- Ruling: continue in current feature checkout — preserves the user-visible working tree and prior uncommitted vehicles; no checkout/reset or automatic commit of existing changes.
- Ruling: use a portable Node assertion runner for v2 — existing shell runner greps logs and cannot establish reliable success. Keep the legacy runner for regression comparisons.
- Pre-flight 2→3→4: migration uses eligibility and sanitizeExpedition; module load order content → expeditions → migration avoids a circular initialization dependency.
- Pre-flight 4→7→10: Transition owns state; permanent research belongs to progression; claim uses stable template/node reward IDs, not expedition IDs.
- Pre-flight 6→8: DOM controls are the authoritative interaction surface; canvas receives a view model only.
- Pre-flight 4→12: expedition work budgets use local normalized seconds and bounded abilities; old distance/temporary bonuses cannot instant-complete quests.

## Status
Implementation started. No v2 completion or release claimed.

- Core red→green: tests/v2-core.js initially failed on missing module; now passes migration, eligibility, state transitions, duplicate rewards and camp.
- Ruling: test threshold minus a representable epsilon instead of one metre — at 100000 light-years JavaScript cannot represent a one-metre difference.
- Browser: v3 backup, v4 reload, far entry, actual choice click, 12 mobile worlds and future-schema protection passed.
- Visual review found incorrect existing theme token assumptions; corrected text/background tokens before continuing.

## Implementation decisions and evidence
- Ruling: consolidated plan test files into v2-core/content/fleet/mechanics/localization/balance/reach plus v2-browser rather than many one-test wrappers. v2-run preserves nonzero child exits and missing-test failures.
- Ruling: kept work in the existing feature checkout and did not auto-commit unrelated pre-existing vehicle/package-lock/debug changes.
- Ruling: fleet roles are exclusive among the three fleet ships; the main traveler's role is an archetype, not the same hired individual. This permits the specified main+3 configuration.
- Ruling: camp costs changed to [3,5,7,9,11], each level adds a bounded 0.2 to the relevant ability. Original proposed costs exceeded available first-discovery research.
- Ruling: first node is 300s, normal remaining nodes 240s; remote nodes 900/750/750s. Measured routes now meet the proposed normal/long windows.
- Ruling: add three actual post-story missions after frontier-dawn so the final discovery opens a playable system. Total is 39 missions and 78 decisions, exceeding the minimum 36/72.
- Ruling: add a separate revisioned v4 recovery copy. Versioned assets cannot by themselves stop a cached legacy v3 runtime from overwriting the primary save.
- Ruling: localization checker treats toast.badge tierLow as the explicitly supported lowercase alias of tier; both are provided by game.js. Existing Spanish/French grammar preserved.
- Independent review identified hot/fallback bypass, invisible event hit tests, clock boundary leaks, corrupt recovery lock, snapshot rewards, invalid fleet IDs, stale writes and legacy-client erasure. Each was addressed; browser regression includes reproductions.
- Verification: v2-run 8 suites PASS; 234 balance routes; all 39 missions reachable with prerequisites; 5 content/UI languages; expanded browser PASS; local online 6 sections no runtime errors; 60s p95 16.7ms; Worker peak utilization 0.004290 in three conservative 48h profiles.
- Candidate VERSION 2.0.0 prepared locally; no live deployment, push, or user-save access.
- Final full regression and final review were pending at this checkpoint. See the final status below.

## Son uygulama durumu

| Plan işleri | Uygulama | Kanıt |
|---|---|---|
| 1–3 | Test tabanı, göç ve dünya grafiği | baseline/core/localization + browser |
| 4–5 | Sefer saati ve oynanabilir görevler | core/content/mechanics + browser |
| 6–8 | Atlas, kamp ve dünya çizim entegrasyonu | browser, klasik layout, görsel inceleme |
| 9–11 | Gökyüzü/kozmos/uzak evren, filo ve final sonrası hedef | mechanics/fleet/content/localization |
| 12 | Süre, ödül ve üst sınır ölçümleri | balance/reach/performance-browser |
| 13 | Yerel sürüm adayı, sürüm notları, varlık sürümleme, kurtarma | browser, keys, yerel online ve klasik regresyon |

- Independent final review: no remaining P1 in save paths after quota/recovery fixes (reviewer used current functions with simulated failures).
- Legacy mixed-version base progress is not merged automatically; latest v3 snapshot archived. This limitation is explicit in the release checklist.
- UI review found mobile close hit capture; failing assertion reproduced it, pointer capture now ignores header buttons, browser suite passed.
- No auto-commit, merge, push or production deployment was performed. All source and documentation remain reviewable in the shared checkout.

- Son tarayıcı kabulü geçti. Kampanya testi dünyaları önceden açmadan Yeryüzü’nden son üç sefere kadar ilerledi. Klasik regresyon tamamlandı. Eski rapordaki dil uyarısı, son ayrı dil koşusunda yeniden görülmedi.
