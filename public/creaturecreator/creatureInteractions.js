import { resistances, weaknesses, immunities, senses, movement, feats, powersTechniques, armaments, creatureSkills, creatureSkillValues, creatureLanguages, conditionImmunities, defenseSkillState } from './creatureState.js';
import { updateList, capitalize, formatDamage, formatTechniqueAction, formatTechniqueDamage, formatTechniqueParts, SENSES_DESCRIPTIONS, SENSES_DISPLAY, MOVEMENT_DESCRIPTIONS, MOVEMENT_DISPLAY, getAbilityValue, getSkillBonus, getBaseDefenseValue, getSkillPointsRemaining, getRemainingFeatPoints, getCreatureCurrency, getArmamentsTotalCurrency, getAbilityPointCost, getAbilityPointTotal, getLevelValue, getVitalityValue, getBaseHitPoints, getBaseEnergy, getHitEnergyTotal, getCreatureTypeToggle, getInnatePowers, getInnateEnergy, getProficiency, getHighestNonVitalityAbility, getBaseFeatPoints, getSpentFeatPoints, getSkillPointTotal, getSkillPointsSpent } from './creatureUtils.js';
import creatureFeatsData from './creatureFeatsData.js';

let skills = []; // Will be set in initCreatureCreator

// Update functions for lists
export function updateResistancesList() {
    resistances.sort();
    updateList("resistancesList", resistances, idx => {
        resistances.splice(idx, 1);
        updateResistancesList();
        updateSummary();
    });
}

export function updateWeaknessesList() {
    weaknesses.sort();
    updateList("weaknessesList", weaknesses, idx => {
        weaknesses.splice(idx, 1);
        updateWeaknessesList();
        updateSummary();
    });
}

export function updateImmunitiesList() {
    immunities.sort();
    updateList("immunitiesList", immunities, idx => {
        immunities.splice(idx, 1);
        updateImmunitiesList();
        updateSummary();
    });
}

export function updateSensesList() {
    senses.sort();
    updateList("sensesList", senses, idx => {
        senses.splice(idx, 1);
        updateSensesList();
        updateSummary();
    }, SENSES_DESCRIPTIONS, SENSES_DISPLAY);
}

export function updateMovementList() {
    const ul = document.getElementById("movementList");
    ul.innerHTML = "";
    const sorted = movement.slice().sort((a, b) => a.type.localeCompare(b.type));
    sorted.forEach((move, idx) => {
        const li = document.createElement("li");
        li.textContent = MOVEMENT_DISPLAY[move.type] || move.type;
        if (MOVEMENT_DESCRIPTIONS[move.type]) {
            li.title = MOVEMENT_DESCRIPTIONS[move.type];
        }
        const btn = document.createElement("button");
        btn.textContent = "✕";
        btn.className = "small-button red-button";
        btn.onclick = () => {
            movement.splice(idx, 1);
            updateMovementList();
            updateSummary();
        };
        li.appendChild(btn);
        ul.appendChild(li);
    });
}

export function updateConditionImmunityList() {
    conditionImmunities.sort();
    updateList("conditionImmunityList", conditionImmunities, idx => {
        conditionImmunities.splice(idx, 1);
        updateConditionImmunityList();
        updateSummary();
    });
}

export function updateLanguagesList() {
    const ul = document.getElementById("languagesList");
    ul.innerHTML = "";
    creatureLanguages.slice().sort((a, b) => a.localeCompare(b)).forEach((lang, idx) => {
        const li = document.createElement("li");
        li.textContent = lang;
        const btn = document.createElement("button");
        btn.textContent = "✕";
        btn.className = "small-button red-button";
        btn.style.marginLeft = "6px";
        btn.onclick = () => {
            creatureLanguages.splice(idx, 1);
            updateLanguagesList();
            updateSummary();
        };
        li.appendChild(btn);
        ul.appendChild(li);
    });
}

