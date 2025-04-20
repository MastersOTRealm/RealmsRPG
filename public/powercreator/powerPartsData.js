const powerPartsData = [
    {
        name: "Attack / Potency Increase",
        description: "+12.5% Increase the attack roll or potency of this power by +1.",
        baseBP: 1,
        baseEnergy: 0.125,
        opt1Cost: 0.125,
        opt1Description: "+12.5% EN for each additional +1, up to a maximum increase of +5.",
        BPIncreaseOpt1: 0,
        type: "Base",
        category: "General"
    },
    {
        name: "Personal Power Linger",
        description: "50% EN: Cause an offensive based power to become an option for you to use each round using the same action which you spent to use it. Each round you may make another attack with this power without spending the energy. You have this option for as long as the power lingers.",
        baseBP: 1,
        baseEnergy: 0.5,
        opt1Cost: 0.5,
        opt1Description: "+50% EN for each additional round of lingering (up to 10 rounds).",
        BPIncreaseOpt1: 0,
        opt2Cost: -0.5,
        opt2Description: "-50% EN from the total cost of personal power linger if the power has focus, and/or does not directly harm a target or involve any adaptation parts. -50% EN  from the total cost of personal power linger to make the power's effect activate only once more than the initial time during the lingering duration, after which it ends.",
        BPIncreaseOpt2: 0,
        opt3Cost: 0.5,
        opt3Description: "+50% To make using this power on future turns take one less action point than the origional action cost. (Basic action to quick action.)",
        BPIncreaseOpt3: 0,
        type: "increase",
        category: "General"
    },
    {
        name: "Pierce Targets on Path",
        description: "2 EN: Each object occupying a space between you and the power's target takes 1d2 magic damage.",
        baseBP: 1,
        baseEnergy: 2,
        opt1Cost: 1,
        opt1Description: "For each additional 1d2 of damage.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Area of Effect"
    },
    {
        name: "Trail of Effect on Path",
        description: "25% EN: Each space directly between you and this power's target is affected for the power's duration. A creature that begins its turn in one of these spaces must roll the relevant defense against your potency or become affected.",
        baseBP: 1,
        baseEnergy: 0.25,
        type: "increase",
        category: "Area of Effect"
    },
    {
        name: "Add Multiple Targets",
        description: "1 EN: Target an additional creature within range. Make one attack and damage roll (if any), applying it to both targets, splitting the total damage between them.",
        baseBP: 1,
        baseEnergy: 1,
        opt1Cost: 1,
        opt1Description: "+1 EN For each additional target.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Area of Effect"
    },
    {
        name: "Expanding Area of Effect",
        description: "+50% EN: At the end of your turn after the round in which power was used, its area of effect increases 1 space in all directions.",
        baseBP: 1,
        baseEnergy: 0.5,
        type: "increase",
        category: "Area of Effect"
    },
    {
        name: "Target One in an Area of Effect",
        description: "-25% EN: When you first use this power and at the beginning of the turn the power was used, you can choose one creature within its area of effect to target with the power. The power can only target and affect creatures in this way. You don't need to see a target to make it the target of the power.",
        baseBP: 1,
        baseEnergy: -0.25,
        type: "decrease",
        category: "Area of Effect"
    },
    {
        name: "Detect Creature Type",
        description: "5 EN: Detect the presence of a certain creature type within the range of this power.",
        baseBP: 1,
        baseEnergy: 5,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN for each additional creature type.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Detection"
    },
    {
        name: "Detect Power",
        description: "9 EN: Target becomes aware if there is any power, magic, or supernatural effects active within a distance from the range of the power.",
        baseBP: 1,
        baseEnergy: 9,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN Target also learns what types of power parts are involved (such as creation, adaptation, and so on).",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Detection"
    },
    {
        name: "Detect Damage",
        description: "3 EN: Detect a certain damage type within the range of this power, each creature or object capable of dealing that damage type becomes known to the target including the direction or an outline shown to the target of that thing when viewing it.",
        baseBP: 1,
        baseEnergy: 3,
        type: "base",
        category: "Detection"
    },
    {
        name: "Identify",
        description: "5 EN: Target gains awareness of a target object in range's properties and magical or supernatural properties if any. Some properties may remain hidden until the object is used as intended, but most properties will be available (if not all) at the RM's discretion.",
        baseBP: 1,
        baseEnergy: 5,
        type: "base",
        category: "Detection"
    },
    {
        name: "Omen",
        description: "9 EN: Gain awareness of future events that are likely to occur in the next 30 minutes based on yours and others planned courses of action. You know whether the coming events in this time are good, bad, good and bad, or neutral. Each time after the first you use this power in 24 hours you have a 50% chance of it not working despite spending energy.",
        baseBP: 1,
        baseEnergy: 9,
        type: "base",
        category: "Detection"
    },
    {
        name: "Detect Traps",
        description: "5 EN: Detect traps within the range of the spell. You see a faint outline or aura around any traps within the range. Traps are defined as mechanisms, powers, or objects intended to be unknowingly triggered to harm or capture creatures.",
        baseBP: 1,
        baseEnergy: 5,
        type: "base",
        category: "Detection"
    },
    {
        name: "Locate Animals",
        description: "4 EN: You learn the direction, path, and location of the closest of a specific animal or beast type of your choice when you use this power provided it is within 2 kilometers.",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 0.75,
        opt1Description: "+0.75 EN for each additional 2 kilometers.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Detection"
    },
    {
        name: "Locate Plants",
        description: "4 EN: You learn the direction, path, and location of the closest of a specific plant or herb type of your choice when you use this power provided it is within 2 kilometers.",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 0.75,
        opt1Description: "+0.75 EN for each additional 2 kilometers.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Detection"
    },
    {
        name: "Locate Object",
        description: "6 EN: You learn the direction, path, and location of the closest of a specific object of your choice that is familiar to you when you use this power provided it is within 300 meters.",
        baseBP: 1,
        baseEnergy: 6,
        opt1Cost: 0.75,
        opt1Description: "+0.75 EN for each additional 300 meters.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Detection"
    },
    {
        name: "Locate Creature",
        description: "13 EN: You learn the direction, path, and location of the closest of a specific creature of your choice that is familiar to you when you use this power provided it is within 300 meters.  If the creature is not in its normal form then this power fails to locate it.",
        baseBP: 1,
        baseEnergy: 13,  
        opt1Cost: 0.75,
        opt1Description: "+0.75 EN for each additional 300 meters.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Detection"
    },
    {
        name: "Locate Creature on Overcome",
        description: "0 BP, 3 EN: If you overcome a creature's defense with any part of this power you also learn its exact location for the next round including how far it is from you and in what direction. While detected this way it cannot be hidden from you. If this power doesn't have an attack roll you may target Mental Fortitude instead.",
        baseBP: 0,
        baseEnergy: 3,
        type: "base",
        category: "Detection"
    },
    {
        name: "Detect Invisibility",
        description: "7 EN: You can see invisible things and creatures as if they were not invisible. You ignore the effects of the invisible condition for these creatures and objects. If this is an area of effect you may choose to cause each creature affected to gain this effect, or instead cause the area to reveal all invisible things instead. If you target a creature to end or remove its ability to be invisible this target's evasion.",
        baseBP: 1,
        baseEnergy: 7,
        type: "base",
        category: "Detection"
    },
    {
        name: "See Through Illusion",
        description: "11 EN: Visual illusions are invisible to you, and you automatically overcome anything targeting discernment related to this type of illusion.",
        baseBP: 1,
        baseEnergy: 11,
        type: "base",
        category: "Detection"
    },
    {
        name: "Sensor",
        description: "9 EN: Create a tiny invisible and silent sensor that you can move up to the range of this power as a quick action. You can choose to hear, see, taste, or feel through this sensor as if it was an extension of your senses.",
        baseBP: 1,
        baseEnergy: 9,
        type: "base",
        category: "Detection"
    },
    {
        name: "Scry",
        description: "2 BP, 22 EN: A silent invisible sensor appears within 2 spaces of target creature or location that remains within the location or 2 spaces of range as the creature moves. You can sense through it as if it's an extension of your vision and hearing. Target's Mental Fortitude or Resolve. You gain +5 to overcome if you know the target well or -5 if you've only heard of the target. In addition, you gain +2 to overcome if you have the target's picture or likeness, +4 if you have a possession of the target's, and +10 if you have part of its body (including hair or part of a nail). These bonuses and penalties all apply together, but each can only apply once.",
        baseBP: 2,
        baseEnergy: 22,
        type: "base",
        category: "Detection"
    },
    {
        name: "Find Path",
        description: "2 BP, 20 EN: Name a specific location you are familiar with. You gain an awareness of the most direct physical route to reach it. For the duration, while you remain in the same realm as the location, you intuitively sense its distance and direction. When presented with multiple paths, you know which one is the most direct route toward your destination. This power fails if the destination is in a different realm, is mobile (such as a floating fortress), or is too vague (like 'a dragon’s lair').",
        baseBP: 2,
        baseEnergy: 20,
        type: "base",
        category: "Detection"
    },
    {
        name: "Enrich Plantlife",
        description: "4 EN: Enrich all plantlife within the range of this power from you. The crops recover from any temporary ailment or illness, harvest from these crops if any is doubled for the next 30 days.",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 4,
        opt1Description: "+4 EN to make this 200 meters instead.",
        BPIncreaseOpt1: 0,
        opt2Cost: 8,
        opt2Description: "+8 EN to make this 1 kilometer instead.",
        BPIncreaseOpt2: 0,
        type: "base",
        category: "Creation Utility"
    },
    {
        name: "Liquid Walk",
        description: "4 EN: Target gains the ability to walk across any liquid as if it was a solid surface. Target may spend a quick action to sink into the liquid like normal, but cannot walk on the surface again until it would be able to get above the liquid.",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN to allow you to walk on harmful surfaces without being affected.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Creation Utility"
    },
    {
        name: "Create",
        description: "12 EN: You transform raw materials into finished products of the same material. For instance, you might craft a wooden bridge from a stand of trees, a rope from a patch of hemp, or clothing from flax or wool. Select raw materials within view and range. With a sufficient quantity, you can fabricate a Large or smaller object, fitting within a 1 space cube or up to four connected 1 space cubes. If using metal, stone, or another mineral substance, however, the finished object can be no larger than Medium, fitting within a 1 space cube. The quality of any created objects depends on the quality of the raw materials. This effect cannot create creatures or magic items, nor can it produce items that require a high degree of craftsmanship—such as weapons or armor—unless you are proficient with the appropriate skill(s) required for their crafting.",
        baseBP: 1,
        baseEnergy: 12,
        opt1Cost: 7,
        opt1Description: "+7 EN to double the amounts of a 1 space cube or up to four connected 1 space cubes to a 2 space cube or eight connected 1 space cubes.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Creation Utility"
    },
    {
        name: "Speak with the Dead",
        description: "2 BP, 4 EN: You may touch a corpse and cause it to answer one question it might have answered in life, with no obligation to speak honestly. The answers may be cryptic or repetitive. Once five questions have been asked, or after 10 minutes, the corpse returns to its inanimate state.",
        baseBP: 2,
        baseEnergy: 4,
        opt1Cost: 2,
        opt1Description: "+2 EN per additional question.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Summoning"
    },
    {
        name: "Health Summon",
        description: "2 BP, X EN: Summon a Creature from Another Location or Realm: You may summon a creature by paying HP or EN. The summon stays until killed. The cost is +6 HP and/or EN total for each 1/4th level of the summon. Your maximum HP and/or EN is permanently lowered by the amount spent. These maximums revert to normal when the summon dies or is dismissed (a free action), but you do not regain the lost points immediately, only your maximum returns. For determining energy costs, this power part costs the total amount of HP and EN spent. You must decide the level and creature you summon when creating this power. (See Summoning and Summon Creation Rules in the Core Rulebook).",
        baseBP: 2,
        baseEnergy: 0,
        opt1Cost: 6,
        opt1Description: "The cost is +6 HP and/or EN total for each 1/4th level of the summon.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Summoning"
    },
    {
        name: "Power Summon",
        description: "Create or Summon a Temporary Creature: You summon a creature that lasts for 5 minutes at a base cost of 6 EN + 1 BP per 1/4th level of the summon. You must decide the level and creature summoned when creating this power.",
        baseBP: 0,
        baseEnergy: 0,
        opt1Cost: 6,
        opt1Description: "1 BP, 6 EN per 1/4th level of the summon",
        BPIncreaseOpt1: 1,
        opt2Cost: 1.5,
        opt2Description: "+1.5 EN for each additional 5 minutes.",
        BPIncreaseOpt2: 0,
        type: "base",
        category: "Summoning"
    },
    {
        name: "Neutral Summon",
        description: "Summon an Unaligned Creature: You summon a creature with no dedicated agenda or alliance. The creature is controlled by the Realms Master and behaves according to the situation. The summon lasts until a full recovery or until killed.",
        baseBP: 0,
        baseEnergy: 0,
        opt1Cost: 4,
        opt1Description: "1 BP, 4 EN: per 1/4th level of the summon.",
        BPIncreaseOpt1: 1,
        type: "base",
        category: "Summoning"
    },
    {
        name: "Raise Undead",
        description: "Raise an Undead Servant: By touching a mostly intact corpse, you can raise an undead creature. The creature becomes a mindless summon under your control, with no memory or personality from its past life. It lasts until a full recovery or until killed. Use the same stat block as the creature had in life but replace its intelligence with -2. It gains resistance to necrotic damage and a weakness to spiritual damage. (See Summoning Rules in the Core Rulebook). You can decide the level of the creature raised when using this power, paying the corresponding energy cost.",
        baseBP: 0,
        baseEnergy: 0,
        opt1Cost: 9,
        opt1Description: "1 BP, 9 EN: per level of the creature.",
        BPIncreaseOpt1: 1,
        type: "base",
        category: "Summoning"
    },
    {
        name: "Weapon Summon",
        description: "2 BP, X EN: Summon a Weapon to Hand: You summon a weapon directly to your hand. You are considered proficient with this weapon for the duration. If the weapon requires ammunition, you have access to it for the duration. The weapon lasts for 1 minute. You may decide which weapon to summon when using this power, provided its BP cost is within the limit of what the power allows.",
        baseBP: 1,
        baseEnergy: 0,
        opt1Cost: 1.5,
        opt1Description: "1.5 EN for each 1 BP of the weapon's proficiency cost",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Summoning"
    },
    {
        name: "Summon or Beast Senses",
        description: "4 EN: Merge your perception and senses with that of a willing target creature that is a summon, familiar, or beast. You temporarily replace your Acuity with the target's and can perceive through its senses including special senses. Target's mental fortitude or resolve if the target is unwilling.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Summoning"
    },
    {
        name: "Resurrection",
        description: "4 BP, 75 EN: Touch a part of a dead target and return it to life with maximum Hit Points and any missing body parts restored, as long as the target died within the last ten years. This power part takes 1 hour to use.",
        baseBP: 4,
        baseEnergy: 75,
        opt1Cost: 15,
        opt1Description: "+15 EN for each additional 10 years the target has been dead.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "True Resurrection",
        description: "5 BP, 165 EN: Speak the name of a dead target and return it to life with maximum Hit Points and any missing body parts restored within the range of this power, as long as the target died within the last one-hundred years. This power part takes 1 hour to use.",
        baseBP: 5,
        baseEnergy: 165,
        opt1Cost: 40,
        opt1Description: "+40 EN for each additional 100 years the target has been dead.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Ward from Death",
        description: "15 EN: When target would enter the dying condition, they instead drop to 1 hit point. This effect lasts for 8 hours but ends when used.",
        baseBP: 1,
        baseEnergy: 15,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Irreducible Max Health",
        description: "4 EN: Target cannot have its health reduced below its maximum hit points.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Stasis",
        description: "10 EN: Target dead creature stops decaying completely and cannot rot any further. Any power or feat that requires a target has been dead less than a certain amount of time can affect this creature as if it had only been dead for as long as it had when this power was used. Target's affected this way cannot be raised as undead creatures.",
        baseBP: 1,
        baseEnergy: 10,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Feign Death",
        description: "12 EN: Target creature enters a death-like state that is only perceivable as death unless perceived with powers and feats that reveal the creature is alive. The target must be willing, and gains the blinded condition for the duration. Target has resistance to all damage other than psychic for the power's duration and cannot gain the weakened condition. Persists for 1 hour.",
        baseBP: 1,
        baseEnergy: 12,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Suppress Healing",
        description: "4 EN: Target is unable to regain health for the duration of the power.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Permanent Damage",
        description: "75% EN: Target's maximum health is reduced by an amount equal to the damage dealt by this power when initially used, to a minimum of 1.",
        baseBP: 1,
        baseEnergy: 0.75,
        type: "increase",
        category: "Adaptation"
    },
    {
        name: "Blur",
        description: "3 EN: Increase target’s Movement Speed (MS) by 1.",
        baseBP: 1,
        baseEnergy: 3,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN per each additional +1 MS, to a maximum of +5 from this part.",
        BPIncreaseOpt1: 0,
        type: "Base",
        category: "Adaptation"
    },
    {
        name: "Adapting",
        description: "6 EN: Target creature gains a feat for the duration.",
        baseBP: 1,
        baseEnergy: 6,
        opt1Cost: 6,
        opt1Description: "+1 BP, +6 EN for each additional feat, up to a maximum of 3 feats gained from this part.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Ability Increase",
        description: "12 EN: Increase the target’s Ability by +1 for the duration. No ability can be increased above 10 using this part.",
        baseBP: 1,
        baseEnergy: 12,
        opt1Cost: 7,
        opt1Description: "+7 EN for each additional +1 to the ability, to a maximum of +8.",
        BPIncreaseOpt1: 0,
        opt2Cost: 3,
        opt2Description: "+3 EN to increase the maximum increase cap by +1.",
        BPIncreaseOpt2: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Jump",
        description: "4 EN: Double target's jump distance. +2.5 EN To triple it instead.",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN To triple it instead.",
        BPIncreaseOpt1: 0,
        useAltCost: false,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Skill Sharpen",
        description: "3 EN: Increase target's Skill by +1 for the duration. No skill can be increased above 10 using this part.",
        baseBP: 1,
        baseEnergy: 3,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN for each additional +1 to a Skill, to a maximum of +8 from this part.",
        BPIncreaseOpt1: 0,
        opt2Cost: 1,
        opt2Description: "+1 EN for each +1 increase to the skill increase maximum.",
        BPIncreaseOpt2: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Debuffing",
        description: "6 EN: Decrease target's Ability by -1 for the duration. No ability can be decreased below -5 using this part.",
        baseBP: 1,
        baseEnergy: 6,
        opt1Cost: 4,
        opt1Description: "+4 EN for each additional -1 decrease to an Ability.",
        BPIncreaseOpt1: 0,
        opt2Cost: 6,
        opt2Description: "+6 EN for each -1 increase to this maximum.",
        BPIncreaseOpt2: 0,
        useAltCost: false,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Leave No Tracks",
        description: "2 EN: Target leaves no tracks or noticable signs of presence to be tracked by natural means.",
        baseBP: 1,
        baseEnergy: 2,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Restore",
        description: "4 EN: End or decrease by 1 a chosen condition on the target. This condition must be chosen when you create this power.",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN for each additional level of a condition you decrease.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Greater Restore",
        description: "9 EN: End or decrease by 1 a condition of your choice on the target.",
        baseBP: 1,
        baseEnergy: 9,
        opt1Cost: 5,
        opt1Description: "+5 EN for each additional condition or level of condition.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Ability Restore",
        description: "7 EN: Target may restore any number of their values (maximum health, energy, abilities, and so on) to their normal value.",
        baseBP: 1,
        baseEnergy: 7,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Enhancement",
        description: "2.5 EN: Add +1d2 to each Ability or Skill Roll or Score of the target's choice used during the power’s duration.",
        baseBP: 1,
        baseEnergy: 2.5,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN for each additional +1d2.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Deafen",
        description: "Target becomes deafened. Target's Fortitude.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Bane",
        description: "3 EN: Apply -1d2 to a Defense, Attack type (e.g., Strength or Agility attack), Potency, or Skill of your choice used during the power’s duration. You may choose to have this affect all defenses but end the first time it is used to lower a defense.",
        baseBP: 1,
        baseEnergy: 3,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN for each additional -1d2 decrease.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Weakened Strikes",
        description: "Decrease target's damage by 1d2.",
        baseBP: 1,
        baseEnergy: 1.5,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN for each additional 1d2 damage reduction.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Battle Disable",
        description: "2.5 EN: Decrease the target's attacks by 1. Targets your choice of Fortitude, Resolve, or Mental Fortitude which you choose upon making this power.",
        baseBP: 1,
        baseEnergy: 2.5,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN for each additional decrease of 1.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Shield",
        description: "X EN: Create a shield localized to a target which takes damage before they would at the cost of its HP. Target applies all damage to the shield before accounting for their resistances, vulnerabilities, and reductions.",
        baseBP: 1,
        baseEnergy: 0,
        opt1Cost: 1.5,
        opt1Description: "1.5 EN For every 2 HP of shield created.",
        BPIncreaseOpt1: 0,
        opt2Cost: 1,
        opt2Description: "+1EN to add an element (Fire, Ice, Lightning, Poison) to the shield giving the shield resistance to that element, and vulnerability to the opposite element.",
        BPIncreaseOpt2: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Weaken",
        description: "2.5 EN: Target gains the weakened 1 condition.",
        baseBP: 1,
        baseEnergy: 2.5,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN for each additional level of weakened condition applied.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Expose Vitals",
        description: "7 EN: Decrease target's critical range by 1 to a maximum of -10 from this part. Target's evasion.",
        baseBP: 1,
        baseEnergy: 7,
        opt1Cost: 6,
        opt1Description: "+6 EN for each additional -1 to critical range.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Weapon Damage Boost",
        description: "2.5 EN: Increase weapon damage dealt by target by 1d2 equal to the damage type of your choice, or the damage type they deal normally.",
        baseBP: 1,
        baseEnergy: 2.5,
        opt1Cost: 2.5,
        opt1Description: "+2.5 for each additional 1d2.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Purify",
        description: "4 EN: Remove a potion effect from an area, or object. You may choose to specify to remove any or a random effect if you are unaware if there is one (i.e., purifying food from a poison, even if you're unsure there is any.)",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Darkvision",
        description: "2.5 EN: Target gains darkvision out to 6 spaces.",
        baseBP: 1,
        baseEnergy: 2.5,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN for each additional 6 spaces of darkvision.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Enlarge",
        description: "6 EN: Increase willing target's size by one level. Target's evasion if unwilling.",
        baseBP: 1,
        baseEnergy: 6,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Shrink",
        description: "4 EN: Decrease willing target's size by one level. Target's evasion if unwilling.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Gas Form",
        description: "13 EN: Target willing creature transforms, along with anything they are wearing or holding, into a cloud of mist for a set duration. This power ends early if the target’s Health reaches 0 or if they use a basic action to end the transformation themselves. While in this mist form, the creature’s only movement is flying with a speed of 2 spaces. They can move through other creatures’ spaces, resist Bludgeoning, Piercing, or Slashing damage (but are still susceptible to damage from force or area effects). Target can only pass through spaces if those are not sealed off, but even they may pass through air-tight doors or gaps where they can fit. Other creatures cannot follow the target, except if they have certain abilities or specialized powers.",
        baseBP: 1,
        baseEnergy: 13,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Guided",
        description: "1.5 Ignore's the effect's of one level obscurity when targeting a creature with this power.",
        baseBP: 1,
        baseEnergy: 1.5,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN for each additional level of obsurity ignored.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "General"
    },
    {
        name: "Invisible Power",
        description: "3 EN: Power is invisible, the location of its effect cannot be seen, nor can its path of travel and so on.",
        baseBP: 1,
        baseEnergy: 3,
        type: "base",
        category: "General"
    },
    {
        name: "Subtle Power Use",
        description: "4 EN: You use the power undetected. Creatures cannot perceive you are using a power or are the one who used it. Creatures can roll discernment against your potency to attempt to perceive you as the power user.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "General"
    },
    {
        name: "Cause to Lose Focus",
        description: "3 EN: Target loses focus. Targets any defense of your choice other than evasion that's already a part of the power, otherwise this targets mental fortitude or resolve.",
        baseBP: 1,
        baseEnergy: 3,
        type: "base",
        category: "General"
    },
    {
        name: "Dousing",
        description: "1.5 EN: Power douses exposed flame in the area that aren't an active power. This can still be used to counter active fire powers.",
        baseBP: 1,
        baseEnergy: 1.5,
        type: "base",
        category: "General"
    },
    {
        name: "Flammable",
        description: "1.5 EN: The area or creatures your power affects are flammable while the power affects them. If touched by fire, the area or creature ignites, taking 1d4 fire damage each turn until an interaction is taken to put the fire out.",
        baseBP: 1,
        baseEnergy: 1.5,
        type: "base",
        category: "General"
    },
    {
        name: "Relocate Power",
        description: "1.5 EN: As a basic action, you may move this power to a new location within half its range, without affecting any creatures or objects along the path.",
        baseBP: 1,
        baseEnergy: 1.5,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN to use a quick action instead.",
        BPIncreaseOpt1: 0,
        opt2Cost: 3,
        opt2Description: "+3 EN to use a free action.",
        BPIncreaseOpt2: 0,
        opt3Cost: 3,
        opt3Description: "+3 EN to affect all creatures and objects on the path to the new location.",
        BPIncreaseOpt3: 0,
        type: "base",
        category: "General"
    },
    {
        name: "Interaction",
        description: "2 EN: You take the interact action as part of this power. If this is the only power part that is not a general part or power mechanic, it can be taken as a free action.",
        baseBP: 1,
        baseEnergy: 2,
        type: "base",
        category: "Actions"
    },
    {
        name: "Ability Roll",
        description: "2 EN: You take the ability roll action as part of this power. If this is the only power part that is not a general part or power mechanic, it can be taken as a free action.",
        baseBP: 1,
        baseEnergy: 2,
        type: "base",
        category: "Actions"
    },
    {
        name: "Evade",
        description: "4 EN: You take the evade action as part of this power. If this is the only power part that is not a general part or power mechanic, it can be taken as a free action.",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 4,
        opt1Description: "+4 EN for each additional time you take the evade action as part of this power up to 4 times.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Actions"
    },
    {
        name: "Brace",
        description: "4 EN: You take the brace action as part of this power. If this is the only power part that is not a general part or power mechanic, it can be taken as a free action.",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 4,
        opt1Description: "+4 EN for each additional time you take the brace action as part of this power up to 4 times.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Actions"
    },
    {
        name: "Focus (Action)",
        description: "5 EN: You take the focus action as part of this power. If this is the only power part that is not a general part or power mechanic, it can be taken as a free action.",
        baseBP: 1,
        baseEnergy: 5,
        opt1Cost: 5,
        opt1Description: "+5 EN for each additional time you take the focus action as part of this power up to 4 times.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Actions"
    },
    {
        name: "Search/Detect (Action)",
        description: "4 EN: You take the search or detect action as part of this power. If this is the only power part that is not a general part or power mechanic, it can be taken as a free action or reaction.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Actions"
    },
    {
        name: "Stealth/Hide (Action)",
        description: "9 EN: You take the stealth or hide action as part of this power. If this is the only power part that is not a general part or power mechanic, it can be taken as a free action.",
        baseBP: 1,
        baseEnergy: 9,
        opt1Cost: 7,
        opt1Description: "+7 EN to sustain this action on future turns without any action points for the duration of the power.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Actions"
    },
    {
        name: "Combination Attack",
        description: "4 EN: You take the combination attack reaction as part of this power. If this is the only power part that is not a general part or power mechanic, it can be taken as a free reaction.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Actions"
    },
    {
        name: "Help (Reaction)",
        description: "4 EN: You take the help reaction as part of this power. If this is the only power part that is not a general part or power mechanic, it can be taken as a free reaction.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Actions"
    },
    {
        name: "Defend",
        description: "4 EN: You take the defend reaction as part of this power. If this is the only power part that is not a general part or power mechanic, it can be taken as a free reaction.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Actions"
    },
    {
        name: "Outer Illusion",
        description: "5 EN: Outer illusions make the outside world seem different in some way (e.g., creating the appearance of a chest, person, animal, tree, etc.). An outer illusion is an inanimate illusion occupying a single target space and cannot target a creature. If a creature has reason to suspect it is an illusion, they may roll Discernment against your potency to learn it is an illusion.",
        baseBP: 1,
        baseEnergy: 5,
        opt1Cost: 1,
        opt1Description: "+1 EN for each additional space the illusion affects.",
        BPIncreaseOpt1: 0,
        opt2Cost: 1,
        opt2Description: "+1 EN & 1 BP to add sound to the illusion.",
        BPIncreaseOpt2: 1,
        opt3Cost: 2,
        opt3Description: "+2 EN & 1 BP to add both sound and animation/in-place movement.",
        BPIncreaseOpt3: 1,
        type: "base",
        category: "Illusion"
    },
    {
        name: "Massive Outer Illusion",
        description: "13 EN: Outer illusions make the outside world seem different in some way (e.g., creating the appearance of a chest, person, animal, tree, etc.). An outer illusion is an inanimate illusion occupying a single target space and cannot target a creature. If a creature has reason to suspect it is an illusion, they may roll Discernment against your potency to learn it is an illusion. The size of this illusion is equal to the size of the power's effect.",
        baseBP: 1,
        baseEnergy: 13,
        opt1Cost: 1,
        opt1Description: "+1 EN for each additional space the illusion affects.",
        BPIncreaseOpt1: 0,
        opt2Cost: 1,
        opt2Description: "+1 EN & 1 BP to add sound to the illusion.",
        BPIncreaseOpt2: 1,
        opt3Cost: 2,
        opt3Description: "+2 EN & 1 BP to add both sound and animation/in-place movement.",
        BPIncreaseOpt3: 1,
        type: "base",
        category: "Illusion"
    },
    {
        name: "Inner Illusion",
        description: "5 EN: Inner illusions make part of the world seem different in some way (e.g., creating the appearance of a chest, person, animal, tree, etc.) to a targeted individual. You may add other power parts to this power at 50% their energy cost to be part of the illusion, targeting mental fortitude instead of the normal defense.",
        baseBP: 1,
        baseEnergy: 5,
        opt1Cost: 1,
        opt1Description: "+1 EN for each additional space the illusion affects.",
        BPIncreaseOpt1: 0,
        opt2Cost: 1,
        opt2Description: "+1 EN & 1 BP to add sound to the illusion.",
        BPIncreaseOpt2: 1,
        opt3Cost: 2,
        opt3Description: "+2 EN & 1 BP to add both sound and animation/in-place movement.",
        BPIncreaseOpt3: 1,
        type: "base",
        category: "Illusion"
    },
    {
        name: "Invisibility",
        description: "12 EN: Make a willing target invisible for 1 hour. Targets evasion if the target is unwilling. Invisibility ends if the target uses a power, technique, or attack.",
        baseBP: 1,
        baseEnergy: 12,
        type: "base",
        category: "Illusion"
    },
    {
        name: "Combat Invisibility",
        description: "20 EN: Willing target becomes invisible. Targets evasion if unwilling.",
        baseBP: 1,
        baseEnergy: 20,
        type: "base",
        category: "Illusion"
    },
    {
        name: "Disguise",
        description: "9 EN: Change how you look and what you appear to be wearing to others for 10 minutes. This change cannot make you appear a size larger or smaller than your actual size. If a creature suspects you're disguised, they may roll Discernment against your potency to learn you are disguised.",
        baseBP: 1,
        baseEnergy: 9,
        opt1Cost: 3,
        opt1Description: "+3 EN for every additional 5 minutes.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Illusion"
    },
    {
        name: "Blind",
        description: "5 EN: Target creature becomes blinded. Target's Fortitude.",
        baseBP: 1,
        baseEnergy: 5,
        type: "base",
        category: "Illusion"
    },
    {
        name: "Silence",
        description: "7 EN: The space or target creature hit becomes completely silent. While affected, they gain the deafened condition and cannot use powers that require the Charisma power ability.",
        baseBP: 1,
        baseEnergy: 7,
        type: "base",
        category: "Illusion"
    },
    {
        name: "Scry Time",
        description: "9 EN: Look 6 seconds (1 round) into the future. All attack actions, potencies, and defenses gain +3 during these rounds.",
        baseBP: 1,
        baseEnergy: 9,
        opt1Cost: 9,
        opt1Description: "+9 EN for each additional turn seen in the future.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Illusion"
    },
    {
        name: "Read Mind",
        description: "Read a target's immediate thoughts (what they are thinking about in that moment). You must roll a power attack against a target's Discernment and succeed for them to not notice you are reading their mind. If you fail, they know you are attempting to read their mind and may roll Mental Fortitude against your potency, causing the power to fail on success.",
        baseBP: 1,
        baseEnergy: 9,
        opt1Cost: 4,
        opt1Description: "+4 EN & 1 BP to know their deeper thoughts and plans.",
        BPIncreaseOpt1: 1,
        opt2Cost: 8,
        opt2Description: "+8 EN & 2 BP instead to also know their deepest thoughts, secrets, intents, and desires.",
        BPIncreaseOpt3: 2,
        opt3Cost: 4,
        opt3Description: "+4 EN for each level of mind read (including first) for target to be unaware of your mind reading attempts.",
        BPIncreaseOpt3: 0,
        type: "base",
        category: "Illusion"
    },
    {
        name: "Darkness",
        description: "2 EN: Cause darkness to fill a specific area, lightly obscuring it. If cast on a light source, the light's radius decreases by 2 spaces for each level of obscurity. Light sources created by powers instead decrease by 1 space for each level of obscurity.",
        baseBP: 1,
        baseEnergy: 2,
        opt1Cost: 2,
        opt1Description: "+2 EN for each additional level of obscurity.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Illusion"
    },
    {
        name: "Fog",
        description: "2.5 EN: Create a thick cloud in a specific area (default 1 space), causing the area to become lightly obscured.",
        baseBP: 1,
        baseEnergy: 2.5,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN for each level of obscurity.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Illusion"
    },
    {
        name: "Modify Memories",
        description: "2 BP, 20 EN: You alter the memories of a target. If the creature is engaged in combat with you, it gains +5 to overcome this effect. The target becomes stunned 10 and is unaware of its surroundings, though it remains able to hear you. If the target suffers damage or is affected by another effect or power, this effect ends without modifying any memories. While the target is stunned, you may reshape its memory of an event that took place within the last 24 hours, provided the event lasted no more than 10 minutes. You can permanently erase the memory, make the target recall it with perfect accuracy, alter the details of the event, or implant a memory of a different event entirely. To modify the target's memory, you must describe the changes verbally in a language it understands. The target's mind fills in any inconsistencies in your description. If the energy's effect ends before you finish altering the memories, no changes take place. If completed, the modified memories take hold as this power ends. A modified memory may not necessarily change the creature’s behavior, especially if it conflicts with the creature’s personality, alignment, or beliefs. Illogical memories, like fondly recalling a swim in acid, are dismissed as dreams or misremembered events. The Realm Master may decide if a memory alteration is too unreasonable to influence the creature. Targets Resolve.",
        baseBP: 2,
        baseEnergy: 20,
        type: "base",
        category: "Illusion"
    },
    {
        name: "Illusioned Power",
        description: "+50% EN: This power and it's effects are entirely illusionary, although they still do the same things and have the same effect on the target as if it is really happening. Any damage the target takes still applies resistances and weakness of the damage type, but the actual damage that is applied is psychic. This means if you add fire damage to this power and deal 5 fire damage to a creature weak to fire, it would take 10 fire damage instead, but if it was also resistant to psychic, it would reduce that 10 to 5. The entire power and it's effect's target resolve instead of any other targeted defenses. The target cannot attempt to overcome this power after being effected until it suspects that it may be an illusion.",
        baseBP: 1,
        baseEnergy: 0.5,
        type: "increase",
        category: "Illusion"
    },
    {
        name: "Programmed Illusion",
        description: "0BP, 4 EN: Your illusion power is programed to move, sound, and appear in a certain way for up to 5 minutes when used.",
        baseBP: 0,
        baseEnergy: 4,
        type: "base",
        category: "Illusion"
    },
    {
        name: "Dream",
        description: "2 BP, 22 EN: You choose a creature you are familiar with in the same realm. You or a willing creature you touch enters a trance state to serve as a dream messenger. While in this trance, the messenger becomes unconscious and it's movment speed becomes 0. If the target is asleep, the messenger manifests in the target's dreams, allowing for conversation for the duration of the power as long as the target remains asleep. The messenger can also shape the dream environment, creating landscapes, objects, and various images. The messenger can exit the trance at any moment, which ends the power. The target will recall the dream in detail upon waking. If the target is awake when the power is used, the messenger becomes aware of this and can either terminate the trance (and thus the power) or wait for the target to fall asleep, at which point the messenger enters the target's dreams. You can choose to make the messenger appear terrifying to the target. If you do, the messenger can deliver a message of no more than ten words targeting resolve using your power bonus. On a failed save, the target suffers no restorative benefits from its recovery and takes 1d6 psychic damage upon waking.",
        baseBP: 2,
        baseEnergy: 22,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN for each additional 1d6 psychic damage.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Illusion"
    },
    {
        name: "Enthrall",
        description: "Target gets -1 to Discernment and Acuity skills when trying to perceive anything or anyone other than you, or a willing creature within range. Targets Resolve.",
        baseBP: 1,
        baseEnergy: 0.75,
        opt1Cost: 0.75,
        opt1Description: "+0.75 EN for each additional -1 to a maximum of -15.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Charm"
    },
    {
        name: "Compelled Duel",
        description: "6 EN: Target must overcome your potency with resolve each time it tries to attack a target other than you. If it fails, it may choose to use that action later in the turn to attack you instead, or it loses the action.",
        baseBP: 1,
        baseEnergy: 6,
        type: "base",
        category: "Charm"
    },
    {
        name: "Disagreeable",
        description: "5 EN: Target feels that every piece of information they encounter is wrong and they disagree with this information. This can be an opinion, idea, fact, with any method of delivery; written spoken or telepathically delieverd and so on. If more than one creature interacts with another who has this affect, they continually argue for the duration of the power or until something causes them to stop interacting in this way. Target's Resolve.",
        baseBP: 1,
        baseEnergy: 5,
        type: "base",
        category: "Charm"
    },
    {
        name: "Disorient",
        description: "7 EN: Target believe's the direction it's going is either the correct direction for their desired goal, or the opposite direction of their desired goal. If the creature can see the place they are desiring to go they gain +10 on the defense to overcome this affect. Targets Discernment or Resolve.",
        baseBP: 1,
        baseEnergy: 7,
        type: "base",
        category: "Charm"
    },
    {
        name: "Nondetection",
        description: "9 EN: Target cannot be the target of any power that would attempt to locate, or remotely see or percieve the target in any way.",
        baseBP: 1,
        baseEnergy: 9,
        type: "base",
        category: "Charm"
    },
    {
        name: "Body Swap",
        description: "2 BP, 15 EN: You become the target creature and target creature becomes you, each taking the physical body and location of the other. You retain all mental abilities, but temporarily replace your physical abilities, defenses, movement speed, evasion, physically related racial traits and current/maximum health with the target's. You do not gain any of the target's proficencies and each of your item's worn and carried remain on your body and do not travel with you to your new form. The same condition's apply to the creature in your form. You may still use power's and techniques known to you provided your new form allows it. You may choose to return to your form as a free action. Target's your choice of mental fortitude or resolve.",
        baseBP: 2,
        baseEnergy: 15,
        type: "base",
        category: "Charm"
    },
    {
        name: "Take-Over",
        description: "7 EN: You gain control over 1 of the target creature’s action points (AP) and may, as a reaction at the start of that creature’s turn, spend an equal amount of your own action points to force the creature to take a specific action. When you first affect the creature, you immediately gain knowledge of all possible actions they can take. The action you cause them to take can be any that the creature is capable of performing. Targets Resolve.",
        baseBP: 1,
        baseEnergy: 7,
        opt1Cost: 10,
        opt1Description: "+10 EN & +1 BP for each extra AP, up to a maximum of 3 AP in total.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Charm"
    },
    {
        name: "Compelling Sight",
        description: "+50% EN: After the initial use of the power causes a target to be effected, that target cannot attempt to overcome this power's effect while they remain within the range of this power and in line of sight of you or a creature you chose within range. This has no effect on a creature that does not have sight.",
        baseBP: 1,
        baseEnergy: 0.5,
        type: "increase",
        category: "Charm"
    },
    {
        name: "Suggest",
        description: "2 BP, 12 EN: You propose a course of action—explained in no more than 25 words—to a creature within range that can hear and understand you. The suggestion must seem reasonable and cannot involve actions that would obviously harm the target or its allies. For example, you might say, “Retrieve the book about the evil-doers activties vault and hand it to me,” or “Cease fighting, leave this town peacefully, and do not come back.” This course of action is taken for the duration of this power or until you or your allies cause the target harm. The target follows the suggestion to the best of its ability. If the suggested action can be completed before the power’s duration ends, the power ends early.  If the target is charmed by you they spend one additional action point on this movement until they are within 1 space of you. If the target is frightened of you they spend an additional action point moving away until they're in a location where they cannot move further. Target’s Resolve.",
        baseBP: 2,
        baseEnergy: 12,
        type: "base",
        category: "Charm"
    },
    {
        name: "Compelled Movement",
        description: "4 EN: Target must spend 1 action point on it's turn to move away from or towards you in the quickest and safest route possible. Target's Resolve",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN to increase this to 2 action points spent on movement instead.",
        BPIncreaseOpt1: 0,
        opt1Cost: 2.5,
        opt1Description: "+2.5 to force the creature to spend these action point(s) (if any) as a reaction, moving immidiately instead. If the creature doesn't have action points to spend on reactionary movement, they must spend as many as they can now, then spend the rest as a reaction when they regain action points.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Charm"
    },
    {
        name: "Mind Break",
        description: "6 EN: At the start of the target's turn they must roll Resolve against your potency (this does not count as their ability roll action). Every 5 under the potency results in that creature losing an action point. If they lose more action points than they have, then begin decreasing the amount of action points they regain at the end of their turn. Targets Resolve.",
        baseBP: 1,
        baseEnergy: 6,
        type: "base",
        category: "Charm"
    },
    {
        name: "Shift Focus",
        description: "4 EN: Target has a -1 on all attacks made against you for the duration.",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 3,
        opt1Description: "+3 EN for each additional -1.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Charm"
    },
    {
        name: "Curse",
        description: "4 EN: Target has -2 to the Defense and Skill rolls of one ability of your choice when you use this power. Targets Mental Fortitude, Resolve, or Fortitude.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Charm"
    },
    {
        name: "Communicate",
        description: "2 EN: Gain the ability to communicate with animals, non-sentient creatures, or plants for one minute, being able to understand them, and them you.",
        baseBP: 1,
        baseEnergy: 2,
        opt1Cost: 2,
        opt1Description: "+2 EN to extend this to one hour.",
        BPIncreaseOpt1: 0,
        opt2Cost: 6,
        opt2Description: "+6 EN to extend this to one day instead.",
        BPIncreaseOpt2: 0,
        type: "base",
        category: "Charm"
    },
    {
        name: "De-motivate",
        description: "4 EN: Target gains the weakened 1 condition whenever attempting to pursue the course of action they were taking when this power was used. Targets resolve.",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 2,
        opt1Description: "+2 EN to increase the weakened condition by +1.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Charm"
    },
    {
        name: "Escalate",
        description: "4 EN: Any emotion currently being felt by the target is heightened, targeting resolve. Example: If the target is feeling angry at someone or something, their anger is escalated to the level of the aggravate power part. If it was a power-induced aggravation, the power's effect is doubled.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Charm"
    },
    {
        name: "Vertigo",
        description: "4 EN: Target becomes faint. Targets resolve.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Charm"
    },
    {
        name: "Aggravate",
        description: "4 EN: Target becomes aggravated or more aggravated at a target of your choice that they can see for the round. Aggravated targets want to destroy the target they are aggravated at. +3 EN To cause the target to be angered towards any nearby target indiscriminately. Targets resolve.",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 1.5,
        opt1Description: "If the target is someone whom they are allied with, they gain a +8 bonus to their resolve to overcome this effect. +1.5 EN for each decrease of this bonus by 1.",
        BPIncreaseOpt1: 0,
        opt2Cost: 3,
        opt2Description: "+3 EN To cause the target to be angered towards any nearby target indiscriminately without granting a bonus to Resolve.",
        BPIncreaseOpt2: 0,
        type: "base",
        category: "Charm"
    },
    {
        name: "Friends",
        description: "2 BP, 6 EN: Target considers you friendly if it was indifferent or warm to you before and not hostile. If the target overcomes this power they are aware that you used a power to try and influence them provided their intelligence is above -4. Target's Resolve.",
        baseBP: 2,
        baseEnergy: 6,
        type: "base",
        category: "Charm"
    },
    {
        name: "Indifference",
        description: "4 EN: Target becomes indifferent toward creatures it was hostile at previously. This indifference ends when any hostile action is taken toward the target or it's allies from said creatures or their allies, or whenever the target takes damage. When the power ends their attitude returns to what it was when the power was used. Target's resolve.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Charm"
    },
    {
        name: "Charm",
        description: "5 EN: Target becomes charmed by you. Targets resolve.",
        baseBP: 1,
        baseEnergy: 5,
        opt1Cost: 2,
        opt1Description: "+2 EN for each additional creature you cause them to become charmed by. These additional creatures must be within the range of this power.",
        BPIncreaseOpt1: 0,
        opt2Cost: 2,
        opt2Description: "If the target is hostile toward you, they gain +5 to their resolve to resist this effect. +2 EN for each decrease of this bonus by 1.",
        BPIncreaseOpt2: 0,
        type: "base",
        category: "Charm"
    },
    {
        name: "Immune to Take-Over",
        description: "4 EN: Target is immune to having their actions or movement be controlled or decided by another entity. If target already had this condition it gains +5 on rolls to overcome it.",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 1,
        opt1Description: "+1 EN: Target with the condition loses it instead of gaining +5 to overcome.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Charm"
    },
    {
        name: "Immune to Frightened",
        description: "2 EN: Target is immune to the frightened condition. If target already had this condition it gains +5 on rolls to overcome it.",
        baseBP: 1,
        baseEnergy: 2,
        opt1Cost: 1,
        opt1Description: "+1 EN: Target with the condition loses it instead of gaining +5 to overcome.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Charm"
    },
    {
        name: "Immune to Charmed",
        description: "2.5 EN: Target is immune to the charmed condition. If target already had this condition it gains +5 on rolls to overcome it. ",
        baseBP: 1,
        baseEnergy: 2.5,
        opt1Cost: 1,
        opt1Description: "+1 EN: Target with the condition loses it instead of gaining +5 to overcome.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Charm"
    },
    {
        name: "Frighten",
        description: "6 EN: Target becomes frightened. Targets resolve.",
        baseBP: 1,
        baseEnergy: 6,
        type: "base",
        category: "Charm"
    },
    {
        name: "Mark",
        description: "2.5 EN: Whenever you deal damage to the target creature you may add 1d2 to that damage. Targets resolve.",
        baseBP: 1,
        baseEnergy: 2.5,
        opt1Cost: 2,
        opt1Description: "+2 EN for each additional 1d2.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Charm"
    },
    {
        name: "Command Movement",
        description: "8 EN: You choose how a target uses 1 action point worth of the movement action or interaction as long as it's not directly harmful such as making a target run off a cliff.",
        baseBP: 1,
        baseEnergy: 8,
        opt1Cost: 4,
        opt1Description: " +4 EN for each additional action point to a maximum of 3.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Charm"
    },
    {
        name: "Wall",
        description: "1.5 EN: Create a wall that is one space long and a half meter wide. The wall's evasion is 0 and has 5 hit points but cannot be critically hit. Each space of the wall has its own hit points. The wall can be shaped however you'd like with its provided amount of spaces including in a rounded shape. If the wall is created in the same space as a creature, the creature must roll Reflex against your potency or be placed on a side of the wall that you choose. If they succeed, they may choose which side to end up on. If this power deals damage it is only dealt if the creature fails this save or somehow transverses a space of the wall (including through breaking it and moving through it's space before the damage duration ends).",
        baseBP: 1,
        baseEnergy: 1.5,
        opt1Cost: 1,
        opt1Description: "+1 EN to add 2 hit points to the wall segments.",
        BPIncreaseOpt1: 0,
        opt2Cost: 1.5,
        opt2Description: "+1.5 EN to add 1 space to the wall's length.",
        BPIncreaseOpt2: 0,
        type: "base",
        category: "Creation"
    },
    {
        name: "Block",
        description: "3 EN: Block an attack by making a power roll to hit, using the roll as your new evasion. This replaces your regular evasion for the attack, and you must use the result. This part cannot be lingered.",
        baseBP: 1,
        baseEnergy: 3,
        type: "base",
        category: "Defense"
    },
    {
        name: "Power Armor",
        description: "5 EN: Create power armor on target. Power armor negates 1 damage from physical and power damage. Adding damage to power armor gives it the 'spiked' property, with the damage from spikes being the added damage. Elemental damage that is less effective against the element of the armor does half damage, while elemental damage that is effective against the armor type ignores its damage reduction. Power armor lasts 4 hours.",
        baseBP: 1,
        baseEnergy: 5,
        opt1Cost: 4,
        opt1Description: " +4 EN, +1 BP for each increase of 1 damage reduction, to a maximum of 10 including armor already worn. ",
        BPIncreaseOpt1: 1,
        opt2Cost: 4,
        opt2Description: " +4 EN, +1 BP for each additional 4 hours of duration.",
        BPIncreaseOpt2: 1,
        type: "base",
        category: "Defense"
    },
    {
        name: "Reflect",
        description: "3 EN: When you are the target of a non-Area of Effect power, you may cause the creator of the power to become the target instead, using your power attack roll up to a certain energy amount of the reflected power. Decide how much energy cost you wish to be able to reflect.",
        baseBP: 1,
        baseEnergy: 3,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN per 2 EN of the power being reflected.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Defense"
    },
    {
        name: "Deflect",
        description: "1.5 EN: When you are the target of a non-Area of Effect power, you may choose a new target for the power, using your power attack roll up to half the range of the original power. Decide how much energy cost you wish to be able to deflect.",
        baseBP: 1,
        baseEnergy: 1.5,
        opt1Cost: 1,
        opt1Description: "+1 EN per 2 EN of the power being reflected.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Defense"
    },
    {
        name: "Counter",
        description: "4 EN: Cause the target power in range to end immediately. Decide how much your power can end before using, i.e. you decide your power can negate 30 EN and below powers. This makes the cost of deflect 4 + 20 (1.5 of 30).",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN per 2 EN target spent on power.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Defense"
    },
    {
        name: "Absorb",
        description: "6 EN: Absorb energy from the target power. Every 2 EN the user paid for that power costs +1.5 EN to absorb. If you're unable to pay the full cost of the power to absorb, you absorb up to the amount you have but still get affected by the power. If the power deals damage, you may reduce that damage by 1 for every 2 EN absorbed. You gain all absorbed energy at the end of your turn.",
        baseBP: 1,
        baseEnergy: 6,
        opt1Cost: 1.5,
        opt1Description: "Every 2 EN the user paid for that power costs +1.5 EN to absorb.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Defense"
    },
    {
        name: "Negate",
        description: "11 EN: +1.5 EN per 2 EN target spent on power. When a power under the energy nagation of this power target's you, it has no affect. Decide how much your power can end before using, i.e. you decide your power can negate 30 EN and below powers. This makes the cost of negate = 15 + 1.5*15 (half of 30) which equals 37.5.",
        baseBP: 1,
        baseEnergy: 11,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN per 2 EN target spent on power.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Defense"
    },
    {
        name: "Dispell",
        description: "4 EN: Target a power that has already been used, and has a duration longer than one round in an attempt to end that power. If the power you're attempting to dispell has more energy cost than you can dispell, you can instead attempt a power attack roll against it in an attempt to dispell it, with a DS equal to 10 +1 for each 10 Energy that power cost.",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN for each 2 EN of the power being ended.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Defense"
    },
    {
        name: "Permanent Dispell",
        description: "38 EN: No powers can be used in or pass through the area while this power occupies it. Any magical items become mundane while they occupy the same space as this power. Any power that is lingering or exists in the area is dispelled.",
        baseBP: 1,
        baseEnergy: 38,
        type: "base",
        category: "Defense"
    },
    {
        name: "Blessed",
        description: "4 EN: Target gains 1d2 to overcome when targeting others and when they target you (other than increasing evasion).",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN for each additional +1d2.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Defense"
    },
    {
        name: "Resistance",
        description: "4 EN: Target creature gains resistance to one damage type for the duration. You must choose the damage type when creating the power.",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 4,
        opt1Description: "+4 EN, +1 BP for each additional damage type resistance. ",
        BPIncreaseOpt1: 1,
        type: "base",
        category: "Defense"
    },
    {
        name: "Minor Resistance",
        description: "1 EN: Once each turn when you take a chosen non-physical damage type (blunt, slashing, or piercing), you reduce that damage by 1d2.",
        baseBP: 1,
        baseEnergy: 1,
        opt1Cost: 0.5,
        opt1Description: "+0.5 EN for each additional 1d2.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Defense"
    },
    {
        name: "Evasion Buff",
        description: "4 EN: Increase target's evasion by +1.",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 3,
        opt1Description: "+3 EN for each additional +1 evasion.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Defense"
    },
    {
        name: "Ward",
        description: "2.5 EN: Target has -1 on D20 rolls and Potencies against you. Targets your choice of resolve, mental fortitude, or discernment.",
        baseBP: 1,
        baseEnergy: 2.5,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN for each additional -1 decrease. ",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Defense"
    },
    {
        name: "Sanctuary",
        description: "4 EN: When a creature target's the target of this power they must overcome your potency with resolve or be forced to choose a new target.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Defense"
    },
    {
        name: "Condition Resistance",
        description: "1.5 EN: Target gains +1 to overcome a specified condition.",
        baseBP: 1,
        baseEnergy: 1.5,
        opt1Cost: 1,
        opt1Description: "+1 EN for each additional +1.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Defense"
    },
    {
        name: "Condition Immunity",
        description: "6 EN: Target gains immunity to a specified condition. If you already have the condition you lose it.",
        baseBP: 1,
        baseEnergy: 6,
        opt1Cost: 4,
        opt1Description: "+4 EN & 1 BP for each additional condition. ",
        BPIncreaseOpt1: 1,
        type: "base",
        category: "Defense"
    },
    {
        name: "Connected Creatures",
        description: "7 EN: A willing target is connected to you. Whenever it would take damage it takes half of that damage and you take the other half (after applying that target's resistances and damage reduction[s]).",
        baseBP: 1,
        baseEnergy: 7,
        opt1Cost: 7,
        opt1Description: "+7 EN & 1 BP: Target's 1 unwilling creature and 1 willing creature. Whenever the willing creature would take damage it takes half of that damage and the unwilling creature take's the other half (after applying the willing target's resistances and damage reduction[s]).",
        BPIncreaseOpt1: 1,
        type: "base",
        category: "Defense"
    },
    {
        name: "Impassible Aura",
        description: "13 EN: Create an area that has a 1 space radius. No creature can enter that space for the power's duration, if the area is moved to occupy the same space as a creature then this power ends.",
        baseBP: 1,
        baseEnergy: 13,
        type: "base",
        category: "Defense"
    },
    {
        name: "Power Resistance",
        description: "6 EN: Target gains +1 to overcome any power that target's them.",
        baseBP: 1,
        baseEnergy: 6,
        opt1Cost: 6,
        opt1Description: "+6 EN for each additional +1.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Defense"
    },
    {
        name: "Power Damage Resistance",
        description: "17 EN: Target gains resistance to all damage dealt by powers.",
        baseBP: 1,
        baseEnergy: 17,
        type: "base",
        category: "Defense"
    },
    {
        name: "Fall Resistance",
        description: "3 EN: Reduce target's fall damage by 1/2.",
        baseBP: 1,
        baseEnergy: 3,
        opt1Cost: 4,
        opt1Description: "+4 EN to reduce fall damage to 0 instead.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Defense"
    },
    {
        name: "True Magic Damage",
        description: "2 EN: Add +1 magic damage to the power. +2 EN for each additional 1 magic damage. Targets evasion by default.",
        baseBP: 1,
        baseEnergy: 2,
        opt1Cost: 2,
        opt1Description: "+2 EN for each additional 1 magic damage.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Offense"
    },
    {
        name: "True Physical Damage",
        description: "2 EN: Add one physical damage type to your power (Piercing, Slashing, or Blunt). This automatically adds +1 to the power's damage. +1.5 EN for each additional 1 damage of this type dealt. +2 EN, +1 BP to apply more than one of these damage types to the power (this cost does not increase the damage). Targets evasion.",
        baseBP: 1,
        baseEnergy: 2,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN for each additional 1 damage of this type.",
        BPIncreaseOpt1: 0,
        opt2Cost: 2,
        opt2Description: "+2 EN, +1 BP to apply more than one of these damage types to the power (this cost does not increase the damage).",
        BPIncreaseOpt2: 0,
        type: "base",
        category: "Offense"
    },
    {
        name: "True Elemental Damage",
        description: "2 EN: Add one elemental damage type to your power (Fire, Ice, Lightning, or Acid). This automatically adds +1 to the power's damage. +1.5 EN for each additional 1 damage of this type dealt. +2 EN, +1 BP to apply more than one element to the power (this cost does not increase the damage). Targets evasion.",
        baseBP: 1,
        baseEnergy: 2,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN for each additional 1 damage of this type.",
        BPIncreaseOpt1: 0,
        opt2Cost: 2,
        opt2Description: "+2 EN, +1 BP to apply more than one element to the power (this cost does not increase the damage).",
        BPIncreaseOpt2: 0,
        type: "base",
        category: "Offense"
    },
    {
        name: "True Poison or Necrotic Damage",
        description: "2 EN: +1 Poison or Necrotic damage targeting fortitude. +1.5 EN per each additional +1 damage of that type.",
        baseBP: 1,
        baseEnergy: 2,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN per each additional +1 damage of that type.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Offense"
    },
    {
        name: "True Sonic Damage",
        description: "3 EN: +1 Sonic damage targeting fortitude. +2 EN per each additional +1 sonic damage.",
        baseBP: 1,
        baseEnergy: 3,
        opt1Cost: 2,
        opt1Description: "+2 EN per each additional +1 sonic damage.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Offense"
    },
    {
        name: "True Spiritual Damage",
        description: "3 EN: +1 Spiritual damage targeting resolve. +2 EN per each additional +1 spiritual damage.",
        baseBP: 1,
        baseEnergy: 3,
        opt1Cost: 2,
        opt1Description: "+2 EN per each additional +1 spiritual damage.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Offense"
    },
    {
        name: "True Psychic Damage",
        description: "4 EN: +1 Psychic damage targeting mental fortitude. +2 EN per each additional +1 psychic damage.",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 2,
        opt1Description: "+2 EN per each additional +1 psychic damage.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Offense"
    },
    {
        name: "Controlled Damage",
        description: "1 EN: Split damage into additional dice of the same value. +1 EN for every additional die added.",
        baseBP: 1,
        baseEnergy: 1,
        opt1Cost: 1,
        opt1Description: "+1 EN for every additional die added.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Offense"
    },
    {
        name: "Long-Linger Damage",
        description: "6 EN: Choose a damage type. Each round, the creature takes 1d4 damage of that type for 10 rounds. Targets Fortitude for all damage types except Psychic, which targets Mental Fortitude.",
        baseBP: 1,
        baseEnergy: 6,
        opt1Cost: 4,
        opt1Description: "+4 EN for each additional +1d4 damage per round.",
        BPIncreaseOpt1: 0,
        opt2Cost: 2.5,
        opt2Description: "+2.5 EN for every 2 additional rounds.",
        BPIncreaseOpt2: 0,
        type: "base",
        category: "Offense"
    },
    {
        name: "Siphon",
        description: "3 EN: Target loses hit points, energy, or both, equal to an amount decided when creating this power. You can decide how many points to drain from each resource (HP/EN) during use. If one resource is insufficient, the siphon automatically draws from the other. At the end of the turn, you regain HP and/or EN equal to what was siphoned, with siphoned energy giving you energy, and health giving you health (up to 10 points gained total). This part cannot have a duration of more than 1 round. Targets Fortitude.",
        baseBP: 1,
        baseEnergy: 3,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN for each 2 HP or EN siphoned.",
        BPIncreaseOpt1: 0,
        opt2Cost: 2.5,
        opt2Description: "+2.5 EN +1 BP to increase the max regained Health-Energy point amount by +5. ",
        BPIncreaseOpt2: 1,
        type: "base",
        category: "Offense"
    },
    {
        name: "Damage Siphon",
        description: "4 EN: When you damage a creature, you heal or regain energy equal to half the damage dealt (up to 10 points of HP/EN). This part cannot have a duration of more than one round.",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 1,
        opt1Description: "+1 EN and +1 BP to increase the maximum regained by +2.",
        BPIncreaseOpt1: 1,
        type: "base",
        category: "Offense"
    },
    {
        name: "Power Infused Strike",
        description: "3 EN: Add your Power Bonus to the attack and damage rolls you make with a melee or ranged weapon that is part of this power. You must be proficent with that weapon.",
        baseBP: 1,
        baseEnergy: 3,
        type: "base",
        category: "Offense"
    },
    {
        name: "Mend",
        description: "3 EN: This power repairs a single break or tear in an object you touch, like a broken chain link, two halves of a shattered key, a torn cloak, or a leaking wineskin. As long as the break or tear is no larger than 30 centimeters in any dimension, you mend it seamlessly, leaving no trace of the prior damage. This can physically restore a damaged magic item but cannot reinstate any lost magical properties.",
        baseBP: 1,
        baseEnergy: 3,
        type: "base",
        category: "Creation"
    },
    {
        name: "Minorly Manipulate Air",
        description: "0.5 BP, 1 EN: You generate a breeze strong enough to ripple fabric, stir dust, rustle leaves, and close open doors and shutters, all within a one-space cube. Doors and shutters that are held open by a person or object remain unaffected.",
        baseBP: 0.5,
        baseEnergy: 1,
        type: "base",
        category: "Creation"
    },
    {
        name: "Minorly Manipulate Earth",
        description: "0.5 BP, 1 EN: You create a thin layer of dust or sand that spreads over surfaces in a one and a half meter square area, or you inscribe a single word in your handwriting in a patch of dirt or sand.",
        baseBP: 0.5,
        baseEnergy: 1,
        type: "base",
        category: "Creation"
    },
    {
        name: "Minorly Manipulate Water",
        description: "0.5 BP, 1 EN: You conjure a spray of cool mist that lightly dampens creatures and objects within a meter and a half cube. Alternatively, you create one cup of clean water, either in an open container or on a surface, which evaporates after 1 minute.",
        baseBP: 0.5,
        baseEnergy: 1,
        type: "base",
        category: "Creation"
    },
    {
        name: "Minorly Manipulate Fire",
        description: "0.5 BP, 1 EN: You produce a thin cloud of harmless embers and colored, scented smoke within a one space cube. You determine the color and scent, and the embers can ignite candles, torches, or lamps in the area. The smoke's fragrance lingers for 1 minute.",
        baseBP: 0.5,
        baseEnergy: 1,
        type: "base",
        category: "Creation"
    },
    {
        name: "Minorly Manipulate Elements",
        description: "0.5 BP, 2 EN: You shape dirt, sand, fire, smoke, mist, or water that can fit within a 30-centimeter cube into a crude form (such as that of a creature), which holds its shape for 1 hour.",
        baseBP: 0.5,
        baseEnergy: 2,
        type: "base",
        category: "Creation"
    },
    {
        name: "Tremors",
        description: "0.5 BP, 1 EN: The ground vibrates harmlessly in a rhythm or continuously, as you choose, within the entire range of the power for one minute.",
        baseBP: 0.5,
        baseEnergy: 1,
        type: "base",
        category: "Creation"
    },
    {
        name: "Invisible Force",
        description: "0.5 BP, 2 EN: You instantly cause an unsecured door or window to burst open or slam shut or another harmless effect breifly manipulating a movable unsecured object.",
        baseBP: 0.5,
        baseEnergy: 2,
        type: "base",
        category: "Creation"
    },
    {
        name: "Detached Sound",
        description: "0.5 BP, 2 EN: Create a sound that is loaclized at a point within range such as ominous voices, a birds crow, or the distant sound of thunder.",
        baseBP: 0.5,
        baseEnergy: 2,
        type: "base",
        category: "Creation"
    },
    {
        name: "Booming Voice",
        description: "0.5 BP, 1 EN: Your voice amplifies to up to three times its normal volume for 1 minute. During this time, you gain +1 on Intimidation skill rolls using Charisma.",
        baseBP: 1,
        baseEnergy: 1,
        opt1Cost: 1,
        opt1Description: "+1 EN to increase these skill rolls by +1.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Creation"
    },
    {
        name: "Altered Eyes",
        description: "0.5 BP, 1 EN: Alter the color or appearance of your eyes for 1 minute.",
        baseBP: 0.5,
        baseEnergy: 1,
        type: "base",
        category: "Creation"
    },
    {
        name: "Flavor",
        description: "0.5 BP, 1 EN: Give a normal or somehwat unique flavor to up to one cubic half meter of food or liquid.",
        baseBP: 0.5,
        baseEnergy: 1,
        type: "base",
        category: "Creation"
    },
    {
        name: "Fire Manipulation",
        description: "0.5 BP, 1.5 EN: You instantly ignite or extinguish a small flamable object such as a candle, torch, or small campfire.",
        baseBP: 0.5,
        baseEnergy: 1.5,
        type: "base",
        category: "Creation"
    },
    {
        name: "Plant Manipulation",
        description: "0.5 BP, 1.5 EN: Slightly manipulate a plant by causing it to bud, bloom, grow a centimeter, wither slightly, change folower color to a different flower color or change leaf color to match a different season and so on.",
        baseBP: 0.5,
        baseEnergy: 1.5,
        type: "base",
        category: "Creation"
    },
    {
        name: "Chill or Warm",
        description: "0.5 BP, 1 EN: Warm or chill up to one cubic half meter of material, food or liquid.",
        baseBP: 0.5,
        baseEnergy: 1,
        type: "base",
        category: "Creation"
    },
    {
        name: "Mark",
        description: "0.5 BP, 1.5 EN: You cause a color, a small mark, or a symbol to manifest on an object or surface taking up no more than half a square meter for a duration of 1 hour.",
        baseBP: 0.5,
        baseEnergy: 1.5,
        type: "base",
        category: "Creation"
    },
    {
        name: "Clean or Soil",
        description: "0.5 BP, 1 EN: Instantly clean or soil an area no larger than half a cubic meter.",
        baseBP: 0.5,
        baseEnergy: 1,
        type: "base",
        category: "Creation"
    },
    {
        name: "Sensory Effect",
        description: "0.5 BP, 1.5 EN: Create a harmless sensory effect, such as cascading leaves, ethereal dancing fairies, a soft breeze, the sound of an animal, or a faint scent, soft musical notes or another noise. The effect must fit within a 1 space cube.",
        baseBP: 0.5,
        baseEnergy: 1.5,
        type: "base",
        category: "Creation"
    },
    {
        name: "Tiny Creation",
        description: "0.5 BP, 1.5 EN: You conjure a nonmagical trinket or an illusory image that can fit in your hand. It remains until the end of your next turn. A trinket cannot deal damage and has no monetary value. It lasts 1 minute.",
        baseBP: 0.5,
        baseEnergy: 1.5,
        type: "base",
        category: "Creation"
    },
    {
        name: "Weather Sense",
        description: "3 EN: You know what the weather will be like within the next 24 hours within 5 kilometers.",
        baseBP: 1,
        baseEnergy: 3,
        type: "base",
        category: "Creation"
    },
    {
        name: "Understand Language",
        description: "4 EN: Understand all written and audible langugages for the duration.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Utility"
    },
    {
        name: "Tongues",
        description: "3 EN: Gain proficecny in a chosen language for the duration.",
        baseBP: 1,
        baseEnergy: 3,
        type: "base",
        category: "Utility"
    },
    {
        name: "Light",
        description: "1 EN: Add bright light out to 2 spaces, with an additional 2 spaces of dim light. Bright light is considered unobscured, while dim light is lightly obscured for creatures relying on sight. If this is the only power part, the light lasts for 1 minute. The light can linger on a person, object, or in range in the air depending on the power.",
        baseBP: 1,
        baseEnergy: 1,
        opt1Cost: 1,
        opt1Description: "+1 EN to increase bright and dim light by 2 spaces each.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Utility"
    },
    {
        name: "Thought",
        description: "3 EN: Add a simple thought, idea, or memory to the power. Conditions for receiving or understanding this idea are set upon power creation. A thought not delivered to a target can take small physical form to signify its presence in an area, lingering until a full recovery. This form cannot be larger than a one-space flat surface. +2 EN to increase the space it can occupy.",
        baseBP: 1,
        baseEnergy: 3,
        opt1Cost: 2,
        opt1Description: "+2 EN to increase the space it can occupy to one cubic space or 1 additional space of flat surface.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Utility"
    },
    {
        name: "Distant Message",
        description: "15 EN: Send a message that only that creature can hear to any creature you are aware of that is at most 6 seconds of length. The creature can choose to block this power's ability to send them messages after they recieve the first message, creature's who do this cannot be contacted this way until they've had a full recovery or choose to allow messages.",
        baseBP: 1,
        baseEnergy: 15,
        type: "base",
        category: "Utility"
    },
    {
        name: "Breathe",
        description: "4 EN: Target can breathe normally despite an environmental factor that would prevent it (e.g., underwater, a realm without air, or a waterbreathing-only creature without water). You must choose the environmental factor upon creating the power. This effect lasts for 1 minute.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Utility"
    },
    {
        name: "Ping",
        description: "3 EN: Upon a set condition, you receive awareness of a specific event within the area where this power is used (e.g., a rune being touched, a thought being received or read, a creature entering an area, or a creature succeeding/failing a potency roll from your power). This effect persists in an area up to 1 space large until a full recovery.",
        baseBP: 1,
        baseEnergy: 3,
        opt1Cost: 3,
        opt1Description: "+3 EN for this to last up to 30 days.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Utility"
    },
    {
        name: "Audio",
        description: "1.5 EN: Add a sound to your power. This sound can only cause damage if sonic damage is added. The sound is audible within a 6-space radius.",
        baseBP: 1,
        baseEnergy: 1.5,
        opt1Cost: 0.5,
        opt1Description: "+0.5 EN for each additional 3 spaces of audition.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Utility"
    },
    {
        name: "Create Food",
        description: "5 EN: Create enough rations for 1 creature to avoid malnutrition. The rations are bland but look how you'd like them to. The food spoils if uneated in 24 hours but remains in exsistance.",
        baseBP: 0,
        baseEnergy: 5,
        opt1Cost: 4,
        opt1Description: "+4 EN For each additional ration.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Creation"
    },
    {
        name: "Create Water",
        description: "2.5 EN: Create up to 5 liters of clean water, enough to avoid dehydration for 1 creature. 5 liters of water can wet a creature or surface that occupies 1 space. If you attempt to douse a creature you target Reflex. The water created acts as normal water and does not go away when this power ends.",
        baseBP: 0,
        baseEnergy: 2.5,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN for each additional 5 liters.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Creation"
    },
    {
        name: "Destroy Water",
        description: "2.5 EN: Destroy up to 5 liters of water. 5 liters of water can wet a creature or surface that occupies 1 space.",
        baseBP: 0,
        baseEnergy: 2.5,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN for each additional 5 liters.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Creation"
    },
    {
        name: "Create Object",
        description: "4 EN: Create a tiny mundane object worth nothing that can have a small or no effect or usefulness.",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 2,
        opt1Description: "+2 EN for each 1 gold piece the object is worth.",
        BPIncreaseOpt1: 0,
        opt2Cost: 2,
        opt2Description: "+2 EN for each additional size the object is.",
        BPIncreaseOpt2: 0,
        type: "base",
        category: "Creation"
    },
    {
        name: "Contact Divine",
        description: "2 BP, 15 EN: Contact a divine being, it's servants, or another powerful and knowledgable being who is reveared. The being must truthfully answer one question to the best of it's knowledge about events that will transpire in the next 7 days and things relating to those events. You must wait to use the power again until you've finished a full recovery or when you use it again you have a 25% chance of failure (roll D100, 25 and under being failure). Each time you use this power this way the chance of failure increases by 25%.",
        baseBP: 2,
        baseEnergy: 15,
        type: "base",
        category: "Utility"
    },
    {
        name: "Commune with Divine",
        description: "2 BP, 17 EN: Contact a divine being, it's servants, or another powerful and knowledgable being who is reveared. The being must truthfully answer one question to the best of it's knowledge using yes or no or a short answer if that isn't clear. You must wait to use the power again until you've finished a full recovery or when you use it again you have a 25% chance of failure (roll D100, 25 and under being failure). Each time you use this power this way the chance of failure increases by 25%.",
        baseBP: 2,
        baseEnergy: 17,
        opt1Cost: 4,
        opt1Description: "+4 EN for each additional question you may ask this way to a maximum of 3.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Utility"
    },
    {
        name: "Commune with Nature",
        description: "2 BP, 15 EN: You commune with the natural world around you gathering information from plants and animals which grant you knowledge about the surrounding 100 meters of landscape, including bodies of water, settlements, ruins, common wildlife, uncommon creatures in the area, and so on.",
        baseBP: 2,
        baseEnergy: 15,
        opt1Cost: 2.5,
        opt1Description: " +2.5 EN for each additional 100 meters.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Utility"
    },
    {
        name: "Contact Other Realm",
        description: "2 BP, 20 EN: You contact a knowledgable entity from another realm. The being must truthfully answer one question to the best of it's knowledge using yes or no or a short answer if that isn't clear. You must wait to use the power again until you've finished a full recovery or when you use it again you have a 25% chance of failure (roll D100, 25 and under being failure). Each time you use this power this way the chance of failure increases by 25%.",
        baseBP: 2,
        baseEnergy: 20,
        opt1Cost: 2,
        opt1Description: "+2 EN for each additional question you may ask this way to a maximum of 3. ",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Utility"
    },
    {
        name: "Legend Knowledge",
        description: "2 BP, 23 EN: Name or describe a well-known figure, location, or artifact. You gain concise recounting of key lore associated with the chosen entity. The lore shared may include noteworthy facts, humorous insights, or even hidden knowledge unknown to most. The precision of the information received aligns with your prior knowledge: the more you know the richer and more specific the lore. While the information is truthful, it may be veiled in metaphor or conveyed through poetic language. If the chosen figure, location, or artifact is not widely recognized this power has no effect.",
        baseBP: 2,
        baseEnergy: 23,
        type: "base",
        category: "Utility"
    },
    {
        name: "True Telepathy",
        description: "2 BP, 30 EN: You link your mind with a willing creature with which you are familar with who is on the same realm as you. You and the target can share between eachother words, images, sensory information, and so on without any action cost. The power ends if you aren't in the same realm. Lasts 24 hours.",
        baseBP: 2,
        baseEnergy: 30,
        type: "base",
        category: "Utility"
    },
    {
        name: "Foresight",
        description: "4 BP, 48 EN: Target gains +2 on all attempts to overcome actively or passively until the next Partial Recovery.",
        baseBP: 4,
        baseEnergy: 48,
        type: "base",
        category: "Utility"
    },
    {
        name: "Noisy",
        description: "0 BP, -0.5 EN: This power can be heard from anywhere within 30 meters.",
        baseBP: 0,
        baseEnergy: -0.5,
        opt1Cost: -1,
        opt1Description: "-1 EN for each additional 30 meters to a maximum of 150 meters.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Utility"
    },
    {
        name: "Disintegrate",
        description: "12 EN: If this power would kill a creature it is turned to dust instead. If it would damage an object it turns any fractured portions into dust.",
        baseBP: 1,
        baseEnergy: 12,
        type: "base",
        category: "Offense"
    },
    {
        name: "Passage",
        description: "2 BP, 15 EN: A passage appears on a visible surface made of wood, plaster, stone, or other building material (such as a wall, ceiling, or floor) within range and lasts for the duration. You determine the dimensions of the opening: up to 5 feet wide, 8 feet tall, and 20 feet deep. The passage does not cause instability in the surrounding structure. When the passage vanishes, any creatures or objects remaining within it are safely ejected to the nearest unoccupied space adjacent to the surface of where it was.",
        baseBP: 2,
        baseEnergy: 15,
        type: "base",
        category: "Creation"
    },
    {
        name: "Exclude Area",
        description: "0 BP, 5 EN: You may choose to exclude certain parts within an area of effect of this power from being affected.",
        baseBP: 0,
        baseEnergy: 5,
        type: "base",
        category: "Power Mechanics"
    },
    {
        name: "Heal",
        description: "2 EN: Heal target for 1d2.",
        baseBP: 1,
        baseEnergy: 2,
        opt1Cost: 1.25,
        opt1Description: "+1.25 EN for each additional 1d2 healed.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "True Heal",
        description: "2 EN: Heal target for 1.",
        baseBP: 1,
        baseEnergy: 2,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN for each additional 1 healed.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Overheal",
        description: "2 EN: Heal target for 1d2. This healing can exceed the target’s health maximum. The health maximum doesn't increase, but allows the creature to have additional hit points until they lose them. Health maximum resets after any recovery.",
        baseBP: 1,
        baseEnergy: 2,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN for each additional 1d2.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "True Overheal",
        description: "2 EN: Heal target for 1. This healing can exceed the target’s health maximum. The health maximum doesn't increase, but allows the creature to have additional hit points until they lose them. Health maximum resets after any recovery.",
        baseBP: 1,
        baseEnergy: 2,
        opt1Cost: 1.75,
        opt1Description: "+1.75 EN for each additional 1 healed.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Major Heal",
        description: "3 BP, 22 EN: Heal target for 25 Hit Points.",
        baseBP: 3,
        baseEnergy: 22,
        opt1Cost: 5,
        opt1Description: "+5 EN for each additional 5 hit points.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Massive Heal",
        description: "4 BP, 37 EN: Target heals for 80 hit points. +5 EN for each additional 15 hit points.",
        baseBP: 4,
        baseEnergy: 37,
        opt1Cost: 5,
        opt1Description: "+5 EN for each additional 15 hit points.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Healing Boost",
        description: "6 EN: Target creature regains the maximum number of hit points possible whenever it recieves any healing stating on the turn after this.",
        baseBP: 1,
        baseEnergy: 6,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Death Defying",
        description: "1.5 EN: When in the dying condition the target's dying damage die size never increases.",
        baseBP: 1,
        baseEnergy: 1.5,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Terminal Recovery",
        description: "1.5 EN: Target creature in the dying condition heals 1 hit point.",
        baseBP: 1,
        baseEnergy: 1.5,
        opt1Cost: 1.5,
        opt1Description: " +1.5 EN for each additional hit point healed.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Stablize",
        description: "2 BP, 9 EN: Target creature that is in the dying condition returns to 0 hit points and is stabilized, though still in the dying condition.",
        baseBP: 2,
        baseEnergy: 9,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Regenerate",
        description: "2 BP, 42 EN: Target creature's chosen body part regenerates over the next 24 hour period. During this time it cannot be used. If the creature dies before the bodypart has regenerated this power ends leaving the limb partially regenerated, unless the target is already dead.",
        baseBP: 2,
        baseEnergy: 42,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Revive",
        description: "2 BP, 15 EN: Touch and restore a dead target to 1 hit point, as long as it died within the last round and has all vital body parts. You must decide how many rounds when creating the power. Revived targets are at 0 HP and stable.",
        baseBP: 2,
        baseEnergy: 15,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN per each additional round the target has been dead.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Restore to Life",
        description: "3 BP, 23 EN: Touch and restore a dead target to 1 hit point, as long as it died within the last day and has all vital body parts. +4 EN per each additional day that target has been dead. Target loses all conditions it had before death. The target raised to life gains one level of exhaustion for every day the target was dead to a maximum exhaustion of 5 from this power.",
        baseBP: 3,
        baseEnergy: 23,
        opt1Cost: 4,
        opt1Description: "+4 EN per each additional day the target has been dead.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Form Life",
        description: "3 BP, 23 EN: Touch a part of a dead target and form a new body of a random species to which you have access, as long as the target died within the last day. They replace all species traits on their character sheet with the new species, including flaws, ancestries, and characteristics chosen at random. Roll 1d4, and on odd results, add a flaw and additional ancestry; otherwise, do not add a flaw. The creature retains all feats, powers, techniques, and knowledge, even if these do not work with their new species/size. This power part takes 1 hour to use.",
        baseBP: 3,
        baseEnergy: 23,
        opt1Cost: 4,
        opt1Description: "+4 EN for each additional day the target has been dead.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Become Wind",
        description: "2 BP, 20 EN: Target becomes a gaseous form, appearing as wisps of cloud. While in this cloud form, a target has a Fly Speed of 60 spaces and can hover. It is Immune to the Prone condition and has Resistance to Bludgeoning, Piercing, and Slashing damage. The only things target can take in this form is Dash or spend a basic action to begin reverting to its normal form. Reverting takes 1 minute, during which the target has the Stunned 3 condition which does not decay. Until the Power ends, the target can revert to cloud form, which also requires a basic action followed by a 1-minute transformation. If a target is in gaseous form and flying when the effect ends, the target descends 12 spaces per round for 1 minute until it lands safely. If it can’t land after 1 minute, it falls the remaining distance.",
        baseBP: 2,
        baseEnergy: 20,
        type: "base",
        category: "Control"
    },
    {
        name: "Manipulate Earth",
        description: "11 EN: Choose an area of terrain no larger than 4 spaces on a side within range. You can reshape dirt, sand, or clay in the area in any manner you choose for the duration. You can raise or lower the area’s elevation, create or fill in a trench, erect or flatten a wall, or form a pillar. The extent of any such changes can’t exceed half the area’s largest dimension. For example, if you affect an 4-space square, you can create a pillar up to 2 spaces high, raise or lower the square’s elevation by up to 2 spaces, dig a trench up to 2 spaces deep, and so on. It takes 10 minutes for these changes to complete. Because the terrain’s transformation occurs gradually, creatures in the area can’t usually be trapped or injured by the ground’s movement. At the end of every 10 minutes of this power's duration, you can choose a new area of terrain to affect within range. This Power can’t manipulate natural stone or stone construction. Rocks and structures shift to accommodate the new terrain. If the way you shape the terrain would make a structure unstable, it might collapse. Similarly, this Power doesn’t directly affect plant growth. The moved earth carries any plants along with it.",
        baseBP: 1,
        baseEnergy: 11,
        opt1Cost: 7,
        opt1Description: "+7 EN: Double each dimension affected by the terrain manipulation.",
        BPIncreaseOpt1: 0,
        opt2Cost: 7,
        opt2Description: "+7 EN: Immediate effect on the terrain transformation.",
        BPIncreaseOpt2: 0,
        type: "base",
        category: "Control"
    },
    {
        name: "Knock Prone",
        description: "Knock target prone. Target's the target's choice of might or reflex.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Control"
    },
    {
        name: "Controlling Summon",
        description: "6 EN: Summon or create an unseen hand, creature, or other spector that can manipulate the world in small ways. This summon can move up to 6 spaces away from you, disappearing if it moves any further. This summon can manipulate the world in small ways, taking only interact and movement actions, and only able to hold up to 5 kilograms of mass. It has 1 Hit Point, 3 speed. The summon lasts for 1 minute.",
        baseBP: 1,
        baseEnergy: 6,
        opt1Cost: 1,
        opt1Description: " +1 EN for each additional 2 spaces this summon can move away from you.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Control"
    },
    {
        name: "Escape",
        description: "4 EN: Target is released from any mundane restraints and cannot be grappled. If the target is already grappled it is no longer grappled.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Control"
    },
    {
        name: "Create Difficult Terrain",
        description: "3 EN: The area affected by the power is considered difficult terrain to creatures on the ground.",
        baseBP: 1,
        baseEnergy: 3,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN to cause difficult terrain to apply to the air as well.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Control"
    },
    {
        name: "Immune to Difficult Terrain",
        description: "2.5 EN: You aren't affected by difficult terrain and can move as normal.",
        baseBP: 1,
        baseEnergy: 2.5,
        type: "base",
        category: "Control"
    },
    {
        name: "Scaled Slowing",
        description: "7 EN: Decrease target's Speed by 1/2. Target's the target's choice of Might, Evasion, or Reflex.",
        baseBP: 1,
        baseEnergy: 7,
        opt1Cost: 4,
        opt1Description: "+4 EN to decrease it to 1/4 of its total instead, to a minimum of 1 MS.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Control"
    },
    {
        name: "Slow",
        description: "2 EN: Target gains the Slowed 1 condition. Target's Might, Evasion, or Reflex",
        baseBP: 1,
        baseEnergy: 2,
        opt1Cost: 1.5,
        opt1Description: "+2.5 EN for each additional level of the Slowed condition.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Control"
    },
    {
        name: "Unlock",
        description: "3 EN: Unlock one minor, uncomplex lock (e.g., simple boxes, wooden doors, DS 10 or below).",
        baseBP: 1,
        baseEnergy: 3,
        opt1Cost: 6,
        opt1Description: "+6 EN for small, slightly harder locks (e.g., wooden chests, safer doors, etc., DS 15 or below).",
        opt2Cost: 10,
        opt2Description: "+10 EN for hard, more complex locks (e.g., metal doors, stronger chests, complex boxes, etc., DS 20 or below).",
        opt3Cost: 4,
        opt3Description: "Increase DS for an additional +5 after increasing to DS 20 first.",
        BPIncreaseOpt3: 1,
        type: "base",
        category: "Control"
    },
    {
        name: "Lock",
        description: "9 EN: Lock something that can be locked such as a door, chest, window, and so on. The DS for this lock is equal to your potency and lasts until unlocked.",
        baseBP: 1,
        baseEnergy: 9,
        type: "base",
        category: "Control"
    },
    {
        name: "Teleport",
        description: "4 EN: Teleport target to a location that you can see. If the target is an enemy, the target's Might is tested; on success, the target is teleported to a safe location without immediate danger.",
        baseBP: 2,
        baseEnergy: 4,
        opt1Cost: 1,
        opt1Description: "+1 EN Increase teleport range by 3 spaces.",
        BPIncreaseOpt1: 0,
        opt2Cost: 11,
        opt2Description: "+11 EN allows enemy teleportation to any location, dangerous or not, within the base range.",
        BPIncreaseOpt2: 0,
        type: "base",
        category: "Control"
    },
    {
        name: "Multi-Teleport",
        description: "7 EN: Teleport target to a location that you can see within half of the power's base range. If the target is an enemy, this target's Might; on success, the target can only be teleported to a safe location without immediate danger.",
        baseBP: 1,
        baseEnergy: 7,
        opt1Cost: 4,
        opt1Description: "+4 EN for each time you cause the target to teleport this way as part of the same action this power took to use.",
        opt2Cost: 15,
        opt2Description: "+15 EN allows enemy teleportation to any location, dangerous or not, within the base range.",
        BPIncreaseOpt2: 0,
        type: "base",
        category: "Control"
    },
    {
        name: "Advanced Teleport",
        description: "11 EN: Teleport to a location that you can or cannot see within the range of this power by describing exatly where you'd like to appear such as '10 spaces north and 2 spaces upwards' or simply by teleporting to a seen location instead. If you accidentally teleport into a location that is completely occupied you take 4d10 irreducible damage and appear at the closest unoccupied space instead, having the RM choose if they're equal distance.",
        baseBP: 1,
        baseEnergy: 11,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN to teleport double the base range of this power instead.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Control"
    },
    {
        name: "Long Distance Teleport",
        description: "3 BP, 26 EN: Teleport to a location that you have been to that is within 300 kilometers. +11 EN again to remove a distance limitation. If this power is used to teleport target from the same two locations 10 times within a month, then the effects of the power are permanant and allow any creature that the power user dedicates to teleport between the locations without energy cost.",
        baseBP: 3,
        baseEnergy: 26,
        opt1Cost: 11,
        opt1Description: "+11 EN to increase this to 800 kilometers.",
        opt2Cost: 22,
        opt2Description: "+22 EN instead to remove a distance limitation. ",
        BPIncreaseOpt2: 0,
        type: "base",
        category: "Control"
    },
    { 
        name: "Swap",
        description: "6 EN: Switch places with an object or creature within range that weighs less than you. Swapping requires a roll to hit the object's evasion or the target's Might. If swapping with a moving object, the object continues moving in the same direction after the swap, traveling the remaining distance it would have gone.",
        baseBP: 1,
        baseEnergy: 6,
        type: "base",
        category: "Control"
    },
    {
        name: "Knockback",
        description: "4 EN: Knock the target back 1 space (in the opposite direction of the hit). The EN cost increases by 1 EN for each size above medium a creature or object is, or decrease by 1 EN for each size below medium. If casting can move sizes above the target's size, the target is moved an additional 1 space for each size smaller than the maximum size that can be knocked back. Targets Might.",
        baseBP: 1,
        baseEnergy: 4,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN for each additional space the target is knocked back.",
        type: "base",
        category: "Control"
    },
    {
        name: "Daze",
        description: "4 EN: Target becomes dazed for the power's duration. Targets Fortitude.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Control"
    },
    {
        name: "Restrained",
        description: "6 EN: Target becomes restrained. Targets Might.",
        baseBP: 1,
        baseEnergy: 6,
        type: "base",
        category: "Control"
    },
    {
        name: "Stun",
        description: "7 EN: Target becomes stunned (level 1). Targets Fortitude.",
        baseBP: 1,
        baseEnergy: 7,
        opt1Cost: 9,
        opt1Description: "+9 EN for each additional level of stunned.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Control"
    },
    {
        name: "Grapple",
        description: "12 EN: Target becomes grappled by you if they are within 1 space of you. Target chooses between Reflex or Might.",
        baseBP: 1,
        baseEnergy: 12,
        type: "base",
        category: "Control"
    },
    {
        name: "Control",
        description: "3 EN: Control a physical object that weighs up to 200 kgs within range and sight. The object can be levitated, thrown, or moved. It can only be moved as far as the power's range. Thrown objects do 1d2 damage upon hit and can be thrown to a range equal to the power's base range. If an object is already a weapon that can be thrown, it deals thrown weapon damage. Targets Might or Reflex.",
        baseBP: 1,
        baseEnergy: 3,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN +1 BP for an additional 200 kgs of weight levitated.",
        BPIncreaseOpt1: 1,
        opt2Cost: 1.5,
        opt2Description: "+1.5 EN +1 BP per additional object levitated (weight ability to lift is split between all objects).",
        BPIncreaseOpt2: 1,
        type: "base",
        category: "Control"
    },
    {
        name: "Suspend",
        description: "6 EN: Suspend a target object or creature you hit in its current position within range (e.g., in the air, on the ground, etc.). The object remains suspended for the round. You can release the suspension as a quick reaction or action; it then continues on its original path. If you suspend a ranged attack or object, its Evasion is equal to the roll-to-hit of the target throwing or shooting that object. If you suspend a creature, it becomes immobile for the duration of the power; Targets their choice of Might or Reflex.",
        baseBP: 1,
        baseEnergy: 6,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN +1 BP for each additional round suspended.",
        BPIncreaseOpt1: 1,
        type: "base",
        category: "Control"
    },
    {
        name: "Circle",
        description: "1.5 EN: This part affects parts of a power that target evasion. Your power circles around the target within 1 space of it. If the target moves to or through where the attack is circling, the attack hits. You may roll to hit other targets inside the circle of attack as a quick action. You may choose to hit the target being circled without needing to roll. The circle lasts 1 round; at the end of that round, the circling attack hits the target without using an action.",
        baseBP: 1,
        baseEnergy: 1.5,
        opt1Cost: 1,
        opt1Description: "+1 EN for each additional round of circling.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Control"
    },
    {
        name: "Forbiddance",
        description: "15 EN: Ward an area from any form of magical travel such as teleporting in or out. The area a 30 meter radius centered on a point you can see.",
        baseBP: 1,
        baseEnergy: 15,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN for each additional 30 meters.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Control"
    },
    {
        name: "Fly",
        description: "9 EN: You can fly with a speed of 3 spaces.",
        baseBP: 1,
        baseEnergy: 9,
        opt1Cost: 3,
        opt1Description: "+3 EN for each additional 3 spaces.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Control"
    },
    {
        name: "Climbing",
        description: "1.5 EN: Target gains a climb speed equal to one half of their speed. They can climb vertical and horizontal surfaces even upside down.",
        baseBP: 1,
        baseEnergy: 1.5,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN For this to be the target's full speed instead.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Control"
    },
    {
        name: "Vanish from Realm",
        description: "6 EN: Vanish from this realm and appear in a safe and temporary demi-realm where you cannot see or hear anything. You re-appear in the same location from which you vanished when this duration ends (or on another condition specified in the power).",
        baseBP: 1,
        baseEnergy: 6,
        type: "base",
        category: "Control"
    },
    {
        name: "Merge with Material",
        description: "11 EN: You step into a specific material made object or surface large enough to fully contain your body, merging yourself and your equipment with the material for the duration. To use this power, you must touch the material. Nothing of your presence remains visible or otherwise detectable by nonmagical senses. While merged with the material, you cannot see outside, and any Acuity rolls or scores to hear sounds beyond the material have -5. You remain aware of the passage of time and can use powers on yourself while merged within it. You can use 1 space of movement to exit the material where you entered, which ends the power. Otherwise, you cannot move. Minor physical damage to the material does not harm you, but partial destruction or alteration of its shape (to the extent that you no longer fit within it) expels you and inflicts 6d6 Magic damage. Complete destruction of the material (or its transmutation into a different substance) expels you and inflicts 50 Magic damage. If expelled, you appear in the nearest unoccupied space to where you first entered, and you are Prone.",
        baseBP: 1,
        baseEnergy: 11,
        type: "base",
        category: "Control"
    },
    {
        name: "Remove Action Points",
        description: "2 BP, 7 EN: Remove 1 of the target's action points. At the end of the target's turn it regains 1 less action point. +7 EN For each additional action point removed to a maximum of 3. Target's your choice of defense (might by default).",
        baseBP: 2,
        baseEnergy: 7,
        opt1Cost: 7,
        opt1Description: "+7 EN For each additional action point removed to a maximum of 3.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Control"
    },
    {
        name: "Flood",
        description: "0.5 BP, 4 EN: Raise the water level of an area by 1 space. If the area is a large body of water you can create waves this high instead traveling through one side of the area to another. If it collides with a boat where the wave is at least half the height or more of it, it has a 25 percent chance of capsizing.",
        baseBP: 0.5,
        baseEnergy: 4,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN for each additional space to a maximum of 5 spaces.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Control"
    },
    {
        name: "Part Liquid",
        description: "0.5 BP, 3 EN: All liquid in an area is moved to the sides of the area and slowly fills in after this power ends.",
        baseBP: 0.5,
        baseEnergy: 3,
        type: "base",
        category: "Control"
    },
    {
        name: "Redirect Liquid",
        description: "0.5 BP, 4 EN: You direct liquid in the area to move in a direction of your choice, even if it needs to flow over obstacles, up walls, or through other unusual paths. Within the area of effect, the liquid moves as you command, but once it flows beyond this area, it resumes its natural course based on the terrain. The liquid will continue moving in the specified direction until the effect ends or you choose to apply a different effect.",
        baseBP: 0.5,
        baseEnergy: 4,
        type: "base",
        category: "Control"
    },
    {
        name: "Control Weather",
        description: "2 BP, 20 EN: You take control of the weather within 5 kilometers of you for the duration. You must be outdoors to use this Power, and it ends early if you go indoors. When you activate the Power, you alter the current weather conditions, which are determined by the RM. You can change precipitation, temperature, and wind. It takes 1d4 × 10 minutes for the new conditions to gradually take effect. Once they do, you can change the conditions again. When the Power ends, the weather gradually returns to its normal state. When changing the wind, you can also alter its direction.",
        baseBP: 2,
        baseEnergy: 20,
        opt1Cost: 7,
        opt1Description: "+7 EN Increase the radius by 5 kilometers.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Control"
    },
    {
        name: "Mini-Demirealm",
        description: "9 EN: Create space accessible through a 1x2 space opening or a 1 space horizontal opening. The space is a 1x2 meter demirealm.",
        baseBP: 1,
        baseEnergy: 9,
        type: "base",
        category: "World Manipulation"
    },
    {
        name: "Demirealm",
        description: "2 BP, 60 EN: Create an opening that can have a door or not. The opening goes into a 6x6 space stone or wood room. The power lasts for an hour and if any creature's are inside when it ends they can choose to appear outside of the opening or remain within the demirealm. Each time you use this power part you  can choose to connect to a demirealm that you've created before or to create a new one. All items remain within that demirealm.",
        baseBP: 2,
        baseEnergy: 60,
        type: "base",
        category: "World Manipulation"
    },
    {
        name: "Realmshift",
        description: "4 BP, 52 EN: Transport target to a different realm known to you, or a random unknown realm of the RM's choice. Targets mental fortitude or evasion of target creature if it is unwilling.",
        baseBP: 4,
        baseEnergy: 52,
        type: "base",
        category: "World Manipulation"
    },
    {
        name: "Negate Gravity",
        description: "22 EN: Negate gravity for target for the duration. Targets without gravity cannot move using the ground unless they grapple it. If hit, they automatically take 3 spaces of movement knockback, including upward, if not holding onto something. Once moving in a direction, they continue moving in that direction at a pace equal to the number of spaces they moved each round unless they're able to control themselves or stop somehow.",
        baseBP: 1,
        baseEnergy: 22,
        type: "base",
        category: "World Manipulation"
    },
    {
        name: "Invert or Redirect Gravity",
        description: "32 EN: Target's gravity is redirected to a certain direction. They treat the world as if for them gravity affects them and all they are wearing in this new direction. If they would fall, they fall 12 spaces in the direction of gravity per round their gravity is affected.",
        baseBP: 1,
        baseEnergy: 32,
        type: "base",
        category: "World Manipulation"
    },
    {
        name: "Increase Gravity",
        description: "15 EN: The effect of gravity on the target doubles. Each level of increased gravity causes fall damage and speed to double, -1 to Reflex and physical attack rolls for each level of gravity increase. Movement speed on the 'ground' gravity affects is reduced by 1 for each level of increase to a minimum of 1 MS. When tripling gravity increase or more, the target takes 1d4 bludgeoning damage at the beginning of its turn +1d4 for each level of increase.",
        baseBP: 1,
        baseEnergy: 15,
        opt1Cost: 7,
        opt1Description: "+7 EN, +1 BP for each additional multiplier of increase (triple, quadruple, etc.)",
        BPIncreaseOpt1: 1,
        type: "base",
        category: "World Manipulation"
    },
    {
        name: "Gravity Center",
        description: "9 EN: Create a new center of gravity at the target point. Creatures and objects not secured to something within 1 space of this point are pulled closer to it on a failed Might check against your potency. If pulled in, creatures and objects can occupy the same space as other creatures and objects pulled into the gravity center.",
        baseBP: 1,
        baseEnergy: 9,
        opt1Cost: 6,
        opt1Description: "+6 EN, +1 BP to increase the range of the gravity center by 1 space.",
        BPIncreaseOpt1: 1,
        type: "base",
        category: "World Manipulation"
    },
    {
        name: "Freeze Time",
        description: "2 BP, 21 EN: Time stops. Time freezes for every target and object, except those your character is touching or carrying before freezing time. Using any powers or techniques or making any attacks while time is frozen that would harm another creature causes this power to end immediately, unfreezing time and resuming initiative order with the turn after yours.",
        baseBP: 2,
        baseEnergy: 21,
        opt1Cost: 11,
        opt1Description: "+11 EN, +1 BP per additional round of frozen time",
        BPIncreaseOpt1: 1,
        type: "base",
        category: "World Manipulation"
    },
    {
        name: "Rewind Time",
        description: "2 BP, 22 EN: Time reverses a target creature or object, placing them in the state they were in exactly one round before. They return to the original condition and position they were in at the beginning of the turn in which time was rewound. If the target is unwilling, you target their Evasion.",
        baseBP: 2,
        baseEnergy: 22,
        opt1Cost: 9,
        opt1Description: "+9 EN, +1 BP per additional round(s) of rewinded time.",
        BPIncreaseOpt1: 1,
        type: "base",
        category: "World Manipulation"
    },
    {
        name: "Terraform",
        description: "2 BP, 23 EN: Change 100 spaces in each direction into a terrain of your choice that would occur naturally in nature. The Realm Master decides how the terrain affects targets, but you may decide the terrain type and what it generally looks like. Whatever the chosen terrain is, it cannot immediately harm any creatures, such as a chasm opening beneath a creature, causing it to fall and take more than the damage given by the power itself. Lasts for 5 minutes.",
        baseBP: 2,
        baseEnergy: 23,
        opt1Cost: 7,
        opt1Description: "+7 EN to increase the range by 100 spaces.",
        BPIncreaseOpt1: 0,
        opt2Cost: 7,
        opt2Description: "+7 EN, +1 BP to add +1d2 damage per turn to the terrain landscape targeting Reflex, i.e., inside a volcanic terrain, creatures would roll Reflex at the start of their turn(s), taking 1d2 fire damage on failure.",
        BPIncreaseOpt2: 1,
        opt3Cost: 11,
        opt3Description: "+11 EN, +1 BP for every additional 5 minutes.",
        BPIncreaseOpt3: 1,
        type: "base",
        category: "World Manipulation"
    },
    {
        name: "Growth",
        description: "Grow any living plant in range. This plant can provide cover and take damage like any other plant large enough to fill the space it occupies.",
        baseBP: 1,
        baseEnergy: 0,
        opt1Cost: 2.5,
        opt1Description: "+2.5 EN for each space the plant grows and fills (up, down, sideways, etc.)",
        BPIncreaseOpt1: 0,
        opt2Cost: 2.5,
        opt2Description: "+2.5 EN, +1 BP to add 5 HP to the plant",
        BPIncreaseOpt2: 1,
        type: "base",
        category: "World Manipulation"
    },
    {
        name: "Empowered Plant",
        description: "2 BP, 4 EN: Target plant in range holds the effects of the power. If the power is an attack power, the plant may use the power once per round at the beginning of the round, for as many rounds as the space(s) the plant occupies (if the plant occupies 3 spaces, it can cast the power 3 times total, once per round). The plant uses your power attack bonus and potency for attacks but has -4 to both. Lasts 1 minute.",
        baseBP: 2,
        baseEnergy: 4,
        opt1Cost: 3,
        opt1Description: "+3 EN, +1 BP per additional minute.",
        BPIncreaseOpt1: 1,
        type: "base",
        category: "World Manipulation"
    },
    {
        name: "Long-Linger On Surface",
        description: "4 EN: Your power is infused onto a surface (as an image, rune, writing, etc.). You may activate the power as a quick reaction or allow it to activate automatically when a trigger condition is met (e.g., a creature touching or occupying the same space as the rune). You pay the EN cost when you use the power, not when you activate the rune. Runes persist until dispelled or activated.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "General"
    },
    {
        name: "Add Weapon",
        description: "You may use a weapon in conjunction with the power, granting its range and properties. You can make the weapon's attack as part of the action to use the power, using the weapon's attack roll ability. For damage, choose between your power attack bonus or martial attack bonus. If the power has a duration longer than one round, the weapon gains the lingering effect, able to reapply the power's effects when hitting a creature. Alternatively, you may choose to have the power linger on the target(s) for the power's duration, allowing them to make a defense roll to end it.",
        baseBP: 1,
        baseEnergy: 0,
        opt1Cost: 0.75,
        opt1Description: "0.75 EN for each BP of the weapon's proficiency cost.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "General"
    },
    {
        name: "Destruction",
        description: "1.5 EN: Damage dealt by the power to objects, walls, ceilings, etc., is doubled.",
        baseBP: 1,
        baseEnergy: 1.5,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN, +1 BP to triple damage dealt to objects, walls, ceilings, etc. instead",
        BPIncreaseOpt1: 1,
        type: "base",
        category: "General"
    },
    {
        name: "Randomize",
        description: "X EN: Roll your choice of an even-sided die (1d2-1d100) when using this power. The result of the power depends on the number rolled, with each number corresponding to its own set of power parts. +1 EN for each positive outcome; -1 EN for each negative outcome, which cannot be resisted if used on an ally. When creating a power using this part, only pay the BP cost for the result with the highest BP cost, not for each option. This power part can reduce EN to 0 or less, but powers must always cost at least 1 EN. You may have more than one of the same outcome represented in the options to increase it's likelihood of being rolled. If this power lingers you may choose to re-roll this effect at the beginning of each affected creatures turn or on your turn.",
        baseBP: 1,
        baseEnergy: -1,
        opt1Cost: 0,
        opt1Description: "-1 EN for each negative outcome, which cannot be resisted if used on an ally.",
        BPIncreaseOpt1: 0,
        opt2Cost: 1,
        opt2Description: "+1 EN for each positive outcome.",
        BPIncreaseOpt2: 0,
        opt3Cost: 0,
        opt3Description: "-0.5 BP Use this to only pay BP for the highest BP part by reducing cost of other parts.",
        BPIncreaseOpt3: -0.5,
        type: "base",
        category: "General"
    },
    {
        name: "Half-Damage on Fail",
        description: "50% EN: When this power misses or is overcome by a creature, you may still determine the damage it would have dealt and deal half of that damage instead.",
        baseBP: 1,
        baseEnergy: 0.5,
        type: "increase",
        category: "General"
    },
    {
        name: "Choose Affected Targets",
        description: "12.5% EN: If the power affects more than one creature, you may choose to exclude some or all of the targets.",
        baseBP: 1,
        baseEnergy: 0.125,
        type: "increase",
        category: "General"
    },
    {
        name: "Activate on Weapon Hit",
        description: "0 BP, 25% EN: When you hit a target with a weapon attack you may choose to spend action points and energy immidiately to use this power as part of that attack, automatically having it take effect on the target without requiring any overcome to do so",
        baseBP: 0,
        baseEnergy: 0.25,
        type: "increase",
        category: "General"
    },
    {
        name: "Use Power Again on Overcome",
        description: "0 BP, 50% EN: When the target of this power overcome's it or dies before the duration of the power ends you may use a quick action or reaction to choose a new target for this power, targeting them as normal. The power must have a duration longer than 1 round. The overcome cannot be the initial overcome when the power was used, it must be a later overcome such as a target rolling a defense against your potency on it's turn.",
        baseBP: 0,
        baseEnergy: 0.5,
        type: "increase",
        category: "Power Mechanics"
      },
      {
        name: "Wish",
        description: "4 BP: Reduce the cost of a power to 90 EN as long as it's total cost is under 200 EN. You gain 2 levels of exhaustion that cannot be recovered in any way other than the base exhaustion rules for each time you use this power (after the first time) each full recovery.",
        baseBP: 4,
        baseEnergy: 0,
        opt1Cost: -1,
        opt1Description: "-1 EN Use this to reduce cost of power to 90 EN.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Power Mechanics"
      },
      {
        name: "Requires Materials",
        description: "-12.5% EN: Power requires materials to perform. You must use materials with a gold value equal to 2 times the energy cost of the power in order to perform.",
        baseBP: 1,
        baseEnergy: -0.125,
        opt1Cost: -0.125,
        opt1Description: "-12.5% EN: For each additional +1 to this multiplier for required gold cost to a maximum decrease total of -75% EN from this part (equating to a total multiplier of 7 times energy cost in gold requirement).",
        BPIncreaseOpt1: 0,
        type: "decrease",
        category: "Power Mechanics"
      },
      {
        name: "No Sightline Required",
        description: "25% EN: Your power can target a point within range without needing sight or perception of that area. Attacks against obscured creatures ignore the obscurity if it was due to low vision alone. Example: Darkness obscures an area lightly giving -1 to your power overcome roll. This would be ignored. If this instead was a wall completely obscuring the target, you couldn't target the creature because it's a physical and visual obscurity.",
        baseBP: 1,
        baseEnergy: 0.25,
        type: "increase",
        category: "Power Mechanics"
      },
      {
        name: "Ends on Effect/Damage Threshold",
        description: "0 BP, -25% EN: The power ends immediately upon dealing damage equal to 3/4 its maximum damage capability (if one round) or 1 1/2 of its maximum damage capability (if it lasts more than one round). Alternatively, the power ends when it has inflicted a condition for 3/4 of its duration without the target overcoming it.",
        baseBP: 0,
        baseEnergy: -0.25,
        type: "decrease",
        category: "Power Mechanics"
      },
      {
        name: "Multiple Overcome(s) Required",
        description: "50% EN (of all parts being overcome): Target must overcome your power's effect(s) one additional time in order to avoid the effect(s). If the power lingers, then the attempts to overcome need not be consecutive. +25% EN for each additional overcome required.",
        baseBP: 1,
        baseEnergy: 0.5,
        opt1Cost: 0.25,
        opt1Description: "+25% EN for each additional overcome required.",
        BPIncreaseOpt1: 0,
        type: "increase",
        category: "Power Mechanics"
      },
      {
        name: "Dispell Immune",
        description: "25% EN: Power cannot be nullified, absorbed, dispelled, or reduced in any other way than deflecting or reflecting or through a power contest.",
        baseBP: 1,
        baseEnergy: 0.25,
        type: "increase",
        category: "Power Mechanics"
      },
      {
        name: "Password",
        description: "4 EN: Set a specified password that, when spoken, either activates a power or causes a creature who spoke the password to either be unaffected or affected by the power. Power must have a duration longer than 1 round.",
        baseBP: 1,
        baseEnergy: 4,
        type: "base",
        category: "Power Mechanics"
      },
      {
        name: "Specified Exceptions",
        description: "1.5 EN: When you use this power, you may specify a creature or objects who are either immune to the power's effects, or are the only creature and/or objects which can be affected by the effect. +1.5 EN for each additional target you can specify.",
        baseBP: 1,
        baseEnergy: 1.5,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN for each additional target you can specify.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Power Mechanics"
      },
      {
        name: "Deadly Contingency",
        description: "-50% EN: You may choose to end the power using a quick action on your turn, but if the power is overcome or ended in any other way, you enter the dying condition with -1 Hit Point.",
        baseBP: 1,
        baseEnergy: -0.5,
        type: "decrease",
        category: "Power Mechanics"
      },
      {
        name: "Choice",
        description: "You may seperate portions of this power and upon using the power choose which of these portions of the power to use. You pay the enrgy cost to use this power equal to the portion that costs the most energy. Example: You have a power that has a range of 6 spaces, causes blindness, and deals your choice of 1d10 fire or 1d8 necrotic damage. The power part's for range and blindness have a total cost together that you add to the more expensive of the two damage options, either damage option you choose the power still has the range and blinding power parts. Increase this power part by the amount of energy each choice that isn't the most expensive would cost.",
        baseBP: 1,
        baseEnergy: 0,
        opt1Cost: -1,
        opt1Description: "-1 EN Use this to reduce cost of power parts to highest within choice.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Power Mechanics"
      },
      {
        name: "Immune to Effect on Overcome",
        description: "0 BP, -25% EN: When a target overcomes any part of this power, that part of the power can no longer target them.",
        baseBP: 0,
        baseEnergy: -0.25,
        type: "decrease",
        category: "Power Mechanics"
      },
      {
        name: "Still Affects on Overcome",
        description: "25% EN: When this power would be overcome as to not affect a target, it can still apply one turn of the effect, but deal no damage (If any). This requires the power to have a duration longer than one round.",
        baseBP: 1,
        baseEnergy: 0.25,
        type: "increase",
        category: "Power Mechanics"
      },
      {
        name: "Decrease Multiple Action Penalty",
        description: "0 BP, 2 EN: Reduce the multiple attack penalty of the affected creature by 1.",
        baseBP: 0,
        baseEnergy: 2,
        opt1Cost: 2,
        opt1Description: "+2 EN: Decrease the penalty by another 1.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Power Mechanics"
      },
      {
        name: "Rite",
        description: "1 BP: You may use a power for free if you spend 10 minutes casting it and it meets these criteria: The total EN cost is no more than ¼ of your maximum EN. It causes no damage or healing. Its function is to locate, identify, summon, or traverse something, communicate, or seek/obtain information. If summoning, the creature summoned is at most 12.5% of your level. You can only have one summon this way.",
        baseBP: 1,
        baseEnergy: 0,
        opt1Cost: -1,
        opt1Description: "-1 EN Use this to reduce cost.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Power Mechanics"
      },
      {
        name: "Long Rite",
        description: "-50% EN: You spend 1 hour to use this power and the total EN cost is no more than ¼ of your maximum EN. It causes no damage or healing. Its function is to locate, identify, summon, or traverse something, communicate, or seek/obtain information. If summoning, the creature summoned is at most 12.5% of your level.",
        baseBP: 1,
        baseEnergy: -0.5,
        type: "decrease",
        category: "Power Mechanics"
      },
      {
        name: "Trigger on Condition",
        description: "25% EN: Make the power activate upon certain conditions (e.g., hitting with an attack, taking damage, falling below 0 HP). Upon activation, it casts as if you were casting it normally. This does not count as a reaction. Triggered powers cannot have the 'long cast' part. A creature can only have 1 trigger power affecting them at a time. This trigger has a duration of 1 hour ending after this time or when it is used.",
        baseBP: 1,
        baseEnergy: 0.25,
        opt1Cost: 0.5,
        opt1Description: "+50% EN to make it 1 day.",
        BPIncreaseOpt1: 0,
        opt2Cost: 1,
        opt2Description: "Double EN to make it 10 days.",
        BPIncreaseOpt2: 0,
        type: "increase",
        category: "Power Mechanics"
      },
      {
        name: "Split Power Parts into Groups",
        description: "Group of Power Parts: You may treat part of a power as a separate power to apply unique stipulations (e.g., only part of a power lingers). Calculate each power individually, then combine the costs for the total EN cost.",
        baseBP: 0,
        baseEnergy: 0,
        type: "base",
        category: "Power Mechanics"
      },
      {
        name: "Reverse Effects",
        description: "0 BP, -X EN: If your power benefits yourself or an ally, you can add a negative effect for you or an ally to reduce the power's cost by an amount equal to 50% the energy cost of the negative part. The negative effect cannot be nullified by you or an ally.",
        baseBP: 0,
        baseEnergy: 0,
        opt1Cost: -1.5,
        opt1Description: "-0.5 EN per 1 EN of reversed part. (Set this increase equal to the energy cost of the reversed part.)",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Power Mechanics"
      },
      {
        name: "Triggered Stipulation",
        description: "0 BP, Part or all of a power affects only specific targets based on creature type, elemental affinity, species, or other traits. Alternatively, the power may only affect creatures under specific conditions (e.g., being grappled, dying, being below maximum hit points, etc). When the condition is met you may attach power parts equal to 1/4th of this power's energy to the power, these parts do not apply to the power at all nor do they increase the energy cost, but when the condition is met those parts take effect as well. (This could be a power that deals 1d8 necrotic damage, but has +1d4 more necrotic damage if the stipulation is met that the target is not a full HP.)",
        baseBP: 0,
        baseEnergy: 0,
        opt1Cost: -1,
        opt1Description: "-1 EN Use this to reduce cost accordingly.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Power Mechanics"
      },
      {
        name: "Stipulation",
        description: "0 BP, -12.5% EN: Part or all of a power affects only specific targets based on creature type, elemental affinity, species, or other traits. Alternatively, the power may only affect creatures under specific conditions (e.g., being grappled, dying, being terminal, etc). As another alternative, this power can only be used under certain conditions such as wheil within darkness.",
        baseBP: 0,
        baseEnergy: -0.125,
        opt1Cost: -0.0625,
        opt1Description: "-6.25%% EN to add another acceptable stipulation in addition to the first (an additional creature type, or condition needed.) I.e. Undead or Constructs, grappled or immobile, etc.",
        opt2Cost: -0.03125,
        opt2Description: "-3.125%% EN for each additional acceptable stipulation in addition to the first two (an additional creature type, or condition needed.) I.e. Undead or Constructs, grappled or immobile, etc.",
        BPIncreaseOpt2: 0,
        type: "decrease",
        category: "Power Mechanics"
    },
    {
        name: "Specialized",
        description: "0 BP, 12.5% EN: Part or all of the power causes either +1 on attack rolls or -1 on to Defense rolls based on criteria like creature type or species (choose one).",
        baseBP: 0,
        baseEnergy: 0.125,
        opt1Cost: 0.125,
        opt1Description: "+12.5% EN for each additional +1 or -1.",
        BPIncreaseOpt1: 0,
        type: "increase",
        category: "Power Mechanics"
    },
    {
        name: "Not Activated until Target Moves",
        description: "-25% EN: Power's effects do not activate unless the target moves. If they remain still until the power's duration ends, the power has no effect. Only reduce the cost based on parts that deal damage or effects, not additional parts.",
        baseBP: 1,
        baseEnergy: -0.25,
        type: "decrease",
        category: "Power Mechanics"
    },
    {
        name: "One Round Adaptation",
        description: "0 BP, -25% EN: If the power meets these criteria, its cost is reduced by ¼: Lasts only 1 round. Only applies adaptation effects (other than heal or power point regain). Is not over 10 EN in cost (before reductions from feats).",
        baseBP: 0,
        baseEnergy: -0.25,
        type: "decrease",
        category: "Power Mechanics"
    },
    {
        name: "Targets Additional Defense",
        description: "0 BP, -25% EN: Target may roll your choice of defense against your potency. On success, they are unaffected. If the target is an ally it must make this roll against your default potency (ie your potency without any bonuses or penalties).",
        baseBP: 0,
        baseEnergy: -0.25,
        type: "decrease",
        category: "Power Mechanics"
    },
    {
        name: "Proximity Requirement",
        description: "0 BP, -12.5% EN: You must remain within a certain range of the target of this power. If either target is ever beyond this range the power ends. The range is equal to one half of the range of this power. Must be added to power that targets another creature and has a duration longer than 1 round.",
        baseBP: 0,
        baseEnergy: -0.125,
        type: "decrease",
        category: "Power Mechanics"
    },
    {
        name: "Murged Potency",
        description: "0 BP, -12.5% EN: If power targets multiple defenses with lingering effects, you may combine those into one targeted defense that makes sense, causing both effects to end together once overcome. (Such as a wrap of necrotic cords targeting fortitude and might, combining these to just might for overcoming the entire lingering effect, or a charm power that also deals psychic damage targeting resolve alone instead of mental fortitude and resolve).",
        baseBP: 0,
        baseEnergy: -0.125,
        type: "decrease",
        category: "Power Mechanics"
    },
    {
        name: "Alternate Targeted Defense",
        description: "0 BP, 25% EN: Choose a defense your power targets and change it to target an alternative defense instead. This defense must make sense for how the power works and function in a way that makes sense such as a tsunami power targeting might instead of reflex as an area of effect blunt damage power.",
        baseBP: 0,
        baseEnergy: 0.25,
        type: "increase",
        category: "Power Mechanics"
    },
    {
        name: "Different Effects Each Round",
        description: "0 BP, X EN: Separate this power into different parts that each take effect on a set round of the power's duration. Only pay the lingering cost and power energy cost of the most expensive round effect/part of this power. When creating a power using this part, only pay the BP cost for the round with the highest BP cost, not for each option.",
        baseBP: 0,
        baseEnergy: 0,
        opt1Cost: -0.25,
        opt1Description: "-0.25 EN Use to adjust EN cost accordingly.",
        BPIncreaseOpt1: 0,
        opt1Cost: 0,
        opt1Description: "-0.5 BP Use to adjust BP cost accordingly.",
        BPIncreaseOpt1: -0.5,
        type: "base",
        category: "Power Mechanics"
    },
    {
        name: "Delayed Effect",
        description: "0 BP, 25% EN: When you use this power its effect doesn't immediately go off and it doesn't require you to overcome any defenses. You may use a free reaction at any time to cause the power to activate. For each round the power doesn't activate you may add an additional effect to the power, or increase an existing effect on the power, equal to 1/8 of this power's energy. This power and its effects cannot have a duration longer than 1 minute. When the power ends if it has not been activated it automatically activates then ends.",
        baseBP: 0,
        baseEnergy: 0.25,
        type: "increase",
        category: "Power Mechanics"
    },
    {
        name: "Swim",
        description: "1.5 EN: Target can swim at a speed equal to half of it's movement.",
        baseBP: 1,
        baseEnergy: 1.5,
        opt1Cost: 1.5,
        opt1Description: "+1.5 EN to make this full movement instead.",
        BPIncreaseOpt1: 0,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Polymorph",
        description: "2 BP, 20 EN: Target creature transforms into an animal or beast. You may choose any Beast with a level equal to or less than the target’s. The target’s game statistics are replaced by those of the Beast form, though it retains its alignment, personality, creature type, Hit Points, and Energy. It overheals equal to the Beast form’s Hit Points. The transformation ends early if the target loses all overhealed hit points. In its new form, the target is limited to actions allowed by its anatomy, unable to speak or  use powers. The target’s gear merges into the new form, and it cannot access or benefit from this equipment during the transformation.",
        baseBP: 2,
        baseEnergy: 20,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Shape-shift",
        description: "3 BP, 34 EN: Target or object shape-shifts into another creature or object for the duration or until you take a basic action to shape-shift it into a different eligible form. The new form must be of a creature with a level no higher than your level. You must have seen this type of creature before. When it shape-shifts, it overheals an amount equal to the Hit Points of the form. The Power ends early if you your health drops to or below it's normal maximum. Your game statistics are replaced by the stat block of the chosen form, but you retain your creature type, alignment, personality, Intelligence, Acuity, and Charisma abilities and their related defenses, Hit Points, Hit Point Dice, proficiencies, and ability to communicate. When you shape-shift, you decide whether your equipment drops to the ground or changes size and shape to fit your new form while you remain in it.",
        baseBP: 3,
        baseEnergy: 34,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Material Shape",
        description: "14 EN: You touch a specified material made object of Medium size or smaller, or a section of the material no larger than 5 feet in any dimension, and mold it into a shape of your choice. For instance, you might transform a large piece into a weapon, statue, or coffer, or carve a small passage through a 5-foot-thick wall. You could also alter that type of material door or its frame to seal it shut. The shaped object may include up to two hinges and a latch, but intricate mechanical details cannot be created. You must specify the material when you make this power.",
        baseBP: 1,
        baseEnergy: 14,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Timeless",
        description: "15 EN: Target cannot be effected by the affects of aging. This power part has a default duration of 30 days.",
        baseBP: 1,
        baseEnergy: 15,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Sustain Body",
        description: "15 EN: Target does not require food or water to live. This power part's default duration is 1 day, afterwhich time the target returns to whatever hunger/thirst state it was when this power was used.",
        baseBP: 1,
        baseEnergy: 15,
        type: "base",
        category: "Adaptation"
    },
    {
        name: "Transfered Effect",
        description: "-25% EN: This power's effects do not activate until after an amount of time equal to a fourth of this power's duration (minimum 1 round). If at any point a target effected by the power deals melee damage to another creature before the power activates, the power transfers to that new creature and the one fourth timer restarts. If the power has a duration longer than 1 round, the power can transfer to a new target each round. When the duration of the power is met, the power activates.",
        baseBP: 1,
        baseEnergy: -0.25,
        type: "decrease",
        category: "Power Mechanics"
    },
    {
        name: "Target's Possession",
        description: "-25% EN: This power has this energy reduction only if a significant possession of the target is used by the power. This could be part of a creature's body, a weapon, a piece of armor, etc. but it must be significant to the target.",
        baseBP: 1,
        baseEnergy: -0.25,
        type: "decrease",
        category: "Power Mechanics"
    },
];

export default powerPartsData;