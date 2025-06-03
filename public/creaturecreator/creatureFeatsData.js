const creatureFeatsData = [
  {
    name: "Pack Tactics",
    description: "Gain +1 to hit target while you and an ally are within one space of a target creature. +1 Per level of this feat.",
    cost: 1
  },
  {
    name: "Uncanny Dodge",
    description: "When you are hit by an attack you can use a quick reaction to reduce the attack's damage by half.",
    cost: 3
  },
  {
    name: "Bounding",
    description: "When an enemy comes within one space of you, you may use a quick reaction to move up to half of your speed.",
    cost: 1.5
  },
  {
    name: "Regional Revival",
    description: "If this creature dies in a specified region or realm it comes back to life somewhere within 10 kilometers of where it died in 1d10 days.",
    cost: 2
  },
  {
    name: "All-Surface Climber",
    description: "Can climb on difficult vertical and horizontal surfaces, even upside down, without needing to make a Climb Roll.",
    cost: 2
  },
  {
    name: "Sun Sickness",
    description: "When in sunlight this creature has -5 to all Rolls and Scores.",
    cost: -1
  },
  {
    name: "Sun Sickness II",
    description: "When in sunlight this creature has -5 to all Rolls and Scores. This creature dies if it remains in the sun for one hour.",
    cost: -2
  },
  {
    name: "Compression",
    description: "This creature can move through spaces as small as 3 centimeters. Movement through these spaces requires no extra movement.",
    cost: 1.5
  },
  {
    name: "Unflankable",
    description: "This creature cannot be flanked.",
    cost: 1
  },
  {
    name: "Mimic",
    description: "Can mimic any sound heard exactly, including voices, using Act against target's Discernment.",
    cost: 1
  },
  {
    name: "Water Movement",
    description: "This creature ignores flanking when moving underwater. If this creature takes the movement action more than once in turn it can take it again as a free action.",
    cost: 1
  },
  {
    name: "Condition Immunity",
    description: "This creature is immune to a condition. +1 condition per level of this feat.",
    cost: 1
  },
  {
    name: "Unrestrained Movement",
    description: "This creature ignores difficult terrain, the slowed condition, and any other effect that would slow its movement due to environmental effects.",
    cost: 1.5
  },
  {
    name: "Resources",
    description: "This creature has 1.5x the normal currency for obtaining equipment or its equivalent in natural weapons, armor, and equipment.",
    cost: 2
  },
  {
    name: "Resources II",
    description: "This creature has 3x the normal currency for obtaining equipment or its equivalent in natural weapons, armor, and equipment.",
    cost: 4
  },
  {
    name: "Hover",
    description: "This creature must end its turn within 1 space of the ground, but need not touch it. Only applicable if the creature has a flying speed. -1 per level of flying speed.",
    cost: -1
  },
  {
    name: "Telepathically Intune",
    description: "Can perceive content of all telepathic communication within 12 spaces.",
    cost: 1
  },
  {
    name: "Hard to Stand Up",
    description: "If this creature has the prone condition it must succeed on a Might roll DS 10 when it attempts to stand or remain prone. It can only attempt to stand from prone once each turn, and the movement to stand is spent whether it stands or not.",
    cost: -0.5
  },
  {
    name: "Undetectable",
    description: "Powers with detection parts cannot target this creature.",
    cost: 1
  },
  {
    name: "Mute",
    description: "Can understand known languages, but cannot speak them.",
    cost: 0
  },
  {
    name: "First Strike",
    description: "This creature has +5 to initiative rolls.",
    cost: 1
  },
  {
    name: "Quick Hide",
    description: "This creature can take the Hide action as a quick action.",
    cost: 1
  },
  {
    name: "Turns to Dust",
    description: "When this creature dies it turns into dust, leaving behind all items it was wearing, carrying, or had eaten.",
    cost: -0.5
  },
  {
    name: "Beast of Burden",
    description: "This creature counts as one size larger when determining carrying capacity.",
    cost: 0.5
  },
  {
    name: "Claws and Fangs",
    description: "Spend an additional BP when learning Unarmed Prowess to add Weakened 1 to the creature's first Unarmed Prowess attack each turn.",
    cost: 1
  },
  {
    name: "Regenerative",
    description: "Regain 10 HP at the start of each turn.",
    cost: 2
  },
  {
    name: "Regenerative II",
    description: "Regain 15 HP at the start of each turn.",
    cost: 3
  },
  {
    name: "Regenerative III",
    description: "Regain 20 HP at the start of each turn.",
    cost: 4
  },
  {
    name: "Elemental Affinity",
    description: "Add half of the creature's archetype proficiency to the damage of their attacks as a chosen elemental damage type.",
    cost: 1
  },
  {
    name: "Elemental Affinity II",
    description: "Add the creature's archetype proficiency to the damage of their attacks as a chosen elemental damage type.",
    cost: 2
  },
  {
    name: "Elemental Affinity III",
    description: "Add the creature's archetype bonus to the damage of their attacks as a chosen elemental damage type.",
    cost: 3
  },
  {
    name: "Instinct",
    description: "Add 3 to checks using Perceive with any physical sense; this also applies to Passive Perceive. The creature may ignore the effects of negative Acuity on Perceive.",
    cost: 1
  },
  {
    name: "Instinct II",
    description: "Add 5 to checks using Perceive with any physical sense; this also applies to Passive Perceive. The creature may ignore the effects of negative Acuity on Perceive.",
    cost: 2
  },
  {
    name: "Jaws",
    description: "On a critical strike with unarmed prowess or natural weapons, you have a 1/8 chance to break a bone.",
    cost: 1
  },
  {
    name: "Lycanthrope",
    description: "Spend a quick action to transform into a special hybrid form for up to 10 rounds. While in this form, gain +1 to unarmed prowess or natural weapon damage.",
    cost: 1
  },
  {
    name: "Lycanthrope II",
    description: "Same as Lycanthropy but additionally reduce 1 damage taken from all physical attacks from non-silvered weapons.",
    cost: 2
  },
  {
    name: "Lycanthrope III",
    description: "Same as Lycanthropy II, but when you make an unarmed attack on your turn, you may spend a quick action to make another unarmed attack.",
    cost: 3
  },
  {
    name: "Fear Response",
    description: "When this creature is bloodied, and when it enters terminal, it must make a DS 8 Resolve check or become frightened.",
    cost: -1
  },
  {
    name: "Mindless Rage",
    description: "When this creature is bloodied, and when it enters terminal, it must make a DS 8 Mental Fortitude check or become unable to distinguish friend from foe.",
    cost: -1
  },
  {
    name: "Champion",
    description: "This creature gains 5 Action Points at the start of combat and at the end of each turn. The Multiple Action Penalty for this creature is 4.",
    cost: 2
  },
  {
    name: "Champion II",
    description: "This creature gains 6 Action Points at the start of combat and at the end of each turn. The Multiple Action Penalty for this creature is 3.",
    cost: 3
  },
  {
    name: "Champion III",
    description: "This creature takes two turns during combat encounters. It rolls initiative for its first turn as normal. Its second turn occurs second-to-last in the combat round order.",
    cost: 4
  },
  {
    name: "Champion IV",
    description: "This creature takes two turns during combat encounters. It rolls initiative for its first turn as normal. Its second turn occurs second-to-last in the combat round order. This creature gains 5 Action Points at the start of combat and at the end of each turn. The Multiple Action Penalty for the creature is 4.",
    cost: 5
  },
  {
    name: "Champion V",
    description: "This creature takes two turns during combat encounters. It rolls initiative for its first turn as normal. Its second turn occurs second-to-last in the combat round order. This creature gains 6 Action Points at the start of combat and at the end of each turn. The Multiple Action Penalty for the creature is 3.",
    cost: 6
  },
  {
    name: "Champion VI",
    description: "This creature takes three turns during combat encounters. It rolls initiative for its first turn as normal, and for its second turn with a -5. Its third turn occurs second-to-last in the combat round order.",
    cost: 7
  }
];

export default creatureFeatsData;