export function updateSkillsList() {
    const ul = document.getElementById("skillsList");
    ul.innerHTML = "";
    creatureSkills.slice().sort().forEach((skill, idx) => {
        const li = document.createElement("li");
        li.textContent = skill + formatSkillBonusDisplay(skill);
        const skillValue = typeof creatureSkillValues[skill] === "number" ? creatureSkillValues[skill] : 0;
        const minusBtn = document.createElement("button");
        minusBtn.textContent = "-";
        minusBtn.className = "small-button";
        minusBtn.style.marginLeft = "8px";
        minusBtn.onclick = () => {
            if (creatureSkillValues[skill] > 0) {
                creatureSkillValues[skill]--;
                updateSkillsList();
                updateDefensesUI();
                updateSummary();
            }
        };
        minusBtn.disabled = skillValue <= 0;
        const valueSpan = document.createElement("span");
        valueSpan.textContent = ` ${skillValue} `;
        valueSpan.style.fontWeight = "bold";
        valueSpan.style.margin = "0 2px";
        const plusBtn = document.createElement("button");
        plusBtn.textContent = "+";
        plusBtn.className = "small-button";
        plusBtn.onclick = () => {
            if (creatureSkillValues[skill] < 3 && getSkillPointsRemaining() > 0) {
                creatureSkillValues[skill]++;
                updateSkillsList();
                updateDefensesUI();
                updateSummary();
            }
        };
        plusBtn.disabled = skillValue >= 3 || getSkillPointsRemaining() <= 0;
        const skillObj = skills.find(s => s.name === skill);
        if (skillObj && skillObj.description) {
            li.title = skillObj.description;
        }
        li.appendChild(minusBtn);
        li.appendChild(valueSpan);
        li.appendChild(plusBtn);
        const btn = document.createElement("button");
        btn.textContent = "✕";
        btn.className = "small-button red-button";
        btn.onclick = () => {
            creatureSkills.splice(idx, 1);
            delete creatureSkillValues[skill];
            updateSkillsList();
            updateSkillsDropdownOptions();
            updateDefensesUI();
            updateSummary();
        };
        li.appendChild(btn);
        ul.appendChild(li);
    });
    let skillPointsDisplay = document.getElementById("skillPointsBoxDisplay");
    if (!skillPointsDisplay) {
        skillPointsDisplay = document.createElement("div");
        skillPointsDisplay.id = "skillPointsBoxDisplay";
        skillPointsDisplay.style.marginTop = "8px";
        skillPointsDisplay.style.fontWeight = "bold";
        ul.parentElement.appendChild(skillPointsDisplay);
    }
    const points = getSkillPointsRemaining();
    skillPointsDisplay.textContent = `Skill Points Remaining: ${points}`;
    skillPointsDisplay.style.color = points < 0 ? "red" : "";
}

export function updateSkillsDropdownOptions() {
    const skillsDropdown = document.getElementById("skillsDropdown");
    while (skillsDropdown.options.length > 1) skillsDropdown.remove(1);
    skills
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(skill => {
            if (skill.subSkill) {
                if (!skill.baseSkill || !creatureSkills.includes(skill.baseSkill)) return;
            }
            if (creatureSkills.includes(skill.name)) return;
            const opt = document.createElement("option");
            opt.value = skill.name;
            opt.textContent = skill.name;
            if (skill.description) opt.title = skill.description;
            skillsDropdown.appendChild(opt);
        });
}

export function formatSkillBonusDisplay(skillName) {
    const skillObj = skills.find(s => s.name === skillName);
    if (!skillObj) return "";
    const bonus = getSkillBonus(skillObj);
    const sign = bonus >= 0 ? "+" : "";
    return ` (${sign}${bonus})`;
}

export function updateDefensesUI() {
    const defenses = [
        "Might",
        "Fortitude",
        "Reflex",
        "Discernment",
        "Mental Fortitude",
        "Resolve"
    ];
    defenses.forEach(def => {
        const el = document.getElementById('defense' + def.replace(/\s/g, ''));
        if (el) {
            const base = getBaseDefenseValue(def);
            const bonus = defenseSkillState[def] || 0;
            el.textContent = base + bonus;
        }
        const minusBtn = document.querySelector(`.defense-minus[data-defense="${def}"]`);
        const plusBtn = document.querySelector(`.defense-plus[data-defense="${def}"]`);
        if (minusBtn) minusBtn.disabled = (defenseSkillState[def] <= 0);
        if (plusBtn) plusBtn.disabled = (getSkillPointsRemaining() < 2);
    });
    const skillPointsElem = document.getElementById('summarySkillPoints');
    if (skillPointsElem) {
        skillPointsElem.textContent = getSkillPointsRemaining();
        skillPointsElem.style.color = getSkillPointsRemaining() < 0 ? "red" : "";
    }
}

export function updateCreatureAbilityDropdowns() {
    const abilityDropdowns = document.querySelectorAll('.creature-ability-dropdown');
    let total = 0;
    abilityDropdowns.forEach(dropdown => {
        const value = parseInt(dropdown.value);
        if (!isNaN(value)) {
            const cost = getAbilityPointCost(value);
            total += cost;
        }
    });
    let level = 1;
    const levelInput = document.getElementById('creatureLevel');
    if (levelInput) {
        level = parseInt(levelInput.value) || 1;
    }
    const maxPoints = getAbilityPointTotal(level);
    const counter = document.getElementById('remaining-points');
    if (counter) {
        counter.textContent = maxPoints - total;
        counter.style.color = (maxPoints - total) <= 0 ? "red" : "#007bff";
    }
    abilityDropdowns.forEach(dropdown => {
        const options = dropdown.querySelectorAll('option');
        options.forEach(option => {
            option.disabled = false;
        });
    });
}

