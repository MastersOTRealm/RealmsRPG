
const geneticFeats = [
    {
        Name: "Example Feat",
        Description: "Description of the feat.",
        Level: 5,
        Requirements: "Strength 3",
        Uses: 3,
        Recovery: "Partial Recovery",
        FeatType: "Genetic/Species Trait/Ancestry Trait/Flaw/Characteristic",
        Category: "Offensive",
        Tags: ["attack", "strength", "damage"],
        FEvasion: 0,
        FStrength: 5,
        FVitality: 0,
        FAgility: 0,
        FIntellegence: 0,
        FCharisma: 0,
        FSpeed: 0,
        FPowerAttack: 10,
        FPowerDamage: 15,
        FStrengthAttack: 5,
        FStrengthDamage: 10,
        FAgilityAttack: 0,
        FAgilityDamage: 0,
        FAcuityAttack: 0,
        FAcuityDamage: 0,
        FTerminal: 0,
        FMight: 0,
        FFortitude: 0,
        FReflex: 0,
        FDiscernment: 0,
        FMentalFort: 0,
        FResolve: 0
    },
    {
        Name: "Experienced",
        Description: "Choose a skill from a previous level. When rolling with that skill, treat a success as one degree higher. You choose which skill this is after each full recovery.",
        FeatType: "Species Trait",
        Category: "General",
        Tags: ["skill", "proficiency", "improvement"],
        Recovery: "Full Recovery"
      },
      {
        Name: "Man's Arrogance",
        Description: "When you get a critical failure, treat it as 1 degree lower. If you get a critical failure while attacking, one of your targets may attack you as a 1 AP reaction.",
        FeatType: "Flaw",
        Category: "General",
        Tags: ["critical failure", "vulnerability", "reaction"]
      },
      {
        Name: "Rich History",
        Description: "You have +2 to any Lore skill rolls that relate to a location you have lived (up to 2 locations). Treat these rolls as if you have the Lore subskill, even if you haven’t allocated any skill points into 'Lore.'",
        FeatType: "Species Trait",
        Category: "Knowledge",
        Tags: ["lore", "skill", "history"],
        FDiscernment: 2
      },
        {
        Name: "Super Natural",
        Description: "You must be a level higher to meet the requirements for supernatural features.",
        FeatType: "Flaw",
        Category: "General",
        Tags: ["supernatural", "requirements", "level"]
      },
      {
        Name: "Natural Dexterity",
        Description: "You have +1 species movement speed. Any skills that grant movement speed give you an additional +1 movement speed.",
        FeatType: "Ancestry Trait",
        Category: "Movement",
        Tags: ["movement", "speed", "dexterity"],
        FSpeed: 2
      },
      {
        Name: "Inconspicuous",
        Description: "People naturally overlook you because of your common heritage.",
        FeatType: "Characteristic",
        Category: "Social",
        Tags: ["social", "stealth", "inconspicuous"]
      },
      {
        Name: "Family Craft",
        Description: "Choose one acquired crafting skill. You gain +2 when rolling with that skill. This can stack with the 'Experienced' species trait.",
        FeatType: "Ancestry Trait",
        Category: "Crafting",
        Tags: ["crafting", "skill", "bonus"]
      },
      {
        Name: "Strong Will",
        Description: "Attacks that force you to take actions against your will are made with disadvantage.",
        FeatType: "Ancestry Trait",
        Category: "Defense",
        Tags: ["willpower", "resistance", "disadvantage"]
      },
      {
        Name: "Battle Born",
        Description: "Add your Martial Bonus (not relevant abilities) to any weapon you wield, even if you are not proficient.",
        FeatType: "Ancestry Trait",
        Category: "Combat",
        Tags: ["martial", "weapon", "proficiency"]
      },
      {
        Name: "Scholarly Aptitude",
        Description: "The first point allocated to each skill counts as 2 points.",
        FeatType: "Ancestry Trait",
        Category: "Learning",
        Tags: ["skill", "learning", "aptitude"]
      },
      {
        Name: "Natural Diplomat",
        Description: "When you succeed a Charisma check to Persuade, Deceive, or Charm treat it as one degree of higher success.",
        FeatType: "Ancestry Trait",
        Category: "Social",
        Tags: ["charisma", "persuade", "deceive", "charm"]
      },
      {
        Name: "Experienced",
        Description: "Choose a skill from a previous level. When rolling with that skill, treat a success as one degree higher. You choose which skill this is after each full recovery.",
        FeatType: "Species Trait",
        Category: "General",
        Tags: ["skill", "proficiency", "improvement"],
        Recovery: "Full Recovery"
      },
      {
        Name: "Man's Arrogance",
        Description: "When you get a critical failure, treat it as 1 degree lower. If you get a critical failure while attacking, one of your targets may attack you as a 1 AP reaction.",
        FeatType: "Flaw",
        Category: "General",
        Tags: ["critical failure", "vulnerability", "reaction"]
      },
      {
        Name: "Rich History",
        Description: "You have +2 to any Lore skill rolls that relate to a location you have lived (up to 2 locations). Treat these rolls as if you have the Lore subskill, even if you haven’t allocated any skill points into 'Lore.'",
        FeatType: "Species Trait",
        Category: "Knowledge",
        Tags: ["lore", "skill", "history"],
        FDiscernment: 2
      },
        {
        Name: "Super Natural",
        Description: "You must be a level higher to meet the requirements for supernatural features.",
        FeatType: "Flaw",
        Category: "General",
        Tags: ["supernatural", "requirements", "level"]
      },
      {
        Name: "Natural Dexterity",
        Description: "You have +1 species movement speed. Any skills that grant movement speed give you an additional +1 movement speed.",
        FeatType: "Ancestry Trait",
        Category: "Movement",
        Tags: ["movement", "speed", "dexterity"],
        FSpeed: 2
      },
      {
        Name: "Inconspicuous",
        Description: "People naturally overlook you because of your common heritage.",
        FeatType: "Ancestry Trait",
        Category: "Social",
        Tags: ["social", "stealth", "inconspicuous"]
      },
      {
        Name: "Family Craft",
        Description: "Choose one acquired crafting skill. You gain +2 when rolling with that skill. This can stack with the 'Experienced' species trait.",
        FeatType: "Ancestry Trait",
        Category: "Crafting",
        Tags: ["crafting", "skill", "bonus"]
      },
      {
        Name: "Strong Will",
        Description: "Attacks that force you to take actions against your will are made with disadvantage.",
        FeatType: "Ancestry Trait",
        Category: "Defense",
        Tags: ["willpower", "resistance", "disadvantage"]
      },
      {
        Name: "Battle Born",
        Description: "Add your Martial Bonus (not relevant abilities) to any weapon you wield, even if you are not proficient.",
        FeatType: "Ancestry Trait",
        Category: "Combat",
        Tags: ["martial", "weapon", "proficiency"]
      },
      {
        Name: "Scholarly Aptitude",
        Description: "The first point allocated to each skill counts as 2 points.",
        FeatType: "Ancestry Trait",
        Category: "Learning",
        Tags: ["skill", "learning", "aptitude"]
      },
      {
        Name: "Natural Diplomat",
        Description: "When you succeed a Charisma check to Persuade, Deceive, or Charm treat it as one degree of higher success.",
        FeatType: "Ancestry Trait",
        Category: "Social",
        Tags: ["charisma", "persuade", "deceive", "charm"]
      },
      {
        Name: "Darkvision II",
        Description: "You can see in darkness out to 12 spaces, but only in shades of gray.",
        FeatType: "Species Trait",
        Category: "Senses",
        Tags: ["darkvision", "sight"]
      },
      {
        Name: "Umbral Sight",
        Description: "Your Vigilance to detect obscured objects or creatures in darkness is increased by 5. Skill checks using sight to detect these can be made with advantage.",
        FeatType: "Species Trait",
        Category: "Senses",
        Tags: ["vigilance", "sight", "darkness", "advantage"]
      },
      {
        Name: "Eclipsing",
        Description: "Twice per partial recovery, you may use a quick action to extinguish all flames within 30 feet of you and dampen all light to dim light within that area until the start of your next turn.",
        FeatType: "Ancestry Trait",
        Category: "Abilities",
        Tags: ["light", "darkness", "quick action"],
        Recovery: "Partial Recovery"
      },
      {
        Name: "Fearful Aura",
        Description: "You have advantage on rolls to intimidate and add a degree of success to the roll.",
        FeatType: "Ancestry Trait",
        Category: "Social",
        Tags: ["intimidate", "advantage", "social"]
      },
      {
        Name: "Born for Oblivion",
        Description: "When you add the destruction power part to a power, you may triple the damage done to objects, paying the same energy cost. Increasing its power deals quadruple damage instead.",
        FeatType: "Ancestry Trait",
        Category: "Combat",
        Tags: ["destruction", "damage", "objects", "power"]
      },
      {
        Name: "Cursed Knowledge",
        Description: "Once per partial recovery, when you fail a check to recall information, you may reroll, taking the new result. After using this trait, you can use it again at the cost of half your Energy.",
        FeatType: "Ancestry Trait",
        Category: "Knowledge",
        Tags: ["knowledge", "reroll", "information", "energy"],
        Recovery: "Partial Recovery"
      },
      {
        Name: "Within Shadow",
        Description: "While in dark or dim lighting, you may use a quick action to become invisible until you move or attack.",
        FeatType: "Ancestry Trait",
        Category: "Movement",
        Tags: ["shadow", "invisibility", "quick action", "movement"]
      },
      {
        Name: "Shadow Stride",
        Description: "When in dim or dark lighting, you may ignore difficult terrain.",
        FeatType: "Ancestry Trait",
        Category: "Movement",
        Tags: ["shadow", "difficult terrain", "movement"]
      },
      {
        Name: "Light Adversity",
        Description: "When a power would make you take light damage and requires you to make a save, you have disadvantage on that save.",
        FeatType: "Flaw",
        Category: "Defense",
        Tags: ["light damage", "save", "disadvantage"]
      },
      {
        Name: "Corruptible Nature",
        Description: "Darkin are vulnerable to corruption, making them susceptible to effects that inflict charm, fear, or possession. When a power would make you roll a save, you have disadvantage.",
        FeatType: "Flaw",
        Category: "Defense",
        Tags: ["corruption", "charm", "fear", "possession", "disadvantage"]
      },
      {
        Name: "Destructive Impulses",
        Description: "You suffer from chaotic urges, causing you to occasionally act on destructive impulses. When you roll a 1 on any attack roll to hit, the GM may force you to make a Charisma save with a DC of 10. Failing the save will force you to take your next action to attack an ally if they're within range for you to do so.",
        FeatType: "Flaw",
        Category: "Combat",
        Tags: ["destructive", "impulses", "attack", "charisma save"]
      },
      {
        Name: "Duality",
        Description: "You have dissonance within you, with darkness and light each seeking a portion of your being. Whenever you are tempted to choose darkness and choose light instead, you gain insight into the potential outcomes of your darker decision, and vice versa.",
        FeatType: "Characteristic",
        Category: "Roleplaying",
        Tags: ["duality", "darkness", "light", "insight"]
      },
      {
        Name: "Grim Gaze",
        Description: "Your dark eyes are more unsettling than most of your kin. When looking at someone intently, they feel greatly unsettled. (Your GM may choose how this applies.)",
        FeatType: "Characteristic",
        Category: "Social",
        Tags: ["gaze", "unsettling", "social"]
      },
      {
        Name: "Echoes of Whispers",
        Description: "You sometimes hear whispers echoing through the darkness. On occasion, when someone is talking about you without you knowing, you hear muffled talking that has no discernible tones or words.",
        FeatType: "Characteristic",
        Category: "Roleplaying",
        Tags: ["whispers", "darkness", "eavesdropping"]
      },
      {
        Name: "Umbral Tracker",
        Description: "You can see misty traces of life while in darkness. If you succeed on a roll to track by 1 or more degrees of success, misty shadows start emanating from places the thing you're tracking was.",
        FeatType: "Characteristic",
        Category: "Tracking",
        Tags: ["tracking", "darkness", "shadows"]
      },
      {
        Name: "Melodic Speech",
        Description: "Your words carry a hint of darkness, either portraying the oblivion held within darkness or the power of darkness to eclipse all else.",
        FeatType: "Characteristic",
        Category: "Roleplaying",
        Tags: ["speech", "darkness", "roleplaying"]
      },
      {
        Name: "Dark Presence",
        Description: "You carry a part of darkness with you everywhere. Flames are naturally subdued when you're within one space of them.",
        FeatType: "Characteristic",
        Category: "Environment",
        Tags: ["darkness", "flames", "presence"]
      }
];
