# Idles 'n Dragons — Roadmap 3 (Revision #3)

## PHASE 9: Bug Fixes [x] COMPLETE
> **Goal:** Fix speed boost revert bug and sound slider drag issues.
> **Source:** `user_revisions_3.md`

### 9.1 — Fix 5x Speed Buff Not Reverting to Previous Speed
**Files:** `src/store/useAdStore.js`, `src/store/useGameStore.js`, `src/ui/components/AdButtons.jsx`, `src/ui/HUD/HUD.jsx`

**Root Cause (two issues):**
1. `checkBoosts()` hardcoded revert to `setTimeMultiplier(1)` instead of reverting to user's previously selected speed (1x/2x/3x)
2. `checkBoosts()` was only called on save load, never during active gameplay — so boost expiry was never triggered in real-time

**Fix Applied:**
- [x] Added `previousTimeMultiplier` field to `useGameStore` state
- [x] `setTimeMultiplier()` now saves `previousTimeMultiplier` when setting non-boost speeds (1-3x)
- [x] `activateSpeedBoost()` saves current multiplier to `previousTimeMultiplier` before overriding to 5x
- [x] `checkBoosts()` reverts to `previousTimeMultiplier` instead of hardcoded `1`
- [x] SpeedBoostButton's 1-second interval now calls `checkBoosts()` alongside timer display update
- [x] Moved `<SpeedBoostButton />` from top-left resources panel to right of speed control buttons (1x/2x/3x/5x) for better UX

### 9.2 — Fix Sound Slider Drag Behavior
**Files:** `src/ui/Panels/SettingsPanel.jsx`, `src/index.css`

**Root Cause:**
1. `VolumeSlider` was defined inside the render function, causing React to unmount/remount the `<input>` on every state change — killing the drag
2. CSS `transform: scale(1.2)` on active thumb caused layout shift mid-drag

**Fix Applied:**
- [x] Extracted `VolumeSlider` as a standalone `React.memo` component with local state for drag tracking
- [x] Uses `onInput` for live audio preview during drag, `onChange`/`onPointerUp` for final store commit
- [x] `isDragging` ref prevents parent re-renders from interrupting the drag
- [x] Replaced CSS `transform: scale(1.2)` with `box-shadow` highlight on active thumb (both WebKit and Firefox)
- [x] Removed unused `RefreshCw` import

### Phase 9 Testing
- [x] 5x boost reverts to previously selected speed (e.g., 3x) when timer expires
- [x] 5x button now appears next to 1x/2x/3x speed controls
- [x] Sound sliders drag smoothly without stuttering
- [x] Build succeeds with zero errors

---

## PHASE 10: UX Improvements [x] COMPLETE
> **Goal:** Improve item selection menu usability.
> **Source:** `user_revisions_3.md`

### 10.1 — Sort Item Selection by Rarity (High to Low)
**Files:** `src/ui/Panels/CharacterDetailsPanel.jsx`

- [x] Equipment picker now sorts items: Legendary > Epic > Rare > Uncommon > Common
- [x] Uses inline `RARITY_SORT` array for sort order, applied after `getItemsForSlot()` call
- [x] No changes to store layer — sorting is UI-only

---

## PHASE 11: Code Clean-Up [x] COMPLETE
> **Goal:** Remove dead code, fix runtime bugs discovered during audit.
> **Source:** `user_revisions_3.md`

### 11.1 — Fix Runtime Bug: showToast Crash
**Files:** `src/ui/App.jsx`

- [x] Fixed `useGameStore.getState().showToast()` calls (method doesn't exist) — replaced with `useToastStore.getState().addToast()` via dynamic import
- [x] Affected: offline earnings double (ad success) and ad failure handlers

### 11.2 — Remove Unused Imports
| File | Removed |
|------|---------|
| `src/ui/Panels/MainMenuPanel.jsx` | `Scroll` icon |
| `src/ui/Panels/CreditsPanel.jsx` | `Github` icon |
| `src/ui/Panels/ResultsPanel.jsx` | `Clock`, `MapPin` icons |
| `src/ui/HUD/HUD.jsx` | `Zap`, `FastForward`, `TrendingUp` icons |
| `src/ui/Panels/SettingsPanel.jsx` | `RefreshCw` icon |

### 11.3 — Remove Unused CSS
**File:** `src/index.css`

- [x] Removed unused CSS classes: `.text-arcane`, `.text-danger`
- [x] Removed unused keyframe animations: `fadeOut`, `pulseGlow`, `shimmer`, `borderGlow`

---

## PHASE 12: Test Updates [x] COMPLETE
> **Goal:** Expand test coverage and fix outdated tests.
> **Source:** `user_revisions_3.md`

### 12.1 — Fix Existing Flaky Test
**File:** `test/useLootStore.test.js`

- [x] Updated drop rate test: changed expected range from 35-65% to 15-40% to match current `dropChance: 0.25` (was 0.5 pre-balance)

### 12.2 — New Test Files (6 files, 60 new tests)

| Test File | Store | Tests |
|-----------|-------|-------|
| `test/useAdStore.test.js` | Ad/Boost system | 12 |
| `test/useToastStore.test.js` | Toast notifications | 7 |
| `test/useTutorialStore.test.js` | Tutorial progression | 14 |
| `test/useAchievementStore.test.js` | Achievement tracking | 10 |
| `test/useDailyRewardStore.test.js` | Daily rewards | 10 |
| `test/useEventStore.test.js` | Random events | 7 |

**Key test scenarios covered:**
- Speed boost activation, previous speed saving, and expiry revert
- Gold/speed boost cooldowns and save/load
- Toast consolidation (gold/XP within 1.5s window), auto-removal, max cap
- Tutorial step progression, action callbacks, skip/restart, save/load
- Achievement unlock logic, tracker increments, re-unlock prevention
- Daily reward claiming, streak wrapping, missed-day reset
- Event rolling, resolution, buff management, save/load

### Phase 12 Results
- [x] **14 test files, 123 tests — all passing**
- [x] Previous: 8 files, 63 tests (1 flaky)
- [x] Current: 14 files, 123 tests (0 failing)
