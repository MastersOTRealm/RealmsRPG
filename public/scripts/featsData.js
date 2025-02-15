export const featsData = [
    {
        Name: "Example Feat",
        Description: "Description of the feat.",
        Level: 5,
        Requirements: "Strength 3",
        Uses: 3,
        Recovery: "Partial Recovery",
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
        Name: "Berserk",
        Description: "While in Terminal, increase your Strength by +1/4 (rounded up).",
        Requirements: "Strength of at least 2",
        Category: "Ability Increase",
        Tags: ["Terminal"],
        FStrength: 1.25
    },
    {
        Name: "Berserk II",
        Description: "While in Terminal, increase your Strength by +1/2 (rounded up).",
        Requirements: "Strength of at least 3",
        Category: "Ability Increase",
        Tags: ["Terminal"],
        FStrength: 1.5
    },
    {
        Name: "Berserk III",
        Description: "While in Terminal, double your Strength.",
        Requirements: "Level of at least 10, Strength of at least 4, and at least one other Strength Feat.",
        Level: 10,
        Category: "Ability Increase",
        Tags: ["Terminal"],
        FStrength: 2
    },
    {
        Name: "Hysteria",
        Description: "Increase your Strength by +1 for every 2 enemies in your Melee zone.",
        Requirements: "Strength of at least 2",
        Category: "Ability Increase",
        Tags: ["Melee", "Enemy Count"]
    },
    {
        Name: "Anger Point",
        Description: "When you take critical damage, increase your Strength by +1 for each level of critical for two rounds.",
        Category: "Ability Increase",
        Tags: ["Critical Hit"]
    },
    {
        Name: "Bloodlust",
        Description: "Increase your Strength by +1 for each terminal enemy on the battlefield (for a maximum of +3 Strength from this feat).",
        Requirements: "Strength of at least 2",
        Category: "Ability Increase",
        Tags: ["Terminal", "Enemy Count"]
    },
    {
        Name: "Sprinter",
        Description: "Add 1/4 STR to MS.",
        Category: "Movement",
        Tags: ["Speed Increase"],
        FSpeed: 1.25
    },
    {
        Name: "Immovable Force",
        Description: "When you would be affected by an area of effect power or ability that targets your Might, you take no damage instead of half if you succeed the defense roll.",
        Requirements: "Might of at least 13",
        Level: 5,
        Category: "Damage Reduction",
        Tags: ["Area of Effect"]
    },
    {
        Name: "Immovable Force II",
        Description: "When you would be affected by an area of effect power or ability that targets your Might, you take no damage instead of half if you succeed the defense roll, and half damage if you fail.",
        Requirements: "Level of at least 7, Might of at least 14 and one other Strength or Defensive feat.",
        Level: 7,
        Category: "Damage Reduction",
        Tags: ["Area of Effect"]
    },
    {
        Name: "Towering Physique",
        Description: "You count as one size larger when grappling.",
        Requirements: "Might of at least 13",
        Category: "Control",
        Tags: ["Grappling", "Size Increase"]
    },
    {
        Name: "Winning Confidence",
        Description: "Reduce all damage taken by 1 for each terminal foe on the battlefield, up to a maximum of -4 damage taken.",
        Requirements: "Vitality of at least 1",
        Category: "Damage Reduction",
        Tags: ["Terminal", "Enemy Count"]
    },
    {
        Name: "Winning Confidence II",
        Description: "Reduce all damage taken by 2 for each terminal enemy on the battlefield, up to a maximum of -8 damage taken.",
        Requirements: "Vitality of at least 3",
        Category: "Damage Reduction",
        Tags: ["Terminal", "Enemy Count"]
    },
    {
        Name: "Resilience",
        Description: "While in Terminal, reduce all damage taken by half of your Vitality, rounded up.",
        Requirements: "Vitality of at least 2",
        Category: "Damage Reduction",
        Tags: ["Terminal"],
        FVitality: 0.5
    },
    {
        Name: "Resilience II",
        Description: "While in Terminal, reduce all damage taken by an amount equal to your Vitality.",
        Requirements: "Vitality of at least 4",
        Category: "Damage Reduction",
        Tags: ["Terminal"],
        FVitality: 1
    },
    {
        Name: "Adrenaline",
        Description: "Your Terminal range increases by 1/2 your Vitality multiplied by your Level (unless your Vitality is negative). This scales off your base VIT.",
        Category: "Terminal",
        Tags: ["Terminal Increase"]
    },
    {
        Name: "Unarmored Defense",
        Description: "While you're not wearing armor, reduce all damage taken by 1.",
        Requirements: "Vitality of at least 3",
        Category: "Damage Reduction",
        Tags: ["Unarmored"]
    },
    {
        Name: "Unarmored Defense II",
        Description: "While you're not wearing armor, reduce all damage taken by 2.",
        Requirements: "Vitality of at least 4",
        Category: "Damage Reduction",
        Tags: ["Unarmored"]
    },
    {
        Name: "Empowered Build",
        Description: "Your Strength increases and can exceed the maximum by 3. Choose 4 of your other abilities; they decrease by 1.",
        Category: "Utility",
        Tags: ["Strength", "Bonus"],
        characterFeat: "True"
      },
      {
        Name: "Forklift",
        Description: "Can lift double your STR in 100 pounds. i.e., +4 STR can lift 800 pounds.",
        Category: "Utility",
        Tags: ["Lifting"],
        characterFeat: "True"
      },
      {
        Name: "Indomitable Might",
        Description: "When you would fail a Strength skill or defense roll, you may choose to use the score as the value instead.",
        Category: "Utility",
        Tags: ["Strength", "Skill", "Defense Roll"],
        characterFeat: "True"
      },
      {
        Name: "Indomitable Might II",
        Description: "When you would fail a Strength skill or defense roll, you may choose to use the score as the value instead.",
        Category: "Utility",
        Tags: ["Strength", "Skill", "Defense Roll"],
        characterFeat: "True"
      },
      {
        Name: "Undeniable Body",
        Description: "You add your Strength or Vitality (choose when obtaining this feat) to Charm; however, you treat failure as one degree lower when doing so.",
        Category: "Utility",
        Tags: ["Charm", "Strength/Vitality"],
        characterFeat: "True"
      },
      {
        Name: "Unwavering Might",
        Description: "As a reaction to your Might being targeted or rolled, you may increase your Might by +3 for 4 rounds.",
        Category: "Defensive",
        Tags: ["Reaction", "Might", "Bonus"],
        characterFeat: "True"
      },
      {
        Name: "Intimidating Physique",
        Description: "Add 1/2 of your Strength to Intimidate rolls.",
        Category: "Utility",
        Tags: ["Intimidation"],
        characterFeat: "True"
      },
      {
        Name: "Intimidating Physique II",
        Description: "Add your Strength to Intimidate rolls.",
        Category: "Utility",
        Tags: ["Intimidation"],
        characterFeat: "True"
      },
      {
        Name: "Confident Prowess",
        Description: "While attempting to charm, persuade, or convince someone of your capability (real or not) to accomplish a task, you may add your Strength to any rolls or scores involved.",
        Category: "Utility",
        Tags: ["Charm", "Persuade", "Convince"],
        characterFeat: "True"
      },
      {
        Name: "Passive Intimidation",
        Description: "When you intimidate using Strength or Vitality, you may cause the target to become aggressive or defensive as a result of that action, no matter the action's outcome.",
        Category: "Utility",
        Tags: ["Intimidation", "Aggressive", "Defensive"],
        characterFeat: "True"
      },
      {
        Name: "Goading Strength",
        Description: "When you taunt, you may use Strength instead of Charisma.",
        Category: "Utility",
        Tags: ["Taunt"],
        characterFeat: "True"
      },
];

export default featsData;