export function updateHealthEnergyUI() {
    const level = getLevelValue();
    const vitality = getVitalityValue();
    const baseHP = getBaseHitPoints();
    const baseEN = getBaseEnergy();
    const totalPoints = getHitEnergyTotal(level);
    const hpInput = document.getElementById('hitPointsInput');
    const enInput = document.getElementById('energyInput');
    let hp = parseInt(hpInput.value);
    let en = parseInt(enInput.value);
    if (isNaN(hp) || hp < baseHP) hp = baseHP;
    if (isNaN(en) || en < baseEN) en = baseEN;
    let allocatedHP = hp - baseHP;
    let allocatedEN = en - baseEN;
    if (allocatedHP < 0) allocatedHP = 0;
    if (allocatedEN < 0) allocatedEN = 0;
    let spent = allocatedHP + allocatedEN;
    let remaining = totalPoints - spent;
    if (remaining < 0) {
        if (hpInput === document.activeElement) {
            allocatedHP = Math.max(0, allocatedHP + remaining);
            hp = baseHP + allocatedHP;
        } else if (enInput === document.activeElement) {
            allocatedEN = Math.max(0, allocatedEN + remaining);
            en = baseEN + allocatedEN;
        } else {
            allocatedEN = Math.max(0, totalPoints - allocatedHP);
            en = baseEN + allocatedEN;
        }
        spent = allocatedHP + allocatedEN;
        remaining = totalPoints - spent;
    }
    document.getElementById('hitEnergyTotal').textContent = remaining;
    hpInput.value = hp;
    enInput.value = en;
    document.getElementById('decreaseHitPoints').disabled = hp <= baseHP;
    document.getElementById('decreaseEnergy').disabled = en <= baseEN;
    document.getElementById('increaseHitPoints').disabled = remaining <= 0;
    document.getElementById('increaseEnergy').disabled = remaining <= 0;
}

export function updateInnateInfo() {
    const isPower = getCreatureTypeToggle();
    const level = document.getElementById("creatureLevel").value || 1;
    const innatePowers = getInnatePowers(level, isPower);
    const innateEnergy = getInnateEnergy(innatePowers, isPower);
    document.getElementById("innatePowers").textContent = innatePowers;
    document.getElementById("innateEnergy").textContent = innateEnergy;
    document.getElementById("summaryInnatePowers").textContent = innatePowers;
    document.getElementById("summaryInnateEnergy").textContent = innateEnergy;
}

export function updateCreatureDetailsBox() {
    const level = document.getElementById("creatureLevel")?.value || 1;
    const baseFeat = getBaseFeatPoints(level);
    const spentFeat = getSpentFeatPoints();
    const detailsFeat = document.getElementById("detailsFeatPoints");
    if (detailsFeat) {
        detailsFeat.textContent = `${(baseFeat - spentFeat).toFixed(1).replace(/\.0$/, "")} / ${baseFeat}`;
        detailsFeat.style.color = (baseFeat - spentFeat) < 0 ? "red" : "";
    }
    const bpTotal = (() => {
        const highestNonVit = getHighestNonVitalityAbility();
        if (level <= 1) return 9 + highestNonVit;
        return 9 + highestNonVit + (level - 1) * (1 + highestNonVit);
    })();
    const bpSpent = (() => {
        let spent = 0;
        spent += powersTechniques.reduce((sum, item) => {
            if (item.type === "power") return sum + (parseFloat(item.totalBP) || 0);
            if (item.type === "technique") return sum + (parseFloat(item.totalBP) || parseFloat(item.bp) || 0);
            return sum;
        }, 0);
        spent += armaments.reduce((sum, item) => sum + (parseFloat(item.totalBP) || parseFloat(item.bp) || 0), 0);
        return spent;
    })();
    const detailsBP = document.getElementById("detailsBP");
    if (detailsBP) {
        detailsBP.textContent = `${bpTotal - bpSpent} / ${bpTotal}`;
        detailsBP.style.color = (bpTotal - bpSpent) < 0 ? "red" : "";
    }
    const skillTotal = getSkillPointTotal();
    const skillSpent = getSkillPointsSpent();
    const detailsSkill = document.getElementById("detailsSkillPoints");
    if (detailsSkill) {
        detailsSkill.textContent = `${skillTotal - skillSpent} / ${skillTotal}`;
        detailsSkill.style.color = (skillTotal - skillSpent) < 0 ? "red" : "";
    }
    const baseCurrency = getCreatureCurrency(level);
    const spentCurrency = getArmamentsTotalCurrency();
    const detailsCurrency = document.getElementById("detailsCurrency");
    if (detailsCurrency) {
        detailsCurrency.textContent = `${baseCurrency - spentCurrency} / ${baseCurrency}`;
        detailsCurrency.style.color = (baseCurrency - spentCurrency) < 0 ? "red" : "";
    }
}

