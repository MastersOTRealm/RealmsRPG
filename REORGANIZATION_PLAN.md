# RealmsRPG Codebase Reorganization Plan

## Executive Summary
This document outlines a comprehensive reorganization of the RealmsRPG public folder to follow 2025 best practices for modular CSS, HTML, and JavaScript websites.

---

## Current Issues Identified

### 1. **Inconsistent Creator Tool Organization**
- Creator tools are scattered: `creaturecreator/`, `itemcreator/`, `powercreator/`, `techniquecreator/`, `realm-master-tools/`
- Some have their own CSS files inside (itemCreator.css), others reference `styles/`
- Inconsistent naming: camelCase vs kebab-case

### 2. **Scripts Organization**
- `scripts/utils/` only contains `rtdb-cache.js` - should be merged with `shared/`
- Calculator modules (`power_calc.js`, `technique_calc.js`, `item_calc.js`) at root level should be grouped
- `encounter-tracker.js` is at scripts root but belongs with its tool

### 3. **Styles Organization**
- Feature CSS files at styles root (`codex.css`, `library.css`, etc.) should be in feature folders
- `characterCreator/` and `characterSheet/` are organized well but naming could be clearer
- Some CSS files use underscores, others use kebab-case

### 4. **HTML Files**
- All HTML at public root except tool-specific ones in subfolders
- `ExampleSave.html` is test/sample data - should be in a dev folder or removed
- Partial HTML files (`header.html`, `footer.html`) should be in a `partials/` or `includes/` folder

### 5. **Naming Inconsistencies**
- `characterCreator.html` vs `creatureCreator.html` (first at root, second in subfolder)
- File naming: camelCase (`characterCreator_main.js`) vs kebab-case (`encounter-tracker.js`)

---

## Proposed New Structure

