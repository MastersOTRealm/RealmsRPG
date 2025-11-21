// Placeholder character for testing character sheet
// This matches the exact format stored in Firestore

export const PLACEHOLDER_CHARACTER = {
  // Basic Info
  name: "Gath",
  species: "Mountain Dwarf",
  size: "Medium",
  gender: "male",
  level: 1,
  xp: 0,
  portrait: null, // Will show placeholder
  
  // Archetype
  mart_prof: 2,
  pow_prof: 0,
  mart_abil: "Strength",
  pow_abil: "Charisma", // Explicitly set power ability (even though pow_prof is 0)
  
  // Abilities (grouped)
  abilities: {
    strength: 3,
    vitality: 2,
    agility: 0,
    acuity: -1,
    intelligence: 1,
    charisma: -2
  },
  
  // Defense investments (NOT scores or bonuses)
  defenseVals: {
    might: 0,
    fortitude: 0,
    reflex: 1,
    discernment: 0,
    mentalFortitude: 0,
    resolve: 0
  },
  
  // Traits (array of strings)
  traits: [
    "Darkvision",
    "Stone Cunning",
    "Dwarven Resilience",
    "Athletic",
    "Brave"
  ],
  
  // Skills (array of objects)
  skills: [
    {
      name: "Athletics",
      skill_val: 2,
      ability: "Strength",
      prof: true
    },
    {
      name: "Intimidation",
      skill_val: 1,
      ability: "Strength",
      prof: true
    },
    {
      name: "Survival",
      skill_val: 0,
      ability: "Acuity",
      prof: false // -1 acuity, unprof -> -1 * 2 = -2 bonus
    },
    {
      name: "Craft",
      skill_val: 1,
      ability: "Intelligence",
      prof: true
    },
    {
      name: "Deception",
      skill_val: 0,
      ability: "Charisma",
      prof: false // -2 charisma, unprof -> -2 * 2 = -4 bonus
    }
  ],
  
  // Sub-skills (array of objects)
  subSkills: [
    {
      name: "Blacksmithing",
      baseSkill: "Craft",
      skill_val: 2,
      ability: "Intelligence",
      prof: true
    },
    {
      name: "Climbing",
      baseSkill: "Athletics",
      skill_val: 0,
      ability: "Strength",
      prof: false
    }
  ],
  
  // Feats (array of objects with full details)
  feats: [
    {
      name: "Power Attack",
      category: "Archetype",
      description: "As part of making a melee attack, you may choose to take a penalty to your attack roll equal to your martial proficiency. If you hit, add twice that penalty as a bonus to the damage roll.",
      uses: null,
      currentUses: null,
      recovery: null,
      active: true
    },
    {
      name: "Cleave",
      category: "Archetype",
      description: "When you reduce a creature to 0 hit points with a melee attack, you may immediately make another melee attack against a different creature within range as a free action.",
      uses: null,
      currentUses: null,
      recovery: null,
      active: true
    },
    {
      name: "Toughness",
      category: "Archetype",
      description: "Your maximum health increases by 2 for each level you have.",
      uses: null,
      currentUses: null,
      recovery: null,
      active: true
    },
    {
      name: "Lucky",
      category: "Character",
      description: "You may reroll any d20 roll you make. You must use the new result.",
      uses: 3,
      currentUses: 2,
      recovery: "FULL RECOVERY",
      active: false
    },
    {
      name: "Mountain Born",
      category: "Ancestry",
      description: "You're acclimated to high altitude, including elevations above 20,000 feet. You're also naturally adapted to cold climates.",
      uses: null,
      currentUses: null,
      recovery: null,
      active: true
    }
  ],
  
  // Equipment (arrays of item names or objects with details)
  equipment: [
    { name: "Healing Potion", quantity: 3 },
    { name: "Rope (50ft)", quantity: 1 },
    { name: "Lantern", quantity: 1 },
    { name: "Rations", quantity: 7 },
    { name: "Whetstone", quantity: 1 }
  ],
  
  // Weapons (array of objects with full stats)
  weapons: [
    {
      name: "Greataxe",
      attackBonus: 5,
      damage: "2d12",
      damageType: "Slashing",
      range: "Melee",
      properties: ["Heavy", "Two-Handed"]
    },
    {
      name: "Handaxe",
      attackBonus: 5,
      damage: "1d6",
      damageType: "Slashing",
      range: "Melee / 20ft",
      properties: ["Light", "Thrown"]
    }
  ],
  
  // Armor (array of objects with full stats)
  armor: [
    {
      name: "Plate Armor",
      damageReduction: 3,
      critRange: "19-20",
      abilityReq: { strength: 2 },
      properties: ["Heavy", "Noisy"]
    }
  ],
  
  // Powers & Techniques (array of objects with full details)
  powers: [],
  
  techniques: [
    {
      name: "Devastating Strike",
      energy: 2,
      range: "Melee",
      damage: "Weapon + 2d6",
      description: "You put all your strength into a single devastating blow. Make a melee weapon attack. On a hit, add 2d6 to the damage roll."
    },
    {
      name: "Whirlwind Attack",
      energy: 3,
      range: "Melee",
      damage: "Weapon",
      description: "You spin in a deadly circle. Make a melee weapon attack against each creature within your reach."
    }
  ],
  
  // Health & Energy Allocation
  health_energy_points: {
    health: 8,
    energy: 6
  },
  
  // Current resources (tracked separately from max)
  currentHealth: undefined,
  currentEnergy: undefined,
  
  // Character Details
  appearance: "A stocky dwarf with a braided black beard adorned with iron rings. Battle scars cross his weathered face, and his eyes gleam with fierce determination. He carries a massive greataxe on his back.",
  archetypeDesc: "A battle-hardened warrior who relies on raw strength and martial prowess. Gath has spent years perfecting the art of combat, favoring devastating two-handed weapons.",
  notes: "Gath grew up in the Mountain Halls of Kazad-Karak, learning smithing from his father. After his clan's mine was overrun by goblins, he took up the greataxe and vowed to become strong enough to reclaim his homeland.",
  weight: "95",
  height: "140",
  
  // Additional metadata
  innateEnergy: 0
};

// Helper function to get placeholder character (for testing)
export function getPlaceholderCharacter() {
  const clone = JSON.parse(JSON.stringify(PLACEHOLDER_CHARACTER));
  // Strip any accidental precomputed defense data (must be recalculated)
  delete clone.defenses;
  delete clone.defenseBonuses;
  delete clone.defenseScores;
  return clone;
}
