# Archetype System Usage Guide

## Overview

The archetype system determines character progression bonuses based on martial and power proficiency levels. This system handles three archetype types:

1. **Power Archetype** (Martial Prof = 0, Power Prof > 0)
2. **Martial Archetype** (Power Prof = 0, Martial Prof > 0) 
3. **Mixed Archetype** (Both Martial Prof > 0 and Power Prof > 0)

## Basic Usage

```javascript
import { 
    getLevelProgression,
    calculateArchetypeProgression,
    applyArchetypeChoice,
    getArchetypeChoiceBenefits
} from './level-progression.js';

// Get full progression for a level 10 character
const progression = getLevelProgression(
    10,              // level
    4,               // highest archetype ability
    2,               // martial proficiency
    1,               // power proficiency
    {                // archetype choices (for mixed archetype)
        4: 'innate', // At level 4, chose +1 threshold/pools
        7: 'feat',   // At level 7, chose +1 archetype feat
        10: 'innate' // At level 10, chose +1 threshold/pools again
    }
);

console.log(progression);
// Output includes: innateThreshold, innatePools, innateEnergy, 
// bonusArchetypeFeats, armamentProficiency, etc.
```

## Archetype Types & Bonuses

### Pure Power Archetype
- **Conditions**: Martial Prof = 0, Power Prof > 0
- **Bonuses**: 
  - Innate Threshold: 8 + 1 every 3 levels (starting at level 4)
  - Innate Pools: 2 + 1 every 3 levels (starting at level 4)
  - Innate Energy: Threshold × Pools

### Pure Martial Archetype  
- **Conditions**: Power Prof = 0, Martial Prof > 0
- **Bonuses**:
  - Bonus Archetype Feats: 2 + 1 every 3 levels (starting at level 4)

### Mixed Archetype
- **Conditions**: Both Martial Prof > 0 and Power Prof > 0
- **Base Values**:
  - Innate Threshold: 6
  - Innate Pools: 1
  - Bonus Archetype Feats: 1
- **Choices**: Every 3 levels starting at level 4, choose:
  - `'innate'`: +1 Threshold & +1 Pools
  - `'feat'`: +1 Bonus Archetype Feat

## Handling Choices for Mixed Archetype

```javascript
// Start with empty choices
let archetypeChoices = {};

// Player reaches level 4 and chooses innate power boost
const result1 = applyArchetypeChoice(
    archetypeChoices, 
    4,           // milestone level
    'innate',    // choice: 'innate' or 'feat'
    2,           // martial prof
    1            // power prof
);

if (result1.success) {
    archetypeChoices = result1.choices;
}

// Player reaches level 7 and chooses combat expertise
const result2 = applyArchetypeChoice(
    archetypeChoices,
    7,
    'feat',
    2,
    1
);

if (result2.success) {
    archetypeChoices = result2.choices;
}
```

## Handling Proficiency Changes

When a player changes their proficiencies, you need to clean invalid choices:

```javascript
import { cleanInvalidArchetypeChoices } from './level-progression.js';

// Player had choices for mixed archetype but changes to pure martial
let oldChoices = { 4: 'innate', 7: 'feat' };

// Clean choices after proficiency change (Power Prof becomes 0)
const cleanedChoices = cleanInvalidArchetypeChoices(
    oldChoices,
    10,  // current level
    2,   // new martial prof
    0    // new power prof (now pure martial)
);

console.log(cleanedChoices); // {} - all choices removed since no longer mixed
```

## Armament Proficiency Calculation

```javascript
import { calculateArmamentProficiency } from './level-progression.js';

console.log(calculateArmamentProficiency(0)); // 3
console.log(calculateArmamentProficiency(1)); // 8  
console.log(calculateArmamentProficiency(2)); // 12
console.log(calculateArmamentProficiency(3)); // 15
console.log(calculateArmamentProficiency(4)); // 18
```

## Integration with Character Sheet

The character sheet should:

1. **Store archetype choices** in character data alongside proficiencies
2. **Display choice UI** when mixed archetype reaches milestone levels
3. **Recalculate bonuses** when proficiencies change
4. **Clean invalid choices** when archetype type changes
5. **Show current progression** including all archetype bonuses

Example character data structure:
```javascript
const characterData = {
    level: 10,
    mart_prof: 2,
    pow_prof: 1,
    archetypeChoices: {
        4: 'innate',
        7: 'feat', 
        10: 'innate'
    },
    // ... other character data
};
```