```
public/
├── index.html                          # Homepage
├── partials/                           # Reusable HTML components
│   ├── header.html
│   └── footer.html
│
├── pages/                              # Main app pages
│   ├── characters.html                 # Characters list
│   ├── character-sheet.html            # Single character view (renamed)
│   ├── character-creator.html          # Character creation (moved, renamed)
│   ├── codex.html                      # Game rules codex
│   ├── library.html                    # User's items library
│   ├── my-account.html                 # User account (renamed)
│   ├── login.html
│   ├── register.html
│   ├── forgot-password.html
│   ├── forgot-username.html
│   ├── rules.html
│   ├── resources.html
│   ├── privacy.html
│   ├── terms.html
│   └── 404.html
│
├── tools/                              # Creator/editor tools (unified)
│   ├── creature-creator/               # Renamed from creaturecreator
│   │   └── index.html
│   ├── item-creator/                   # Renamed from itemcreator
│   │   └── index.html
│   ├── power-creator/                  # Renamed from powercreator
│   │   └── index.html
│   ├── technique-creator/              # Renamed from techniquecreator
│   │   └── index.html
│   └── encounter-tracker/              # Moved from realm-master-tools
│       └── index.html
│
├── js/                                 # Renamed from scripts (industry standard)
│   ├── core/                           # Core utilities and initialization
│   │   ├── firebase-init.js            # Moved from shared/
│   │   ├── auth.js                     # Moved from scripts root
│   │   └── rtdb-cache.js               # Moved from utils/
│   │
│   ├── shared/                         # Shared utility modules
│   │   ├── index.js                    # Main export barrel
│   │   ├── string-utils.js
│   │   ├── number-utils.js
│   │   ├── array-utils.js
│   │   ├── dom-utils.js
│   │   ├── chip-utils.js
│   │   └── game-formulas.js
│   │
│   ├── calculators/                    # Game calculation modules (renamed)
│   │   ├── power-calc.js               # Renamed from power_calc.js
│   │   ├── technique-calc.js           # Renamed from technique_calc.js
│   │   └── item-calc.js                # Renamed from item_calc.js
│   │
│   ├── pages/                          # Page-specific scripts
│   │   ├── characters.js
│   │   ├── codex.js
│   │   └── library.js
│   │
│   ├── character-sheet/                # Renamed from characterSheet
│   │   ├── main.js
│   │   ├── firebase-config.js
│   │   ├── data.js
│   │   ├── calculations.js
│   │   ├── interactions.js
│   │   ├── validation.js
│   │   ├── level-progression.js
│   │   ├── utils/
│   │   │   └── data-enrichment.js
│   │   └── components/
│   │       ├── header.js
│   │       ├── abilities.js
│   │       ├── skills.js
│   │       ├── archetype.js
│   │       ├── roll-log.js
│   │       ├── modal/
│   │       │   ├── modal-core.js
│   │       │   ├── modal.js
│   │       │   ├── equipment-modal.js
│   │       │   ├── feat-modal.js
│   │       │   ├── skill-modal.js
│   │       │   └── library-modals.js
│   │       ├── library/
│   │       │   ├── library.js
│   │       │   ├── feats.js
│   │       │   ├── inventory.js
│   │       │   ├── notes.js
│   │       │   ├── powers.js
│   │       │   ├── proficiencies.js
│   │       │   └── techniques.js
│   │       └── shared/
│   │           └── collapsible-row.js
│   │
│   ├── character-creator/              # Renamed from characterCreator
│   │   ├── main.js                     # Renamed from characterCreator_main.js
│   │   ├── firebase.js                 # Renamed from characterCreator_firebase.js
│   │   ├── storage.js                  # Renamed from characterCreator_storage.js
│   │   ├── utils.js                    # Renamed from characterCreator_utils.js
│   │   ├── tabs.js                     # Renamed from characterCreator_tabs.js
│   │   ├── archetype.js                # Renamed from characterCreator_archetype.js
│   │   ├── ancestry.js                 # Renamed from characterCreator_ancestry.js
│   │   ├── abilities.js                # Renamed from characterCreator_abilities.js
│   │   ├── skills.js                   # Renamed from characterCreator_skills.js
│   │   ├── feats.js                    # Renamed from characterCreator_feats.js
│   │   ├── equipment.js                # Renamed from characterCreator_equipment.js
│   │   └── powers.js                   # Renamed from characterCreator_powers.js
│   │
│   ├── codex/                          # Codex display modules
│   │   ├── core.js
│   │   ├── equipment.js
│   │   ├── feats.js
│   │   ├── parts.js
│   │   ├── properties.js
│   │   ├── skills.js
│   │   └── species.js
│   │
│   └── tools/                          # Tool-specific scripts
│       ├── creature-creator/
│       │   ├── main.js                 # Renamed from creatureCreator.js
│       │   ├── state.js                # Renamed from creatureState.js
│       │   ├── utils.js                # Renamed from creatureUtils.js
│       │   ├── calc.js                 # Renamed from creature_calc.js
│       │   ├── tp-calc.js              # Renamed from creatureTPcalc.js
│       │   ├── interactions.js         # Renamed from creatureInteractions.js
│       │   ├── modals.js               # Renamed from creatureModals.js
│       │   ├── save-load.js            # Renamed from creatureSaveLoad.js
│       │   └── skill-interactions.js   # Renamed from creatureSkillInteractions.js
│       │
│       ├── item-creator/
│       │   └── main.js                 # Renamed from itemCreator.js
│       │
│       ├── power-creator/
│       │   └── main.js                 # Renamed from powerCreator.js
│       │
│       ├── technique-creator/
│       │   └── main.js                 # Renamed from techniqueCreator.js
│       │
│       └── encounter-tracker/
│           └── main.js                 # Renamed from encounter-tracker.js
│
├── css/                                # Renamed from styles (industry standard)
│   ├── core/                           # Design system tokens and base
│   │   ├── variables.css
│   │   ├── reset.css
│   │   ├── typography.css
│   │   ├── components.css
│   │   ├── chips.css
│   │   ├── creator-base.css
│   │   └── listing-shared.css
│   │
│   ├── layouts/                        # Layout patterns (NEW)
│   │   └── main.css                    # Moved/extracted from main.css
│   │
│   ├── pages/                          # Page-specific styles
│   │   ├── home.css                    # Extracted from main.css
│   │   ├── login.css
│   │   ├── codex.css
│   │   └── library.css
│   │
│   ├── character-sheet/                # Renamed from characterSheet
│   │   ├── main.css
│   │   ├── header.css
│   │   ├── abilities.css
│   │   ├── skills.css
│   │   ├── archetype.css
│   │   ├── library.css
│   │   ├── modal.css
│   │   └── roll-log.css
│   │
│   ├── character-creator/              # Renamed from characterCreator
│   │   ├── main.css                    # Renamed from character-creator.css
│   │   ├── variables.css               # Renamed from _variables.css
│   │   ├── base.css
│   │   ├── layout.css
│   │   ├── utils.css
│   │   └── components/
│   │       ├── tabs.css
│   │       ├── archetype.css
│   │       ├── dropdown.css
│   │       ├── modal.css
│   │       ├── ancestry-grid.css
│   │       ├── ancestry-traits.css
│   │       ├── abilities.css
│   │       ├── skills.css
│   │       ├── feats.css
│   │       ├── equipment.css
│   │       └── buttons.css
│   │
│   └── tools/                          # Tool-specific styles
│       ├── creature-creator.css
│       ├── item-creator.css
│       ├── power-creator.css
│       ├── technique-creator.css
│       └── encounter-tracker.css
│
├── images/                             # Static images (no change)
│
├── data/                               # NEW: Static data/config files
│   └── dataconnect/                    # Moved from public root
│       ├── dataconnect.yaml
│       ├── connector/
│       └── schema/
│
└── dev/                                # NEW: Development/test files
    └── example-save.html               # Renamed and moved ExampleSave.html
```

