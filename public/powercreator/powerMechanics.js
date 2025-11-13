export const rangeCostPerUnit = 0.5; // EN per internal range unit

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

// Linger tuning placeholder (kept for future balancing). Currently logic uses part-level linger flags.
export const lingerPlaceholder = 1.0;
