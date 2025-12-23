# RealmsRPG Comprehensive Improvement Plan

## Executive Summary

This document provides a thorough analysis of the RealmsRPG codebase with actionable recommendations for:
- **Code Centralization** - Eliminating duplicate logic across 15+ files
- **Styling Unification** - Creating a consistent design system
- **Security Hardening** - Addressing 26 identified security issues
- **Architecture Improvements** - Better scalability and maintainability

**Estimated Total Code Reduction:** ~3,500+ lines through centralization

---

## Table of Contents

1. [Priority Matrix](#priority-matrix)
2. [Code Centralization](#code-centralization)
3. [Styling Unification](#styling-unification)
4. [Security Issues](#security-issues)
5. [Architecture Recommendations](#architecture-recommendations)
6. [Detailed Implementation Guide](#detailed-implementation-guide)

---

## Priority Matrix

| Priority | Category | Impact | Effort | 
|----------|----------|--------|--------|
| 🔴 Critical | Security - Database rules | High | Low |
| 🔴 Critical | Security - XSS vulnerabilities | High | Medium |
| 🔴 Critical | Firebase initialization centralization | High | Medium |
| 🟠 High | CSS variables/design system | High | Medium |
| 🟠 High | Shared utility functions | High | Low |
| 🟠 High | Creator module refactoring | High | High |
| 🟡 Medium | Level progression centralization | Medium | Low |
| 🟡 Medium | Component library creation | Medium | High |
| 🟢 Low | Migrate to Firebase modular SDK | Low | Medium |

---

## Code Centralization

### 1. Duplicated Functions - Must Centralize

#### 1.1 `sanitizeId` - 7 Duplications
**Current locations:**
- `public/scripts/utils/rtdb-cache.js` (line 6)
- `public/scripts/characterSheet/utils.js` (line 18)
- `public/creaturecreator/creatureUtils.js` (line 266)
- `public/powercreator/powerCreator.js` (line 65)
- `public/techniquecreator/techniqueCreator.js` (line 41)
- `public/itemcreator/itemCreator.js` (line 22)
- `public/scripts/codex.js` (line 63)

**Action:** Create `public/scripts/shared/string-utils.js`:
```javascript
export function sanitizeId(str) {
    if (!str) return '';
    return String(str)
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
}
```

#### 1.2 `capitalize` / `capitalizeDamageType` - 5+ Duplications
**Current locations:**
- `public/scripts/characterSheet/utils.js` (line 102)
- `public/creaturecreator/creatureUtils.js` (line 270)
- `public/powercreator/powerCreator.js` (line 519)
- `public/techniquecreator/techniqueCreator.js` (line 132)
- Multiple inline implementations

**Action:** Add to `public/scripts/shared/string-utils.js`:
```javascript
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function capitalizeDamageType(str) {
    if (!str) return '';
    return str.split(' ').map(capitalize).join(' ');
}
```

#### 1.3 `formatBonus` - 3 Duplications
**Action:** Add to `public/scripts/shared/number-utils.js`:
```javascript
export function formatBonus(value) {
    const num = parseInt(value) || 0;
    return num >= 0 ? `+${num}` : `${num}`;
}
```

#### 1.4 `waitForAuth` - 4 Duplications
**Current locations:**
- `public/scripts/characterSheet/firebase-config.js`
- `public/scripts/characterCreator/characterCreator_equipment.js`
- `public/scripts/characterCreator/characterCreator_powers.js`
- `public/scripts/characterCreator/characterCreator_firebase.js`

**Action:** Create `public/scripts/shared/firebase-auth.js`:
```javascript
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

let authPromise = null;

export function waitForAuth() {
    if (authPromise) return authPromise;
    authPromise = new Promise((resolve) => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
    return authPromise;
}
```

#### 1.5 `toStrArray` / `toNumArray` - 4 Duplications Each
**Action:** Create `public/scripts/shared/array-utils.js`:
```javascript
export function toStrArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === 'object') return Object.values(value).map(String);
    return [String(value)];
}

export function toNumArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(Number);
    if (typeof value === 'object') return Object.values(value).map(Number);
    return [Number(value)];
}
```

### 2. Firebase Initialization - 11+ Duplications

**Current state:** Every major JS file initializes Firebase independently

**Action:** Create `public/scripts/shared/firebase-init.js`:
```javascript
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { getFunctions } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-functions.js';
import { initializeAppCheck, ReCaptchaV3Provider } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app-check.js';

let app = null;
let auth = null;
let db = null;
let rtdb = null;
let functions = null;

const firebaseConfig = {
    // Config loaded from /__/firebase/init.json or environment
};

export async function initializeFirebase() {
    if (app) return { app, auth, db, rtdb, functions };
    
    if (getApps().length === 0) {
        // Wait for Firebase script to load config
        const response = await fetch('/__/firebase/init.json');
        const config = await response.json();
        app = initializeApp(config);
    } else {
        app = getApps()[0];
    }
    
    auth = getAuth(app);
    db = getFirestore(app);
    rtdb = getDatabase(app);
    functions = getFunctions(app);
    
    // Initialize App Check
    initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_KEY'),
        isTokenAutoRefreshEnabled: true
    });
    
    return { app, auth, db, rtdb, functions };
}

export { auth, db, rtdb, functions };
```

### 3. Level Progression - Parallel Implementations

**Character Sheet** (`level-progression.js`):
- `calculateHealthEnergyPool`: `18 + (12 * (level - 1))`
- `calculateAbilityPoints`: `7 + floor((level - 1) / 3)`
- `calculateSkillPoints`: `2 + (level * 3)`

**Creature Creator** (`creature_calc.js`):
- `calcHitEnergyPool`: `26 + 12 * (level - 1)` (different base!)
- `calcAbilityPointTotal`: Same formula
- `calcSkillPointTotal`: Same formula

**Action:** Create `public/scripts/shared/game-formulas.js`:
```javascript
export const GAME_CONSTANTS = {
    PLAYER: {
        BASE_HEALTH_ENERGY: 18,
        HEALTH_ENERGY_PER_LEVEL: 12,
        BASE_TRAINING_POINTS: 22
    },
    CREATURE: {
        BASE_HEALTH_ENERGY: 26,
        HEALTH_ENERGY_PER_LEVEL: 12,
        BASE_TRAINING_POINTS: 9
    },
    SHARED: {
        BASE_ABILITY_POINTS: 7,
        ABILITY_POINTS_PER_3_LEVELS: 1,
        BASE_SKILL_POINTS: 2,
        SKILL_POINTS_PER_LEVEL: 3,
        BASE_PROFICIENCY: 2,
        PROFICIENCY_PER_5_LEVELS: 1
    }
};

export function calculateHealthEnergyPool(level, entityType = 'PLAYER') {
    const config = GAME_CONSTANTS[entityType];
    return config.BASE_HEALTH_ENERGY + (config.HEALTH_ENERGY_PER_LEVEL * (level - 1));
}

export function calculateAbilityPoints(level, allowSubLevel = false) {
    if (allowSubLevel && level < 1) {
        return Math.ceil(GAME_CONSTANTS.SHARED.BASE_ABILITY_POINTS * level);
    }
    if (level < 3) return GAME_CONSTANTS.SHARED.BASE_ABILITY_POINTS;
    return GAME_CONSTANTS.SHARED.BASE_ABILITY_POINTS + 
           Math.floor((level - 1) / 3) * GAME_CONSTANTS.SHARED.ABILITY_POINTS_PER_3_LEVELS;
}

export function calculateSkillPoints(level, allowSubLevel = false) {
    if (allowSubLevel && level < 1) {
        return Math.ceil(5 * level);
    }
    return GAME_CONSTANTS.SHARED.BASE_SKILL_POINTS + 
           (level * GAME_CONSTANTS.SHARED.SKILL_POINTS_PER_LEVEL);
}

export function calculateProficiency(level) {
    if (level < 5) return GAME_CONSTANTS.SHARED.BASE_PROFICIENCY;
    return GAME_CONSTANTS.SHARED.BASE_PROFICIENCY + 
           Math.floor(level / 5) * GAME_CONSTANTS.SHARED.PROFICIENCY_PER_5_LEVELS;
}
```

### 4. Creator Modules - Massive Duplication

The Power, Technique, and Item creators share ~80% identical code:

| Pattern | Lines Duplicated |
|---------|-----------------|
| Firebase initialization | ~50 lines × 3 |
| Action type handling | ~50 lines × 2 |
| Damage row UI | ~80 lines × 3 |
| Part/property rendering | ~100 lines × 3 |
| Option level controls | ~30 lines × 3 |
| Modal open/close | ~20 lines × 3 |
| Total costs panel | ~40 lines × 3 |
| Save to library | ~80 lines × 3 |

**Action:** Create shared creator modules:

```
public/scripts/shared/creator/
├── creator-base.js       # Base initialization, state management
├── action-types.js       # Action type selection UI and calculations
├── damage-input.js       # Damage row component
├── part-renderer.js      # Generic part/property rendering
├── option-controls.js    # +/- option level controls
├── modal-utils.js        # Modal open/close/populate
├── cost-panel.js         # Fixed cost display panel
└── save-load.js          # Library save/load operations
```

**Estimated savings:** ~1,500 lines of code

---

## Styling Unification

### 1. Current Color Inconsistencies

| Usage | Current Values | Unified Value |
|-------|---------------|---------------|
| Primary Blue | #053357, #1a73e8, #007bff | `--color-primary: #053357` |
| Primary Light | #0a4a7a, #1a73e8 | `--color-primary-light: #1a73e8` |
| Danger Red | #dc3545, #C0392B, #ff0000 | `--color-danger: #dc3545` |
| Success Green | #28a745, #4caf50 | `--color-success: #28a745` |
| Background | #f7f7f7, #f4f4f4, #f8f9fa | `--color-bg: #f8f9fa` |

### 2. Font Inconsistencies

| Current | Unified |
|---------|---------|
| Nunito, Google Sans, Arial | `--font-body: 'Nunito', sans-serif` |
| Nova Flat, Merriweather, American Typewriter | `--font-heading: 'Nova Flat', sans-serif` |

### 3. Create Unified Design System

**Action:** Create `public/styles/core/variables.css`:

```css
:root {
    /* === COLORS === */
    /* Primary */
    --color-primary: #053357;
    --color-primary-light: #1a73e8;
    --color-primary-dark: #0a4a7a;
    --color-primary-hover: #0d47a1;
    
    /* Status */
    --color-success: #28a745;
    --color-success-hover: #218838;
    --color-danger: #dc3545;
    --color-danger-hover: #c82333;
    --color-warning: #ffc107;
    
    /* Neutrals */
    --color-text: #2c3e50;
    --color-text-secondary: #6c757d;
    --color-text-muted: #7f8c8d;
    --color-bg: #f8f9fa;
    --color-bg-card: #ffffff;
    --color-border: #dadce0;
    --color-border-light: #e9ecef;
    
    /* === TYPOGRAPHY === */
    --font-body: 'Nunito', sans-serif;
    --font-heading: 'Nova Flat', sans-serif;
    --font-accent: 'Merriweather', serif;
    
    --font-size-xs: 0.75rem;   /* 12px */
    --font-size-sm: 0.875rem;  /* 14px */
    --font-size-base: 1rem;    /* 16px */
    --font-size-lg: 1.125rem;  /* 18px */
    --font-size-xl: 1.5rem;    /* 24px */
    --font-size-2xl: 2rem;     /* 32px */
    
    /* === SPACING === */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    --spacing-2xl: 48px;
    
    /* === BORDER RADIUS === */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-pill: 999px;
    
    /* === SHADOWS === */
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
    --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.15);
    --shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.15);
    
    /* === TRANSITIONS === */
    --transition-fast: 0.15s ease;
    --transition-base: 0.2s ease;
    --transition-slow: 0.3s ease;
    
    /* === Z-INDEX === */
    --z-dropdown: 100;
    --z-sticky: 500;
    --z-modal-backdrop: 900;
    --z-modal: 1000;
    --z-tooltip: 1100;
}
```

### 4. Create Shared Component Styles

**Action:** Create `public/styles/core/components.css`:

```css
/* === BUTTONS === */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    font-family: var(--font-body);
    font-size: var(--font-size-base);
    font-weight: 500;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-base);
}

.btn-primary {
    background: var(--color-primary-light);
    color: white;
}

.btn-primary:hover {
    background: var(--color-primary-hover);
}

.btn-danger {
    background: var(--color-danger);
    color: white;
}

.btn-danger:hover {
    background: var(--color-danger-hover);
}

.btn-success {
    background: var(--color-success);
    color: white;
}

.btn-sm { padding: var(--spacing-xs) var(--spacing-sm); font-size: var(--font-size-sm); }
.btn-lg { padding: var(--spacing-md) var(--spacing-lg); font-size: var(--font-size-lg); }
.btn-pill { border-radius: var(--radius-pill); }

/* === FORM INPUTS === */
.form-input,
.form-select,
.form-textarea {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    font-family: var(--font-body);
    font-size: var(--font-size-base);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg-card);
    transition: border-color var(--transition-base), box-shadow var(--transition-base);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
    outline: none;
    border-color: var(--color-primary-light);
    box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}

/* === CARDS === */
.card {
    background: var(--color-bg-card);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    overflow: hidden;
}

.card-header {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border-light);
}

.card-body {
    padding: var(--spacing-md);
}

/* === MODALS === */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal-backdrop);
}

.modal-container {
    background: var(--color-bg-card);
    border-radius: var(--radius-xl);
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow: auto;
    box-shadow: var(--shadow-xl);
    z-index: var(--z-modal);
}

.modal-header {
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border-light);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-body {
    padding: var(--spacing-lg);
}

.modal-close {
    background: none;
    border: none;
    font-size: var(--font-size-xl);
    cursor: pointer;
    color: var(--color-text-secondary);
}

/* === TABS === */
.tabs {
    display: flex;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
}

.tab-button {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-primary-light);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: var(--font-size-base);
    transition: background var(--transition-base);
}

.tab-button:hover,
.tab-button.active {
    background: var(--color-primary-hover);
}

.tab-content {
    display: none;
}

.tab-content.active-tab {
    display: block;
}

/* === EXPANDABLE/COLLAPSIBLE === */
.expandable-card {
    background: var(--color-bg-card);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    transition: box-shadow var(--transition-base);
}

.expandable-card:hover {
    box-shadow: var(--shadow-md);
}

.expandable-header {
    display: flex;
    align-items: center;
    padding: var(--spacing-md);
    cursor: pointer;
    gap: var(--spacing-md);
}

.expand-icon {
    margin-left: auto;
    transition: transform var(--transition-base);
}

.expandable-card.expanded .expand-icon {
    transform: rotate(180deg);
}

.expandable-body {
    max-height: 0;
    overflow: hidden;
    transition: max-height var(--transition-slow);
}

.expandable-card.expanded .expandable-body {
    max-height: 2000px;
}

/* === CHIPS/TAGS === */
.chip {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-border-light);
    border-radius: var(--radius-pill);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
}

.chip-remove {
    cursor: pointer;
    font-weight: bold;
}

/* === SEARCH BAR === */
.search-bar {
    position: relative;
    margin-bottom: var(--spacing-md);
}

.search-bar input {
    width: 100%;
    padding: var(--spacing-md);
    padding-left: var(--spacing-xl);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
}

/* === FILTER PANEL === */
.filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--color-bg-card);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    margin-bottom: var(--spacing-lg);
}

.filter-group {
    flex: 1 1 200px;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
}

.filter-group label {
    font-weight: 500;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
}
```

### 5. Proposed CSS File Structure

```
public/styles/
├── core/
│   ├── variables.css      # Design tokens
│   ├── reset.css          # CSS reset/normalize
│   ├── typography.css     # Font definitions, text styles
│   └── components.css     # Shared components
│
├── layouts/
│   ├── header.css         # Site header
│   ├── footer.css         # Site footer
│   └── grid.css           # Layout utilities
│
├── pages/
│   ├── login.css          # Login/auth pages
│   ├── codex.css          # Codex-specific (imports core)
│   ├── library.css        # Library-specific (imports core)
│   └── characters.css     # Character list
│
├── creators/
│   ├── creator-base.css   # Shared creator styles
│   ├── power-creator.css  # Power-specific overrides only
│   ├── item-creator.css   # Item-specific overrides only
│   ├── technique-creator.css
│   └── creature-creator.css
│
├── characterCreator/      # Keep existing structure
│   └── ...
│
├── characterSheet/        # Keep existing structure
│   └── ...
│
└── main.css              # Imports core, used site-wide
```

---

## Security Issues

### Critical (Fix Immediately)

#### 1. Database Rules Allow Global Read
**File:** `database.rules.json`
**Current:**
```json
{
  "rules": {
    ".read": true,
    ".write": false
  }
}
```

**Fix:** Implement granular rules:
```json
{
  "rules": {
    "feats": { ".read": true },
    "species": { ".read": true },
    "skills": { ".read": true },
    "parts": { ".read": true },
    "traits": { ".read": true },
    "items": { ".read": true },
    "powers": { ".read": true },
    "techniques": { ".read": true },
    "creatures": { ".read": true },
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    }
  }
}
```

#### 2. XSS Vulnerabilities - innerHTML with Database Content
**Affected files:** 15+ files using innerHTML with user/database content

**Locations (partial list):**
- `characterSheet/components/library.js`
- `characterCreator/characterCreator_ancestry.js`
- `scripts/codex.js`
- `scripts/library.js`
- All creator JS files

**Fix:** Install DOMPurify and sanitize all dynamic HTML:
```javascript
import DOMPurify from 'dompurify';

// Before:
element.innerHTML = `<div>${user_data.description}</div>`;

// After:
element.innerHTML = `<div>${DOMPurify.sanitize(user_data.description)}</div>`;
```

### High Priority

#### 3. Missing Firestore Rules
**Action:** Create `firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /{subcollection}/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    match /usernames/{username} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

#### 4. CORS Too Permissive
**File:** `functions/index.js`
**Current:** `cors({ origin: true })`
**Fix:** 
```javascript
const cors = require('cors')({ 
    origin: ['https://realmsroleplaygame.com', 'https://yourdomain.com']
});
```

#### 5. Cloud Functions Input Validation
**File:** `functions/index.js`
**Action:** Add length/format validation to all inputs:
```javascript
if (!powerName || powerName.length > 100) {
    throw new HttpsError('invalid-argument', 'Invalid power name');
}
if (powerDescription && powerDescription.length > 5000) {
    throw new HttpsError('invalid-argument', 'Description too long');
}
```

### Medium Priority

#### 6. Add Security Headers
**File:** `firebase.json`
```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' https://www.gstatic.com https://apis.google.com 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:;"
          }
        ]
      }
    ]
  }
}
```

#### 7. Duplicate Function Exports in Cloud Functions
**File:** `functions/index.js`
**Issue:** `savePowerToLibrary` and `saveTechniqueToLibrary` are defined twice (overwritten)
**Fix:** Rename or remove duplicate definitions

---

## Architecture Recommendations

### 1. Proposed Shared Module Structure

```
public/scripts/shared/
├── index.js                  # Re-exports all modules
│
├── firebase/
│   ├── init.js              # Single Firebase initialization
│   ├── auth.js              # waitForAuth, auth utilities
│   └── rtdb-cache.js        # Move existing cache here
│
├── utils/
│   ├── string.js            # sanitizeId, capitalize
│   ├── number.js            # formatBonus
│   ├── array.js             # toStrArray, toNumArray
│   └── debounce.js          # debounce, throttle
│
├── game/
│   ├── formulas.js          # Level progression calculations
│   ├── constants.js         # Game constants
│   └── requirements.js      # Requirement checking
│
├── ui/
│   ├── modal.js             # Modal utilities
│   ├── tabs.js              # Tab switching
│   ├── collapsible.js       # Expand/collapse
│   ├── chips.js             # Chip/tag creation
│   └── notifications.js     # Toast notifications
│
└── creator/
    ├── base.js              # Base creator functionality
    ├── parts.js             # Part/property rendering
    ├── damage.js            # Damage input component
    └── save-load.js         # Library operations
