export const rangeCostPerUnit = 0.5; // EN per internal range unit

export const areaEffectDescriptions = {
    none: "Area of Effect is one target or one space.",
    sphere: "+25% EN: Add a sphere of effect with a 1-space radius centered on yourself or a point within range that you can see. The power affects all targets within this area. +25% EN: Increase the radius by +1. Roll one attack against all targets' relevant defense.",
    cylinder: "+25% EN: Add a cylinder of effect with a 1-space radius and a 2 space height centered on yourself or a point within range that you can see. The power affects all targets within this area. +25% EN: Increase the radius by +1 or to increase the height by 4. Roll one attack against all targets' relevant defense.",
    cone: "+12.5% EN: Create a 45-degree angle cone that goes directly out from yourself for 2 spaces. +12.5% EN: Increase this effect by +1 space. Roll one attack against all targets' relevant defense.",
    line: "+25% EN: Each creature occupying a space directly between you and the power's target is affected by this power. Roll attack and damage once and apply it to all creatures affected.",
    space: "+25% EN: Each space directly between you and this power's target is affected for the power's duration. A creature that begins its turn in one of these spaces must roll the relevant defense against your potency or become affected.",
    additionalTarget: "+12.5% EN: When you affect a target with this power, you may choose a new target within half of the power's range and make an attack roll against that target. +12.5% EN: Increase the number of creatures this power can jump to by 1 (base is 1 jump).",
    expanding: "+50% EN: At the end of your turn after the round in which power was used its area of effect increases 1 space in all directions.",
    targetOnly: "-25% EN: When you first use this power and at the beginning of the turn the power was used you can choose one creature within its area of effect to target with the power. The power can only target and affect creatures in this way. You don't need to see a target to make it the target of the power."
};

export const areaEffectCosts = {
    none: 0,
    sphere: 0.25,
    cylinder: 0.25,
    cone: 0.125,
    line: 0.25,
    space: 0.25,
    additionalTarget: 0.125,
    expanding: 0.5,
    targetOnly: -0.25
};

export const actionTypeDescriptions = {
    basic: "Basic Action",
    free: "+50% EN: This power uses a free action to activate instead of a basic action.",
    quick: "+25% EN: This power uses a quick action to activate instead of a basic action.",
    long3: "-12.5% EN: This power takes 1 more AP to perform (cannot be added to a quick or free action power).",
    long4: "-12.5% EN: For each additional 1 AP required. This type of power can only be used with this reduced cost if used inside combat and does not linger longer than 1 minute (10 rounds).",
    reaction: "+25% EN: This power uses a basic reaction instead of a basic action."
};

export const actionTypeCosts = {
    basic: 0,
    free: 0.5,
    quick: 0.25,
    long3: -0.125,
    long4: -0.25
};

export const durationMultipliers = {
    rounds: 0.125,
    minutes: 0.75,
    hours: 2.5,
    days: 8,
    permanent: 25
};

// New: sustain and linger tunables
export const sustainBaseReduction = 0.25;    // base reduction applied when sustain >= 1
export const sustainStepReduction = 0.125;   // additional reduction per extra sustain beyond 1
export const reactionCost = 0.25;            // cost multiplier applied when reaction is checked

// Linger tuning placeholder (kept for future balancing). Currently logic uses part-level linger flags.
export const lingerPlaceholder = 1.0;