export function updateSummary() {
    document.getElementById("summaryName").textContent = document.getElementById("creatureName").value || "-";
    document.getElementById("summaryLevel").textContent = document.getElementById("creatureLevel").value || "-";
    document.getElementById("summaryType").textContent = document.getElementById("creatureType").value || "-";
    document.getElementById("summaryResistances").textContent = resistances.slice().sort().join(", ") || "None";
    const allImmunities = [...immunities, ...conditionImmunities].map(x => String(x)).filter(Boolean);
    allImmunities.sort((a, b) => a.localeCompare(b));
    document.getElementById("summaryImmunities").textContent = allImmunities.length ? allImmunities.join(", ") : "None";
    document.getElementById("summarySenses").textContent = senses
        .slice()
        .sort()
        .map(s => SENSES_DISPLAY[s] || s)
        .join(", ") || "None";
    const others = movement.slice().sort((a, b) => a.type.localeCompare(b.type));
    let movementSummary = others.map(m => MOVEMENT_DISPLAY[m.type] || m.type);
    document.getElementById("summaryMovement").textContent = movementSummary.length ? movementSummary.join(", ") : "None";
    const remaining = getRemainingFeatPoints();
    const featPointsElem = document.getElementById("summaryFeatPoints");
    if (featPointsElem) {
        featPointsElem.textContent = remaining.toFixed(1).replace(/\.0$/, "");
        featPointsElem.style.color = remaining < 0 ? "red" : "";
    }
    const summarySkillsElem = document.getElementById("summarySkills");
    if (summarySkillsElem) {
        const skillSummaries = creatureSkills
            .slice()
            .sort((a, b) => a.localeCompare(b))
            .map(skillName => {
                const skillObj = skills.find(s => s.name === skillName);
                if (!skillObj) return "";
                const bonus = getSkillBonus(skillObj);
                const sign = bonus >= 0 ? "+" : "";
                return `${skillName} ${sign}${bonus}`;
            })
            .filter(Boolean);
        summarySkillsElem.textContent = skillSummaries.length ? skillSummaries.join(", ") : "None";
    }
    const summaryLanguagesElem = document.getElementById("summaryLanguages");
    if (summaryLanguagesElem) {
        const langs = creatureLanguages.slice().sort((a, b) => a.localeCompare(b));
        summaryLanguagesElem.textContent = langs.length ? langs.join(", ") : "None";
    }
    let level = document.getElementById("creatureLevel").value || 1;
    let bpTotal = (() => {
        const highestNonVit = getHighestNonVitalityAbility();
        if (level <= 1) return 9 + highestNonVit;
        return 9 + highestNonVit + (level - 1) * (1 + highestNonVit);
    })();
    let bpSpent = powersTechniques.reduce((sum, item) => {
        if (item.type === "power") return sum + (parseFloat(item.totalBP) || 0);
        if (item.type === "technique") return sum + (parseFloat(item.totalBP) || parseFloat(item.bp) || 0);
        return sum;
    }, 0) + armaments.reduce((sum, item) => sum + (parseFloat(item.totalBP) || parseFloat(item.bp) || 0), 0);
    let summaryBP = document.getElementById("summaryBP");
    if (summaryBP) summaryBP.textContent = `${bpTotal - bpSpent} / ${bpTotal}`;
    const isPower = getCreatureTypeToggle();
    const innatePowers = getInnatePowers(level, isPower);
    const innateEnergy = getInnateEnergy(innatePowers, isPower);
    let summaryInnatePowers = document.getElementById("summaryInnatePowers");
    let summaryInnateEnergy = document.getElementById("summaryInnateEnergy");
    if (summaryInnatePowers) summaryInnatePowers.textContent = innatePowers;
    if (summaryInnateEnergy) summaryInnateEnergy.textContent = innateEnergy;
    const profLabelElem = document.getElementById("summaryProfLabel");
    const profValueElem = document.getElementById("summaryProfValue");
    const typeDropdown = document.getElementById("creatureTypeDropdown");
    if (profLabelElem && profValueElem && typeDropdown) {
        if (typeDropdown.value === "Power") {
            profLabelElem.textContent = "Power Proficiency: ";
            profValueElem.textContent = getProficiency(level);
        } else if (typeDropdown.value === "Martial") {
            profLabelElem.textContent = "Martial Proficiency: ";
            profValueElem.textContent = getProficiency(level);
        } else {
            profLabelElem.textContent = "";
            profValueElem.textContent = "";
        }
    }
    // ...existing code for armament attacks, techniques, powers summaries...
    updateCreatureDetailsBox();
}

export function renderFeats() {
    const container = document.getElementById("featsContainer");
    container.innerHTML = "";
    feats.forEach((feat, idx) => {
        const row = document.createElement("div");
        row.className = "feat-row";
        const select = document.createElement("select");
        select.style.minWidth = "220px";
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select Feat";
        select.appendChild(defaultOption);
        creatureFeatsData.forEach(f => {
            const opt = document.createElement("option");
            opt.value = f.name;
            opt.textContent = `${f.name} (${f.cost})`;
            if (feat.name === f.name) opt.selected = true;
            select.appendChild(opt);
        });
        select.onchange = e => {
            const selected = creatureFeatsData.find(f => f.name === e.target.value);
            if (selected) {
                feat.name = selected.name;
                feat.points = selected.cost;
            } else {
                feat.name = "";
                feat.points = 1;
            }
            renderFeats();
            updateSummary();
        };
        row.appendChild(select);
        if (feat.name) {
            const selected = creatureFeatsData.find(f => f.name === feat.name);
            if (selected) {
                const info = document.createElement("span");
                info.style.marginLeft = "10px";
                info.innerHTML = `<strong>${selected.name}</strong> (Feat Points: ${selected.cost})<br><span style="font-style:italic;font-size:13px;">${selected.description}</span>`;
                row.appendChild(info);
            }
        }
        const removeBtn = document.createElement("button");
        removeBtn.className = "small-button red-button";
        removeBtn.textContent = "✕";
        removeBtn.onclick = () => { feats.splice(idx, 1); renderFeats(); updateSummary(); };
        row.appendChild(removeBtn);
        container.appendChild(row);
    });
}