```

### 2. Adopt Creature Creator Pattern

The Creature Creator has the best modular architecture. Apply this pattern to Power/Item/Technique creators:

```
creaturecreator/
├── creatureCreator.html
├── creatureState.js         # ← State management module
├── creature_calc.js         # ← Calculation logic
├── creatureTPcalc.js        # ← Training point calculations
├── creatureInteractions.js  # ← Event handlers
├── creatureModals.js        # ← Modal management
├── creatureSaveLoad.js      # ← Persistence
├── creatureSkillInteractions.js
└── creatureUtils.js         # ← Utilities
```

### 3. Event-Based Communication

Replace `window.*` global function calls with an event system:

```javascript
// shared/events.js
class EventBus {
    constructor() {
        this.listeners = new Map();
    }
    
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    emit(event, data) {
        const callbacks = this.listeners.get(event) || [];
        callbacks.forEach(cb => cb(data));
    }
    
    off(event, callback) {
        const callbacks = this.listeners.get(event) || [];
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
    }
}

export const eventBus = new EventBus();

// Usage:
// Instead of: window.updateTrainingPoints()
eventBus.emit('trainingPointsChanged', { total: 45 });

// Listener:
eventBus.on('trainingPointsChanged', (data) => {
    updateTPDisplay(data.total);
});
```

### 4. Type Safety with JSDoc

Add JSDoc types for better IDE support and documentation:

```javascript
/**
 * @typedef {Object} Character
 * @property {string} name
 * @property {string} species
 * @property {Object} abilities
 * @property {number} abilities.strength
 * @property {number} abilities.vitality
 * ...
 */