---

## File Rename Mapping

### HTML Files
| Current Location | New Location |
|-----------------|--------------|
| `public/characterCreator.html` | `public/pages/character-creator.html` |
| `public/characterSheet.html` | `public/pages/character-sheet.html` |
| `public/characters.html` | `public/pages/characters.html` |
| `public/codex.html` | `public/pages/codex.html` |
| `public/library.html` | `public/pages/library.html` |
| `public/myAccount.html` | `public/pages/my-account.html` |
| `public/login.html` | `public/pages/login.html` |
| `public/register.html` | `public/pages/register.html` |
| `public/forgot-password.html` | `public/pages/forgot-password.html` |
| `public/forgot-username.html` | `public/pages/forgot-username.html` |
| `public/rules.html` | `public/pages/rules.html` |
| `public/resources.html` | `public/pages/resources.html` |
| `public/privacy.html` | `public/pages/privacy.html` |
| `public/terms.html` | `public/pages/terms.html` |
| `public/404.html` | `public/pages/404.html` |
| `public/header.html` | `public/partials/header.html` |
| `public/footer.html` | `public/partials/footer.html` |
| `public/ExampleSave.html` | `public/dev/example-save.html` |
| `public/creaturecreator/creatureCreator.html` | `public/tools/creature-creator/index.html` |
| `public/itemcreator/itemCreator.html` | `public/tools/item-creator/index.html` |
| `public/powercreator/powerCreator.html` | `public/tools/power-creator/index.html` |
| `public/techniquecreator/techniqueCreator.html` | `public/tools/technique-creator/index.html` |
| `public/realm-master-tools/encounter-tracker.html` | `public/tools/encounter-tracker/index.html` |