export function renderPowersTechniques() {
    const container = document.getElementById("powersTechniquesContainer");
    container.innerHTML = "";
    powersTechniques.forEach((item, idx) => {
        const isPower = item.type === "power";
        const isTechnique = item.type === "technique";
        const div = document.createElement("div");
        div.className = "power-technique-item";
        if (isPower) {
            const detailsId = `power-details-${idx}`;
            div.innerHTML = `
                <div class="power-header">
                    <span class="toggle-details" data-details-id="${detailsId}" style="cursor:pointer;">[+]</span>
                    <span>${item.name} (BP: ${item.totalBP || item.bp || 0})</span>
                    <button class="small-button red-button remove-btn">✕</button>
                </div>
                <div id="${detailsId}" class="power-details" style="display: none;">
                    <table class="power-table">
                        <tr><th>Energy</th><td>${item.totalEnergy || item.energy || '-'}</td></tr>
                        <tr><th>Action</th><td>${item.action || '-'}</td></tr>
                        <tr><th>Duration</th><td>${item.duration ? `${item.duration} ${item.durationType || ''}` : '-'}</td></tr>
                        <tr><th>Range</th><td>${item.range || '-'}</td></tr>
                        <tr><th>Area of Effect</th><td>${item.areaOfEffect || item.areaEffect || '-'}</td></tr>
                        <tr><th>Focus</th><td>${item.focus ? 'Yes' : (item.focusChecked ? 'Yes' : 'No')}</td></tr>
                        <tr><th>Sustain</th><td>${item.sustainValue > 0 ? item.sustainValue : 'None'}</td></tr>
                        <tr><th>Damage</th><td>${formatDamage(item.damage)}</td></tr>
                        <tr><th>Building Points</th><td>${item.totalBP || item.bp || '-'}</td></tr>
                        <tr><th>Power Parts</th><td>${item.powerParts ? (Array.isArray(item.powerParts) ? item.powerParts.map(p => p.part || p).join(', ') : '-') : '-'}</td></tr>
                        <tr><th>Description</th><td>${item.description || '-'}</td></tr>
                    </table>
                </div>
            `;
        } else if (isTechnique) {
            const detailsId = `technique-details-${idx}`;
            div.innerHTML = `
                <div class="power-header">
                    <span class="toggle-details" data-details-id="${detailsId}" style="cursor:pointer;">[+]</span>
                    <span>${item.name} (BP: ${item.totalBP || item.bp || 0})</span>
                    <button class="small-button red-button remove-btn">✕</button>
                </div>
                <div id="${detailsId}" class="power-details" style="display: none;">
                    <table class="power-table">
                        <tr><th>Energy</th><td>${item.totalEnergy !== undefined ? item.totalEnergy : (item.energy !== undefined ? item.energy : '-')}</td></tr>
                        <tr><th>Action</th><td>${formatTechniqueAction(item)}</td></tr>
                        <tr><th>Weapon</th><td>${item.weapon && item.weapon.name ? item.weapon.name : "Unarmed Prowess"}</td></tr>
                        <tr><th>Damage</th><td>${formatTechniqueDamage(item.damage)}</td></tr>
                        <tr><th>Building Points</th><td>${item.totalBP !== undefined ? item.totalBP : (item.bp !== undefined ? item.bp : '-')}</td></tr>
                        <tr><th>Technique Parts</th><td>${formatTechniqueParts(item.techniqueParts)}</td></tr>
                        <tr><th>Description</th><td>${item.description || '-'}</td></tr>
                    </table>
                </div>
            `;
        }
        div.querySelector('.remove-btn').onclick = () => {
            powersTechniques.splice(idx, 1);
            renderPowersTechniques();
            updateSummary();
        };
        if (div.querySelector('.toggle-details')) {
            div.querySelector('.toggle-details').onclick = () => {
                const details = document.getElementById(isPower ? `power-details-${idx}` : `technique-details-${idx}`);
                const toggle = div.querySelector('.toggle-details');
                if (details.style.display === 'none') {
                    details.style.display = 'block';
                    toggle.textContent = '[-]';
                } else {
                    details.style.display = 'none';
                    toggle.textContent = '[+]';
                }
            };
        }
        container.appendChild(div);
    });
    updateSummary();
}

