export function calculateDefenses(abilities, defenseVals) {
    return {
        might: 10 + abilities.strength + (defenseVals?.might || 0),
        fortitude: 10 + abilities.vitality + (defenseVals?.fortitude || 0),
        reflex: 10 + abilities.agility + (defenseVals?.reflex || 0),
        discernment: 10 + abilities.acuity + (defenseVals?.discernment || 0),
        mentalFortitude: 10 + abilities.intelligence + (defenseVals?.mentalFortitude || 0),
        resolve: 10 + abilities.charisma + (defenseVals?.resolve || 0)
    };
}

export function calculateHealthEnergy(points, abilities) {
    // Base health/energy from abilities, distributed from pool
    const baseHealth = abilities.vitality || 0;
    const baseEnergy = Math.max(
        abilities.strength, abilities.agility, abilities.acuity,
        abilities.intelligence, abilities.charisma
    ) || 0;
    
    return {
        health: baseHealth + (points?.health || 0),
        energy: baseEnergy + (points?.energy || 0),
        maxHealth: baseHealth + (points?.health || 0),
        maxEnergy: baseEnergy + (points?.energy || 0)
    };
}

export function calculateBonuses(martialProf, powerProf, abilities) {
    return {
        strength: {
            prof: abilities.strength + martialProf,
            unprof: abilities.strength
        },
        agility: {
            prof: abilities.agility + martialProf,
            unprof: abilities.agility
        },
        acuity: {
            prof: abilities.acuity + martialProf,
            unprof: abilities.acuity
        },
        power: {
            prof: abilities.charisma + powerProf,
            unprof: abilities.charisma
        }
    };
}