### JavaScript Files - scripts → js
| Current Location | New Location |
|-----------------|--------------|
| `scripts/auth.js` | `js/core/auth.js` |
| `scripts/utils/rtdb-cache.js` | `js/core/rtdb-cache.js` |
| `scripts/shared/firebase-init.js` | `js/core/firebase-init.js` |
| `scripts/shared/*.js` | `js/shared/*.js` |
| `scripts/power_calc.js` | `js/calculators/power-calc.js` |
| `scripts/technique_calc.js` | `js/calculators/technique-calc.js` |
| `scripts/item_calc.js` | `js/calculators/item-calc.js` |
| `scripts/characters.js` | `js/pages/characters.js` |
| `scripts/codex.js` | `js/pages/codex.js` |
| `scripts/library.js` | `js/pages/library.js` |
| `scripts/encounter-tracker.js` | `js/tools/encounter-tracker/main.js` |
| `scripts/characterSheet/*` | `js/character-sheet/*` |
| `scripts/characterCreator/*` | `js/character-creator/*` (with renames) |
| `scripts/codex/*` | `js/codex/*` |
| `creaturecreator/*.js` | `js/tools/creature-creator/*.js` (with renames) |
| `itemcreator/itemCreator.js` | `js/tools/item-creator/main.js` |
| `powercreator/powerCreator.js` | `js/tools/power-creator/main.js` |
| `techniquecreator/techniqueCreator.js` | `js/tools/technique-creator/main.js` |

### CSS Files - styles → css
| Current Location | New Location |
|-----------------|--------------|
| `styles/main.css` | `css/layouts/main.css` + `css/pages/home.css` (split) |
| `styles/login.css` | `css/pages/login.css` |
| `styles/codex.css` | `css/pages/codex.css` |
| `styles/library.css` | `css/pages/library.css` |
| `styles/core/*` | `css/core/*` |
| `styles/characterSheet/*` | `css/character-sheet/*` |
| `styles/characterCreator/*` | `css/character-creator/*` |
| `styles/creatureCreator.css` | `css/tools/creature-creator.css` |
| `styles/powerCreator.css` | `css/tools/power-creator.css` |
| `styles/techniqueCreator.css` | `css/tools/technique-creator.css` |
| `styles/encounter-tracker.css` | `css/tools/encounter-tracker.css` |
| `itemcreator/itemCreator.css` | `css/tools/item-creator.css` |

---

## Import/Export Updates Required

### 1. HTML Script/Style References
All HTML files need updated paths:
- `href="/styles/..."` → `href="/css/..."`
- `src="/scripts/..."` → `src="/js/..."`
- Fetch calls for `header.html` and `footer.html` → `/partials/...`

### 2. JavaScript Import Paths
All JS modules need updated import paths:
- `from './characterCreator_*.js'` → `from './*.js'`
- `from '/scripts/shared/...'` → `from '/js/shared/...'`
- `from '/scripts/characterSheet/...'` → `from '/js/character-sheet/...'`
- Calculator imports need path updates

### 3. CSS @import Paths
All CSS files need updated @import paths:
- `@import './core/...'` → Adjust relative paths
- `@import '../styles/...'` → `@import '/css/...'`

---

## Implementation Order

1. **Phase 1: Create new directory structure** (empty folders)
2. **Phase 2: Move core/shared files first** (firebase-init, utilities)
3. **Phase 3: Move calculator modules**
4. **Phase 4: Move page-specific scripts**
5. **Phase 5: Move feature modules** (character-sheet, character-creator, codex)
6. **Phase 6: Move tool modules** (all creator tools)
7. **Phase 7: Move CSS files**
8. **Phase 8: Move HTML files**
9. **Phase 9: Update all imports/exports**
10. **Phase 10: Verify and test**

---

## Benefits of This Structure

1. **Clear separation of concerns**: Core, shared, pages, tools
2. **Consistent naming**: All kebab-case
3. **Industry standard folders**: `js/`, `css/` instead of `scripts/`, `styles/`
4. **Scalable**: Easy to add new pages or tools
5. **Maintainable**: Clear where each type of file belongs
6. **Modern**: Follows 2025 best practices for modular web apps