export function renderArmaments() {
    const container = document.getElementById("armamentsContainer");
    container.innerHTML = "";
    if (!armaments.length) return;
    const table = document.createElement('table');
    table.className = 'powers-table';
    const headers = ['Name', 'Rarity', 'Gold', 'BP', 'Range', 'Damage', 'Parts', 'Description', 'Remove'];
    const headerRow = document.createElement('tr');
    headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);
    armaments.forEach((item, idx) => {
        const row = document.createElement('tr');
        const nameCell = document.createElement('td');
        nameCell.textContent = item.name || '';
        row.appendChild(nameCell);
        const rarityCell = document.createElement('td');
        rarityCell.textContent = item.rarity || '';
        row.appendChild(rarityCell);
        const goldCell = document.createElement('td');
        goldCell.textContent = item.totalGP !== undefined ? item.totalGP : (item.gp !== undefined ? item.gp : '');
        row.appendChild(goldCell);
        const bpCell = document.createElement('td');
        bpCell.textContent = item.totalBP !== undefined ? item.totalBP : (item.bp !== undefined ? item.bp : '');
        row.appendChild(bpCell);
        const rangeCell = document.createElement('td');
        let rangeStr = "-";
        if (item.range !== undefined && item.range !== null && item.range !== "") {
            if (typeof item.range === "number" && item.range > 0) {
                rangeStr = `${item.range} spaces`;
            } else if (typeof item.range === "string" && item.range.trim() !== "") {
                rangeStr = item.range;
            } else if (item.range === 0) {
                rangeStr = "Melee";
            }
        }
        rangeCell.textContent = rangeStr;
        row.appendChild(rangeCell);
        const dmgCell = document.createElement('td');
        let damageStr = "";
        if (item.damage && Array.isArray(item.damage)) {
            damageStr = item.damage
                .filter(d => d && d.amount && d.size && d.type && d.type !== 'none')
                .map(d => `${d.amount}d${d.size} ${d.type}`)
                .join(', ');
        }
        dmgCell.textContent = damageStr;
        row.appendChild(dmgCell);
        const partsCell = document.createElement('td');
        if (item.itemParts && item.itemParts.length > 0) {
            partsCell.innerHTML = item.itemParts.map(part => {
                let desc = "";
                if (window.itemPartsData) {
                    const found = window.itemPartsData.find(p => p.name === part.part);
                    if (found && found.description) desc = found.description;
                }
                let opt = "";
                if (part.opt1Level) opt += ` Opt 1: (${part.opt1Level})`;
                if (part.opt2Level) opt += ` Opt 2: (${part.opt2Level})`;
                if (part.opt3Level) opt += ` Opt 3: (${part.opt3Level})`;
                return `<span style="margin-right:10px;cursor:help;" title="${desc}">${part.part}${opt}</span>`;
            }).join('');
        }
        row.appendChild(partsCell);
        const descCell = document.createElement('td');
        descCell.textContent = item.description || '';
        row.appendChild(descCell);
        const removeCell = document.createElement('td');
        const removeBtn = document.createElement('button');
        removeBtn.className = "small-button red-button";
        removeBtn.textContent = "✕";
        removeBtn.onclick = () => {
            armaments.splice(idx, 1);
            renderArmaments();
            updateSummary();
        };
        removeCell.appendChild(removeBtn);
        row.appendChild(removeCell);
        table.appendChild(row);
    });
    container.appendChild(table);
    updateSummary();
}

