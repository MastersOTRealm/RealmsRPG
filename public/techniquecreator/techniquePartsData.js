const techniquePartsData = [
    // General Techniques
    {
        name: "True Damage",
        description: "Add 1 damage to any technique.",
        baseBP: 1,
        baseEnergy: 1.5,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN for each additional damage.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "General"
    },
    {
        name: "Spin",
        description: "Roll to hit once, attacking all creatures in your melee zone.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "General"
    },
    {
        name: "Discombobulate",
        description: "Upon hit, target rolls Fortitude against your Style Potency or gains stunned 1.",
        baseBP: 1,
        baseEnergy: 5,
        opt1Cost: 5,
        opt1Description: "+5 EN for each additional level of stun.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "General"
    },
    {
        name: "Wind Up",
        description: "Spend 2 spaces of movement instead of moving to add +1 to your damage roll upon hit. Every 2 spaces spent adds 1 damage.",
        baseBP: 1,
        baseEnergy: 3,
        opt1Cost: 4,
        opt1Description: "+4 EN to make this +1 per 1 space of movement.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "General"
    },
    {
        name: "Knockback",
        description: "Upon hit, target rolls Might or Reflexes and on a failure is knocked back 1 space.",
        baseBP: 1,
        baseEnergy: 2.5,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN per space you knock the target back (away from your character) to a maximum of 6 spaces.",
        BPIncreaseOpt1: 0,
        opt2Cost: 1,
        opt2Description: "+1 BP to raise maximum knockback by 2 (e.g., up to 8, 10, and so on).",
        BPIncreaseOpt2: 1,
        type: "base",
        category: "General"
    },
    {
        name: "Bone Break",
        description: "Break target bone upon a major critical hit.",
        baseBP: 1,
        baseEnergy: 2.5,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN to cause bone to be broken on a critical hit.",
        BPIncreaseOpt1: 0,
        opt2Cost: 6,
        opt2Description: "+6 EN to cause bone to be broken on a minor critical.",
        BPIncreaseOpt2: 0,
        type: "base",
        category: "General"
    },
    {
        name: "Crippling Blow",
        description: "Target hit rolls Fortitude against your Style Potency, on a failure gaining slow 1.",
        baseBP: 1,
        baseEnergy: 1.5,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN for each increased level of the slowed condition.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "General"
    },
    {
        name: "Daze",
        description: "Target hit rolls Fortitude against your Style Potency; on a failure, becomes dazed for one round.",
        baseBP: 1,
        baseEnergy: 2.5,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN for each additional round dazed.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "General"
    },
    {
        name: "Wide Swing",
        description: "Roll to hit three connected spaces in your melee range.",
        baseBP: 1,
        baseEnergy: 3,
        type: "base",
        category: "General"
    },
    {
        name: "Disabling Strike",
        description: "Target hit rolls Might against your Style Potency; on a failure, their Strength decreases by 1.",
        baseBP: 1,
        baseEnergy: 2.5,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN for each additional 1 Strength reduced.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "General"
    },
    {
        name: "Reach",
        description: "This attack has 'reach,' allowing you to target one space beyond your melee zone with melee attacks.",
        baseBP: 1,
        baseEnergy: 2,
        type: "base",
        category: "General"
    },
    {
        name: "Expose",
        description: "Target hit rolls Reflex against your Martial Ability; upon failure, the next attacking creature gains +2 to their attack roll against it.",
        baseBP: 1,
        baseEnergy: 1.5,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN to make this last for the next two attacks.",
        BPIncreaseOpt1: 0,
        opt2Cost: 1.5,
        opt2Description: "+1.5 EN for each additional +1 to hit.",
        BPIncreaseOpt2: 0,
        type: "base",
        category: "General"
    },
    {
        name: "Disable",
        description: "Target hit rolls their choice of Might or Fortitude against your Style Potency; upon failure, target has -1 to attack for a round.",
        baseBP: 1,
        baseEnergy: 1.5,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN for each additional -1.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "General"
    },
    {
        name: "Bleed",
        description: "Target hit gains the bleeding 1 condition.",
        baseBP: 1,
        baseEnergy: 2.5,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN for each +1 to the bleeding condition.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "General"
    },
    {
        name: "Situational Exploit",
        description: "Technique can only be used when a target misses you with an attack roll. Adding this part makes this technique usable as a basic reaction.",
        baseBP: 1,
        baseEnergy: 0.75,
        type: "base",
        category: "Decrease"
    },
    // Strength
    {
        name: "Aerial Strike",
        description: "Target hit rolls Agility or Might against your Style Potency, adding +2 to the roll for every 200 kg they weigh; upon failure, it is thrust 1 space into the air above its current space.",
        baseBP: 1,
        baseEnergy: 1.5,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN for each additional space upward to a maximum of 5.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Strength"
    },
    {
        name: "Strength Knock Prone",
        description: "Target hit rolls Might against your Style Potency, falling prone on a failure.",
        baseBP: 1,
        baseEnergy: 2.5,
        type: "base",
        category: "Strength"
    },
    {
        name: "Pin",
        description: "Attack target’s Might, +1 to your attack for every 200 kg you weigh. Target hit is constrained and prone and may roll Might against your Style Potency to escape. Rolling to escape has a penalty equal to -1 for every 200 kg you weigh.",
        baseBP: 1,
        baseEnergy: 3,
        type: "base",
        category: "Strength"
    },
    {
        name: "Grapple (Technique)",
        description: "Target hit rolls Might against your Strength attack bonus, becoming grappled on a failure.",
        baseBP: 1,
        baseEnergy: 2.5,
        type: "base",
        category: "Strength"
    },
    {
        name: "Crush",
        description: "Target grappled creature rolls Fortitude against your Strength attack roll; upon failure, the target takes damage equal to your Strength attack bonus multiplied by 2. (Strength + Martial Bonus)*2.",
        baseBP: 1,
        baseEnergy: 2,
        opt1Cost: 2,
        opt1Description: "+2 EN to double this damage, +2 EN more to triple it, and so on.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Strength"
    },
    {
        name: "Body Block",
        description: "Target grappled creature becomes the target of an attack made against you. If the attack would cause the grappled creature to go into negative Hit Points, you take all damage after 0 instead. If the grappled creature is already dead or dying, it instead reduces the damage by its Fortitude Roll bonus.",
        baseBP: 1,
        baseEnergy: 3,
        type: "base",
        category: "Strength"
    },
    {
        name: "Constrain",
        description: "Target grappled creature is constrained while grappled. They may roll Might against your Style Potency to break free of restraint, but still remain grappled if it is broken.",
        baseBP: 1,
        baseEnergy: 2,
        type: "base",
        category: "Strength"
    },
    {
        name: "Takedown",
        description: "Target grappled creature becomes prone. As long as they remain grappled by you, they cannot stand from prone.",
        baseBP: 1,
        baseEnergy: 3,
        type: "base",
        category: "Strength"
    },
    {
        name: "Throw Creature",
        description: "Throw target grappled creature as if they were an improvised weapon using 1/2 Acuity on the attack roll and 1/2 Strength for the damage roll. You may throw the creature a distance equal to 1/2 of your Strength or Agility.",
        baseBP: 1,
        baseEnergy: 3,
        type: "base",
        category: "Strength"
    },
    {
        name: "Throw Weapon",
        description: "Throw any weapon even if it doesn’t have the 'Thrown' property, treating it as a thrown weapon, rolling an Acuity attack roll against a target, and dealing damage equal to the weapon’s damage dice adding Strength plus Martial bonus.",
        baseBP: 1,
        baseEnergy: 1.5,
        type: "base",
        category: "Strength"
    },
    {
        name: "Leap",
        description: "Jump without taking a movement action with this part.",
        baseBP: 1,
        baseEnergy: 1.5,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN to double your jumping distance. +1.5 EN more to triple your jumping distance.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Strength"
    },
    {
        name: "Chaining Technique",
        description: "Reduce the multiple attack penalty by 1.",
        baseBP: 1,
        baseEnergy: 1,
        opt1Cost: 1,
        opt1Description: "+1 EN for each additional 1 decrease.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Strength"
    },
    {
        name: "Demolition",
        description: "Damage dealt by technique deals double damage to objects, walls, ceilings, etc.",
        baseBP: 1,
        baseEnergy: 2,
        opt1Cost: 2,
        opt1Description: "+2 EN and +1 BP to triple damage dealt to objects, walls, ceilings, instead.",
        BPIncreaseOpt1: 1,
        type: "base",
        category: "Strength"
    },
    // Vitality
    {
        name: "Slam",
        description: "Target hit rolls Fortitude against your Style Potency, which has +1 for every 200 kg you weigh. Upon failure, target takes damage equal to your Vitality + your Martial Bonus.",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 4,
        opt1Description: "+4 EN to double this damage. +4 EN more to triple, and so on.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Vitality"
    },
    {
        name: "Head Butt",
        description: "Roll Fortitude against target’s Fortitude; upon a success, target takes damage equal to your Vitality + your Martial Bonus; on a failure, you take damage equal to target’s Fortitude.",
        baseBP: 1,
        baseEnergy: 1.5,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN to double this damage. +1.5 EN more to triple, and so on.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Vitality"
    },
    {
        name: "Weaken (Technique)",
        description: "Target hit gains the weakened 1 condition.",
        baseBP: 1,
        baseEnergy: 3,
        opt1Cost: 3,
        opt1Description: "+3 EN for each level of weakened.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Vitality"
    },
    {
        name: "Endanger",
        description: "Target hit gains the Vulnerable 1 condition.",
        baseBP: 1,
        baseEnergy: 2.5,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN for each level of Vulnerable.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Vitality"
    },
    {
        name: "Brace",
        description: "Reduce the next damage taken by you by an amount equal to your Fortitude bonus.",
        baseBP: 1,
        baseEnergy: 2,
        opt1Cost: 2,
        opt1Description: "+2 EN to double this reduction, +2 EN more to triple it, and so on.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Vitality"
    },
    // Agility
    {
        name: "Parry",
        description: "Roll a melee attack against a target’s melee attack roll against you. Upon meeting or exceeding their attack roll, you cause their attack to miss. If this is the only part added, it can be done as a Reaction.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Agility"
    },
    {
        name: "Barrage",
        description: "Add attack using unarmed prowess to your attack in addition to any attack made as part of the technique (up to 3 additional attacks total, 1 BP and 6 EN for the second added, 1 BP and 9 EN for the third).",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Agility"
    },
    {
        name: "Agile Knock Prone",
        description: "Target hit rolls Reflex against your Style Potency, falling prone on a failure.",
        baseBP: 1,
        baseEnergy: 3,
        type: "base",
        category: "Agility"
    },
    {
        name: "Charge",
        description: "Add +1 to damage for every 2 spaces moved in the direction of target.",
        baseBP: 1,
        baseEnergy: 3,
        opt1Cost: 3,
        opt1Description: "+3 EN to add +1 for every 1 space you move in the direction of the target. +3 EN more to make this +2 for every 1 space, and so on.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Agility"
    },
    {
        name: "Quick Strike/Shot",
        description: "Use Agility instead of another ability on a roll to hit.",
        baseBP: 1,
        baseEnergy: 2,
        opt1Cost: 3,
        opt1Description: "5 EN instead to add 1/2 Agility to your attack roll. +3 EN to make this add your full Agility to your attack roll.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Agility"
    },
    {
        name: "Disarm",
        description: "Target hit rolls Might or Reflex against your Style Potency, +3 to target’s roll if the item you’re disarming is two-handed. Upon failure, target drops target item.",
        baseBP: 1,
        baseEnergy: 3,
        type: "base",
        category: "Agility"
    },
    {
        name: "Break Sight",
        description: "Move from one location to another within a target’s melee zone and roll Stealth or Hide against their Vigilance; upon a success, become hidden from that target.",
        baseBP: 1,
        baseEnergy: 2.5,
        type: "base",
        category: "Agility"
    },
    {
        name: "Disengage",
        description: "Move one space away from a target after it attacks you. If this is the only part of the technique, it can be used as a 1 Action Point Reaction.",
        baseBP: 1,
        baseEnergy: 1.5,
        type: "base",
        category: "Agility"
    },
    {
        name: "Catch Ranged Attack",
        description: "Roll Reflex against a physical ranged attack that passes through or targets a creature in your melee zone. Upon meeting or beating the attack roll, catch the projectile.",
        baseBP: 1,
        baseEnergy: 2,
        opt1Cost: 2,
        opt1Description: "+2 EN, caught projectiles can be rebounded as part of the same action in which they were caught by making a thrown improvised weapon attack.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Agility"
    },
    {
        name: "Catch Melee Attack",
        description: "Roll Reflex against a physical melee attack that passes through or targets a creature in your melee zone. Upon meeting or beating the attack roll, catch the attack. During the same action in which the attack was caught, you have advantage on all physical d20 rolls against the target caught creature. This includes attack rolls.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Agility"
    },
    {
        name: "Elude",
        description: "You gain the hidden condition from all creatures to which you are obscured without rolling to Stealth or Hide. Alternatively, you may choose to roll to Stealth or Hide. If this is the only technique part, this can be done as a quick action.",
        baseBP: 1,
        baseEnergy: 3,
        type: "base",
        category: "Agility"
    },
    {
        name: "Dodge",
        description: "You take the evade action as part of the technique without spending action points.",
        baseBP: 1,
        baseEnergy: 2,
        opt1Cost: 2,
        opt1Description: "+2 EN for each equivalent of 1 action point spent on the Evade action.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Agility"
    },
    {
        name: "Maneuver",
        description: "You take the movement action as part of the technique without spending action points but only moving half of your movement speed.",
        baseBP: 1,
        baseEnergy: 2,
        opt1Cost: 2,
        opt1Description: "+2 EN to allow you to move your full movement speed.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Agility"
    },
    {
        name: "Side-Step",
        description: "When attacked, add +1 to your Evasion and move one space adjacent to your current space that is still within the attack’s range.",
        baseBP: 1,
        baseEnergy: 2,
        opt1Cost: 2,
        opt1Description: "+2 EN for each +1 to your Evasion.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Agility"
    },
    {
        name: "Switch",
        description: "Switch places with a willing creature within your melee range or an unwilling creature that you either hit with this attack or who fails a Might or Reflex roll against your Style Potency. This doesn’t trigger any effects based on moving in or out of melee range for you or the enemy.",
        baseBP: 1,
        baseEnergy: 2,
        type: "base",
        category: "Agility"
    },
    // Acuity
    {
        name: "Focus Hit",
        description: "Add +1 to attack for every 2 spaces of movement you spend.",
        baseBP: 1,
        baseEnergy: 3,
        opt1Cost: 3,
        opt1Description: "+3 EN to add +1 for every 1 space you spend. +3 EN more to make this +2 for every 1 space, and so on.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Acuity"
    },
    {
        name: "Rush",
        description: "Add +1 to attack for every 2 spaces moved in the direction of target.",
        baseBP: 1,
        baseEnergy: 2.5,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN to add +1 for every 1 space you move in the direction of the target. +2.5 EN more to make this +2 for every 1 space, and so on.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Acuity"
    },
    {
        name: "Vital Point",
        description: "Add 1/2 Acuity to your melee attack roll.",
        baseBP: 1,
        baseEnergy: 3,
        opt1Cost: 3,
        opt1Description: "+3 EN to add your full Acuity to your melee attack roll.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Acuity"
    },
    // Charisma
    {
        name: "Feint",
        description: "Roll Act or Deceive against an enemy’s Insight score, gaining +1 to hit on a success.",
        baseBP: 1,
        baseEnergy: 1.5,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN for every +1 to hit up to a maximum of +3.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Charisma"
    },
    {
        name: "Goad",
        description: "Make a Taunt Roll against a target’s Resolve; upon success, the target becomes set on eliminating you specifically, gaining -5 to attack all creatures other than you.",
        baseBP: 1,
        baseEnergy: 2,
        opt1Cost: 2,
        opt1Description: "+2 EN to target all creatures within 3 spaces that you can see, +2 EN for each additional 3 spaces of range.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Charisma"
    },
    {
        name: "Menace",
        description: "Intimidate a target against their Resolve. If you succeed, you frighten the target. Target may roll Resolve against your Intimidate Score to end the condition.",
        baseBP: 1,
        baseEnergy: 2.5,
        type: "base",
        category: "Charisma"
    },
    {
        name: "Rally",
        description: "Roll Perform or Charm against a target you can see. The score is equal to 10 - Target’s Resolve bonus. Upon success, the creature gains resilient 1.",
        baseBP: 1,
        baseEnergy: 2.5,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN for each level of resilient. Each level of critical increases resilient by +1. +2.5 EN for each additional target rallied.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Charisma"
    },
    // Defensive
    {
        name: "Defend",
        description: "Take the defend action as part of this technique; if this is the only part added, this may be done as a free reaction.",
        baseBP: 1,
        baseEnergy: 2.5,
        type: "base",
        category: "Defensive"
    },
    {
        name: "Resilience",
        description: "Gain the Resilient 1 condition.",
        baseBP: 1,
        baseEnergy: 3,
        opt1Cost: 3,
        opt1Description: "+3 EN for each level of Resilient.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Defensive"
    },
    {
        name: "Clash",
        description: "When you are targeted by a physical attack, you may make an attack roll with a melee weapon you are wielding against that attack. If you meet or exceed the enemy attack roll, you may reduce the attack’s damage by your attack’s damage. If this is the only part of this technique, it may be done as a reaction.",
        baseBP: 1,
        baseEnergy: 1.5,
        type: "base",
        category: "Defensive"
    },
    // Offensive
    {
        name: "Infiltrate",
        description: "This attack ignores one damage resistance of your choice. Choose the type before attacking. (This ignores the effects of resistance but not any base level damage reduction the target has.)",
        baseBP: 1,
        baseEnergy: 3,
        type: "base",
        category: "Offensive"
    },
    {
        name: "Hidden Attack",
        description: "Using an interaction plus ability action, hide this weapon with Sleight of Hand against target(s) Vigilance; if hidden from an enemy when you attack, get +2 on the roll to hit.",
        baseBP: 1,
        baseEnergy: 2.5,
        type: "base",
        category: "Offensive"
    },
    // Control
    {
        name: "Pinning Weapon",
        description: "Target hit with a non-ranged (can be thrown) piercing weapon attack becomes rooted.",
        baseBP: 1,
        baseEnergy: 2.5,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN to allow this attack to be ranged piercing weapons/projectiles.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Control"
    },
    {
        name: "Command",
        description: "Give any number of your remaining action points to a chosen willing target; they must use these action points to take actions as close to your explained desires as possible unless you choose not to give specific commands.",
        baseBP: 1,
        baseEnergy: 1.5,
        type: "base",
        category: "Control"
    },
    // Ranged
    {
        name: "Buck Shot",
        description: "Add additional projectile(s) to a physical ranged attack. (3 EN, +1 BP per each additional projectile, up to 4 total if shot, 4 per hand if thrown) Roll to hit only once, only hit one target. Must pay for added effects for each projectile.",
        baseBP: 1,
        baseEnergy: 3,
        type: "base",
        category: "Ranged"
    },
    {
        name: "Spread Shot",
        description: "Add additional projectile(s) to a physical ranged attack. (4 EN, +1 BP per additional projectile, up to 3 total if shot, 4 per hand if thrown) Each hits an individual target of your choice. Roll to hit for each target. Must pay EN cost for added effects for each projectile, excluding Building Point cost for additional effects on each projectile after the first.",
        baseBP: 1,
        baseEnergy: 3,
        type: "base",
        category: "Ranged"
    },
    {
        name: "Long Shot",
        description: "Increase the range of this technique by 2 spaces.",
        baseBP: 1,
        baseEnergy: 0.75,
        opt1Cost: 0.75,
        opt1Description: "+0.75 EN for every 2 additional spaces. Must be used in conjunction with the “Add Weapon” part and a weapon with the “Range” part.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Ranged"
    },
    {
        name: "Volley",
        description: "Send a volley of projectiles that can reach over cover as high as half the range of your attack. A 3-space diameter circle in a location you can see or at a distance you can describe if you can’t see is hit by this attack. This attack targets the Reflexes of all creatures in the attack’s area of effect.",
        baseBP: 1,
        baseEnergy: 2.5,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN to increase the ring’s diameter by 1.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Ranged"
    },
    {
        name: "Piercing",
        description: "Each target on a path to the target is a target of this attack. This attack can pass through targets on its path to a target.",
        baseBP: 1,
        baseEnergy: 2.5,
        type: "base",
        category: "Ranged"
    },
    {
        name: "Curved Shot",
        description: "This attack ignores the penalties of attacking an obscured target unless that target is fully obscured on all sides except the side facing away from you (the target does not need to be fully obscured from behind).",
        baseBP: 1,
        baseEnergy: 2.5,
        type: "base",
        category: "Ranged"
    },
    {
        name: "Quick Draw",
        description: "Make 1 ranged attack before combat starts (when initiative has already been rolled but before any creature takes their first turn).",
        baseBP: 1,
        baseEnergy: 6,
        type: "base",
        category: "Ranged"
    },
    {
        name: "Splitting Shot",
        description: "When your ranged projectile hits or misses a target, all creatures within one space of that target (including the target) must roll Reflex and be affected by the attack on a failure.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Ranged"
    }
];

export default techniquePartsData;