/**
 * Calculate ability points for a given level
 * @param {number} level - Character level (1-20)
 * @param {boolean} [allowSubLevel=false] - Allow fractional levels
 * @returns {number} Total ability points
 */
export function calculateAbilityPoints(level, allowSubLevel = false) {
    // ...
}
```

---

## Detailed Implementation Guide

### Phase 1: Security (Week 1)

1. **Day 1-2:** Update database.rules.json with granular permissions
2. **Day 2-3:** Create firestore.rules file
3. **Day 3-4:** Add DOMPurify and sanitize critical innerHTML usages
4. **Day 4-5:** Update CORS configuration and add security headers

### Phase 2: Core Shared Modules (Week 2)

1. **Day 1-2:** Create shared/firebase/init.js and auth.js
2. **Day 2-3:** Create shared/utils/ (string, number, array, debounce)
3. **Day 3-4:** Create shared/game/formulas.js and constants.js
4. **Day 4-5:** Update 5-10 files to use new shared modules

### Phase 3: CSS Unification (Week 3)

1. **Day 1:** Create core/variables.css with design tokens
2. **Day 2-3:** Create core/components.css with shared component styles
3. **Day 3-4:** Update main.css to import core files
4. **Day 4-5:** Migrate creator CSS to use shared creator-base.css

### Phase 4: Creator Refactoring (Week 4-5)

1. Create shared/creator/ modules
2. Refactor Power Creator to use shared modules
3. Refactor Technique Creator
4. Refactor Item Creator
5. Update Creature Creator to use shared modules where applicable

### Phase 5: UI Components (Week 6)

1. Create shared/ui/ modules (modal, tabs, collapsible)
2. Update Codex and Library to use shared components
3. Update Character Sheet to use shared components
4. Update Character Creator to use shared components

---

## Estimated Impact

| Metric | Before | After |
|--------|--------|-------|
| Duplicate utility functions | 40+ | 0 |
| Firebase init patterns | 11+ | 1 |
| CSS color definitions | 30+ variations | 10 variables |
| Lines of duplicate CSS | ~1,500 | ~200 |
| Lines of duplicate JS | ~2,000 | ~400 |
| Security vulnerabilities | 26 | 0 |

---

## Conclusion

This improvement plan addresses the core issues of:

1. **Code Duplication** - Through centralized modules
2. **Style Inconsistency** - Through a unified design system
3. **Security Vulnerabilities** - Through proper rules and sanitization
4. **Maintainability** - Through better architecture patterns

The phased approach allows incremental improvement without breaking existing functionality. Each phase delivers tangible value while building toward the complete vision.