// Main initialization function to be called from creatureCreator.js
export function initCreatureCreator(deps = {}) {
    // Accept skills from deps
    if (deps.skills && Array.isArray(deps.skills)) {
        skills = deps.skills;
    }

    // Setup event listeners for all UI elements

    // Level, Name, Type
    document.getElementById("creatureName").addEventListener("input", updateSummary);
    document.getElementById("creatureLevel").addEventListener("input", () => {
        updateSummary();
        updateCreatureAbilityDropdowns();
        updateHealthEnergyUI();
        updateDefensesUI();
        updateSkillsList();
    });
    document.getElementById("creatureType").addEventListener("change", updateSummary);

    // Resistances
    updateResistancesList();
    document.getElementById("addResistanceBtn").onclick = () => {
        const val = document.getElementById("resistanceDropdown").value;
        if (val && !resistances.includes(val)) {
            resistances.push(val);
            updateResistancesList();
            updateSummary();
        }
    };
    // Remove all resistances button
    if (!document.getElementById("removeAllResistBtn")) {
        const removeAllResistBtn = document.createElement("button");
        removeAllResistBtn.id = "removeAllResistBtn";
        removeAllResistBtn.textContent = "Remove All";
        removeAllResistBtn.className = "small-button red-button";
        removeAllResistBtn.style.marginLeft = "5px";
        removeAllResistBtn.onclick = () => {
            resistances.length = 0;
            updateResistancesList();
            updateSummary();
        };
        document.getElementById("addResistanceBtn").after(removeAllResistBtn);
    }

    // Weaknesses
    updateWeaknessesList();
    document.getElementById("addWeaknessBtn").onclick = () => {
        const val = document.getElementById("weaknessDropdown").value;
        if (val && !weaknesses.includes(val)) {
            weaknesses.push(val);
            updateWeaknessesList();
            updateSummary();
        }
    };
    if (!document.getElementById("removeAllWeakBtn")) {
        const removeAllWeakBtn = document.createElement("button");
        removeAllWeakBtn.id = "removeAllWeakBtn";
        removeAllWeakBtn.textContent = "Remove All";
        removeAllWeakBtn.className = "small-button red-button";
        removeAllWeakBtn.style.marginLeft = "5px";
        removeAllWeakBtn.onclick = () => {
            weaknesses.length = 0;
            updateWeaknessesList();
            updateSummary();
        };
        document.getElementById("addWeaknessBtn").after(removeAllWeakBtn);
    }

    // Immunities
    updateImmunitiesList();
    document.getElementById("addImmunityBtn").onclick = () => {
        const val = document.getElementById("immunityDropdown").value;
        if (val && !immunities.includes(val)) {
            immunities.push(val);
            updateImmunitiesList();
            updateSummary();
        }
    };
    if (!document.getElementById("removeAllImmuneBtn")) {
        const removeAllImmuneBtn = document.createElement("button");
        removeAllImmuneBtn.id = "removeAllImmuneBtn";
        removeAllImmuneBtn.textContent = "Remove All";
        removeAllImmuneBtn.className = "small-button red-button";
        removeAllImmuneBtn.style.marginLeft = "5px";
        removeAllImmuneBtn.onclick = () => {
            immunities.length = 0;
            updateImmunitiesList();
            updateSummary();
        };
        document.getElementById("addImmunityBtn").after(removeAllImmuneBtn);
    }

    // Senses
    updateSensesList();
    document.getElementById("addSenseBtn").onclick = () => {
        const val = document.getElementById("senseDropdown").value;
        if (!val) return;
        const sensesGroups = [
            ["Darkvision", "Darkvision II", "Darkvision III"],
            ["Blindsense", "Blindsense II", "Blindsense III", "Blindsense IV"],
            ["Telepathy", "Telepathy II"],
        ];
        for (const group of sensesGroups) {
            if (group.includes(val)) {
                for (const g of group) {
                    if (g !== val) {
                        const idx = senses.indexOf(g);
                        if (idx !== -1) senses.splice(idx, 1);
                    }
                }
            }
        }
        if (!senses.includes(val)) {
            senses.push(val);
        }
        updateSensesList();
        updateSummary();
    };
    if (!document.getElementById("removeAllSensesBtn")) {
        const removeAllSensesBtn = document.createElement("button");
        removeAllSensesBtn.id = "removeAllSensesBtn";
        removeAllSensesBtn.textContent = "Remove All";
        removeAllSensesBtn.className = "small-button red-button";
        removeAllSensesBtn.style.marginLeft = "5px";
        removeAllSensesBtn.onclick = () => {
            senses.length = 0;
            updateSensesList();
            updateSummary();
        };
        document.getElementById("addSenseBtn").after(removeAllSensesBtn);
    }

    // Movement
    updateMovementList();
    document.getElementById("addMovementBtn").onclick = () => {
        const val = document.getElementById("movementDropdown").value;
        if (!val) return;
        const movementGroups = [
            ["Fly Half", "Fly"],
            ["Burrow", "Burrow II"],
            ["Jump", "Jump II", "Jump III"],
            ["Speedy", "Speedy II", "Speedy III"],
            ["Slow", "Slow II", "Slow III"]
        ];
        for (const group of movementGroups) {
            if (group.includes(val)) {
                for (const g of group) {
                    if (g !== val) {
                        const idx = movement.findIndex(m => m.type === g);
                        if (idx !== -1) {
                            movement.splice(idx, 1);
                        }
                    }
                }
            }
        }
        if (!movement.some(m => m.type === val)) {
            movement.push({ type: val });
        }
        updateMovementList();
        updateSummary();
    };
    if (!document.getElementById("removeAllMoveBtn")) {
        const removeAllMoveBtn = document.createElement("button");
        removeAllMoveBtn.id = "removeAllMoveBtn";
        removeAllMoveBtn.textContent = "Remove All";
        removeAllMoveBtn.className = "small-button red-button";
        removeAllMoveBtn.style.marginLeft = "5px";
        removeAllMoveBtn.onclick = () => {
            movement.length = 0;
            updateMovementList();
            updateSummary();
        };
        document.getElementById("addMovementBtn").after(removeAllMoveBtn);
    }

    // Condition Immunities
    updateConditionImmunityList();
    document.getElementById("addConditionImmunityBtn").onclick = () => {
        const val = document.getElementById("conditionImmunityDropdown").value;
        if (val && !conditionImmunities.includes(val)) {
            conditionImmunities.push(val);
            updateConditionImmunityList();
            updateSummary();
        }
    };

    // Feats
    renderFeats();
    document.getElementById("addFeatBtn").onclick = () => {
        feats.push({ name: "", points: 1 });
        renderFeats();
        updateSummary();
    };

    // Powers/Techniques
    renderPowersTechniques();
    document.getElementById("addPowerBtn").onclick = window.openPowerModal || (() => {});
    document.getElementById("addTechniqueBtn").onclick = window.openTechniqueModal || (() => {});

    // Armaments
    renderArmaments();
    document.getElementById("addArmamentBtn").onclick = window.openArmamentModal || (() => {});

    // Skills
    updateSkillsDropdownOptions();
    updateSkillsList();
    document.getElementById("addSkillBtn").onclick = () => {
        const val = document.getElementById("skillsDropdown").value;
        if (!val) return;
        const skillObj = skills.find(s => s.name === val);
        if (skillObj && skillObj.subSkill && skillObj.baseSkill && !creatureSkills.includes(skillObj.baseSkill)) {
            alert(`You must add the base skill "${skillObj.baseSkill}" before adding "${skillObj.name}".`);
            return;
        }
        if (getSkillPointsRemaining() < 1) {
            alert("You do not have enough skill points to add another skill.");
            return;
        }
        if (!creatureSkills.includes(val)) {
            creatureSkills.push(val);
            creatureSkillValues[val] = 0;
            updateSkillsList();
            updateSkillsDropdownOptions();
            updateDefensesUI();
            updateSummary();
        }
    };
    if (!document.getElementById("removeAllSkillsBtn")) {
        const removeAllSkillsBtn = document.createElement("button");
        removeAllSkillsBtn.id = "removeAllSkillsBtn";
        removeAllSkillsBtn.textContent = "Remove All";
        removeAllSkillsBtn.className = "small-button red-button";
        removeAllSkillsBtn.style.marginLeft = "5px";
        removeAllSkillsBtn.onclick = () => {
            creatureSkills.length = 0;
            for (const k in creatureSkillValues) delete creatureSkillValues[k];
            updateSkillsList();
            updateSkillsDropdownOptions();
            updateDefensesUI();
            updateSummary();
        };
        document.getElementById("addSkillBtn").after(removeAllSkillsBtn);
    }

    // Languages
    updateLanguagesList();
    document.getElementById("addLanguageBtn").onclick = () => {
        const input = document.getElementById("languageInput");
        let val = input.value.trim();
        if (!val) return;
        if (!creatureLanguages.some(l => l.toLowerCase() === val.toLowerCase())) {
            creatureLanguages.push(val);
            updateLanguagesList();
            updateSummary();
        }
        input.value = "";
        input.focus();
    };

    // Abilities
    document.querySelectorAll('.creature-ability-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', () => {
            updateCreatureAbilityDropdowns();
            updateHealthEnergyUI();
            updateDefensesUI();
            updateSkillsList();
        });
    });

    // Health/Energy
    function setupHealthEnergyHandlers() {
        const hpInput = document.getElementById('hitPointsInput');
        const enInput = document.getElementById('energyInput');
        const incHP = document.getElementById('increaseHitPoints');
        const decHP = document.getElementById('decreaseHitPoints');
        const incEN = document.getElementById('increaseEnergy');
        const decEN = document.getElementById('decreaseEnergy');
        function changeHP(delta) {
            hpInput.value = parseInt(hpInput.value) + delta;
            updateHealthEnergyUI();
        }
        function changeEN(delta) {
            enInput.value = parseInt(enInput.value) + delta;
            updateHealthEnergyUI();
        }
        incHP.onclick = () => changeHP(1);
        decHP.onclick = () => changeHP(-1);
        incEN.onclick = () => changeEN(1);
        decEN.onclick = () => changeEN(-1);
        hpInput.oninput = updateHealthEnergyUI;
        enInput.oninput = updateHealthEnergyUI;
    }
    setupHealthEnergyHandlers();

    // Defenses
    function setupDefenseSkillButtons() {
        document.querySelectorAll('.defense-plus').forEach(btn => {
            btn.onclick = () => {
                const def = btn.dataset.defense;
                if (getSkillPointsRemaining() >= 2) {
                    defenseSkillState[def] = (defenseSkillState[def] || 0) + 1;
                    updateDefensesUI();
                }
            };
        });
        document.querySelectorAll('.defense-minus').forEach(btn => {
            btn.onclick = () => {
                const def = btn.dataset.defense;
                const base = getBaseDefenseValue(def);
                const current = getBaseDefenseValue(def) + (defenseSkillState[def] || 0);
                if ((defenseSkillState[def] || 0) > 0 && current > base) {
                    defenseSkillState[def] = (defenseSkillState[def] || 0) - 1;
                    updateDefensesUI();
                }
            };
        });
    }
    setupDefenseSkillButtons();

    // Details box toggle
    function setupCreatureDetailsBoxToggle() {
        const box = document.getElementById("creatureDetailsBox");
        const arrow = document.getElementById("creatureDetailsToggle");
        if (!box || !arrow) return;
        arrow.onclick = function(e) {
            e.stopPropagation();
            box.classList.toggle("collapsed");
            arrow.textContent = box.classList.contains("collapsed") ? ">" : "<";
        };
        arrow.style.zIndex = "1002";
    }
    setupCreatureDetailsBoxToggle();

    // Save/Load UI
    if (typeof deps.addSaveLoadCreatureUI === 'function') {
        deps.addSaveLoadCreatureUI();
    }

    // Modal event listeners
    if (typeof deps.setupModalEventListeners === 'function') {
        deps.setupModalEventListeners();
    }

    // Initial updates
    updateInnateInfo();
    updateCreatureAbilityDropdowns();
    updateHealthEnergyUI();
    updateDefensesUI();
    updateSummary();
}
