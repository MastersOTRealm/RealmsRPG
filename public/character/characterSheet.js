import skills from '../character/skillsData.js';
import feats from '../character/featsData.js'; // Import feats data
import './characterTabs.js';

const abilities = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'];
const abilityOptions = [-2, -1, 0, 1, 2, 3, 4, 5];
const baseMaxTotal = 7;
const maxNegativeTotal = -3;
let isEditMode = true;
let skillPointsTotal;
let totalSkillPointsEarned = 0;
let evFeatMod = 0;
let HPMaxIncrease = 0;
let ENMaxIncrease = 0;
let totalIncreasePoints = 0;

const abilityAbbreviations = {
    strength: 'STR',
    vitality: 'VIT',
    agility: 'AGI',
    acuity: 'ACU',
    intelligence: 'INT',
    charisma: 'CHA'
};

async function saveCharacterData(characterData) {
    const response = await fetch('https://savecharacterdata-ch2wifkjtq-uc.a.run.app', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(characterData),
    });
    return response.json();
}

async function authenticateUser(token) {
    const response = await fetch('https://authenticateuser-ch2wifkjtq-uc.a.run.app', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
    });
    return response.json();
}

document.addEventListener('DOMContentLoaded', () => {
    skillPointsTotal = calculateSkillPointsTotal();
    totalIncreasePoints = calculateTotalIncreasePoints();
    updateSkillPointsTotal();
    updateDefenseScores();
    updateEvasion();
    updateHP();
    updateEnergy();
    updateTotal(); // Add this line to update the total value on load
    updateMovementSpeed(); // Add this line to update the movement speed on load
    updateIncreasePointsDisplay(); // Add this line to update the increase points display on load

    const levelElement = document.getElementById('level');
    if (levelElement) {
        levelElement.addEventListener('change', () => {
            skillPointsTotal = calculateSkillPointsTotal();
            totalIncreasePoints = calculateTotalIncreasePoints();
            updateSkillPointsTotal();
            updateDefenseScores();
            updateAbilityOptions(); // Add this line to update abilities when level changes
            updateTotal(); // Add this line to update the total value when level changes
            updateHP(); // Add this line to update HP when level changes
            updateMovementSpeed(); // Add this line to update the movement speed when level changes
            updateIncreasePointsDisplay(); // Add this line to update the increase points display when level changes
        });
    }

    const defenses = ['might', 'fortitude', 'reflex', 'discernment', 'mental-fortitude', 'resolve'];
    defenses.forEach(defense => {
        document.getElementById(`${defense}-increase`).addEventListener('click', () => handleDefenseIncrease(defense));
        document.getElementById(`${defense}-decrease`).addEventListener('click', () => handleDefenseDecrease(defense));
        document.getElementById(`${defense}-roll`).addEventListener('click', () => handleDefenseRoll(defense));
    });

    const modeSwitchElement = document.getElementById('modeSwitch');
    if (modeSwitchElement) {
        modeSwitchElement.addEventListener('change', toggleMode);
    }

    const toggleLogButtonElement = document.getElementById('toggleLogButton');
    if (toggleLogButtonElement) {
        toggleLogButtonElement.addEventListener('click', () => {
            const logContent = document.getElementById('logContent');
            if (logContent) {
                logContent.classList.toggle('hidden');
            }
        });
    }

    abilities.forEach(ability => {
        const select = document.getElementById(ability);
        const button = document.getElementById(`${ability}-button`);
        const halfPointCheckbox = document.getElementById(`${ability}-half`);
        if (select && button && halfPointCheckbox) {
            abilityOptions.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                select.appendChild(optionElement);
            });
            select.value = 0; // Initialize with default value
            select.addEventListener('change', () => {
                updateAbilityOptions();
                updateDefenseScores();
                updateSkillButtons(); // Add this line to update skill buttons
                updateEvasion();
                updateMovementSpeed(); // Add this line to update the movement speed
            });
            halfPointCheckbox.addEventListener('change', () => {
                updateAbilityOptions();
                updateDefenseScores();
                updateSkillButtons(); // Add this line to update skill buttons
            });
            button.addEventListener('click', handleAbilityClick);
        } else {
            console.error(`Missing element for ability: ${ability}`);
        }
    });

    const skillDropdown = document.getElementById('skillDropdown');
    const addSkillButton = document.getElementById('addSkillButton');
    const skillsListContainer = document.getElementById('skills-list');

    // Populate the skill dropdown on page load
    const updateSkillDropdown = () => {
        const currentSkills = Array.from(skillsListContainer.getElementsByClassName('skill-item'))
            .map(item => item.querySelector('span.skill-name').textContent);
        skillDropdown.innerHTML = skills
            .filter(skill => !skill.instinctive && !skill.subSkill && !currentSkills.includes(skill.name))
            .map(skill => `<option value="${skill.name}">${skill.name}</option>`)
            .join('');
    };

    const createSkillItem = (skill) => {
        skill.skillPoints = 0; // Initialize skillPoints
        const newSkillItem = document.createElement('div');
        newSkillItem.className = 'skill-item';
        const abilitiesOptions = skill.abilities.length > 0 ? 
            (skill.abilities.length > 1 ? 
                `<select class="skill-ability-select">
                    ${skill.abilities.map(ability => `<option value="${ability}">${abilityAbbreviations[ability]}</option>`).join('')}
                </select>` : 
                `<span class="skill-abilities">${abilityAbbreviations[skill.abilities[0]]}</span>`) : 
            `<span class="skill-abilities">N/A</span>`;
        const abilityValue = skill.abilities.length > 0 ? parseInt(document.getElementById(skill.abilities[0]).value || 0) : 0;
        const skillBonus = calculateSkillBonus(skill, abilityValue);
        newSkillItem.innerHTML = `
            <span class="skill-name ${skill.instinctive ? 'bold' : ''}">${skill.name}</span>
            ${abilitiesOptions}
            <button class="skill-roll-button ${skill.proficient ? 'proficient' : ''}" data-skill="${skill.name}">${skillBonus >= 0 ? '+' : ''}${skillBonus}</button>
            <div class="skill-buttons">
                <button class="skill-increase-button" data-skill="${skill.name}">+</button>
                <button class="skill-decrease-button" data-skill="${skill.name}">-</button>
            </div>
        `;
        return newSkillItem;
    };

    // Populate the skills list with instinctive skills that are not subskills
    const populateInitialSkills = () => {
        const initialSkills = skills
            .filter(skill => skill.instinctive && !skill.subSkill)
            .sort((a, b) => a.name.localeCompare(b.name));

        initialSkills.forEach(skill => {
            const newSkillItem = createSkillItem(skill);
            skillsListContainer.appendChild(newSkillItem);
        });
    };

    populateInitialSkills();
    updateSkillDropdown();

    addSkillButton.addEventListener('click', () => {
        const selectedSkillName = skillDropdown.value;
        const selectedSkill = skills.find(skill => skill.name === selectedSkillName);
        if (selectedSkill) {
            selectedSkill.proficient = true; // Automatically make the new skill proficient
            skillPointsTotal -= 1; // Spend a skill point to make the skill proficient
            const newSkillItem = createSkillItem(selectedSkill);
            skillsListContainer.appendChild(newSkillItem);

            // Sort the skills list alphabetically
            const skillItems = Array.from(skillsListContainer.getElementsByClassName('skill-item'));
            skillItems.sort((a, b) => a.querySelector('span.skill-name').textContent.localeCompare(b.querySelector('span.skill-name').textContent));
            skillsListContainer.innerHTML = '';
            skillItems.forEach(item => skillsListContainer.appendChild(item));

            // Update the dropdown to remove the added skill
            updateSkillDropdown();
            updateSkillPointsTotal(); // Update the skill points total
        }
    });

    // Add event listener for skill roll buttons
    skillsListContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('skill-roll-button')) {
            const skillName = event.target.dataset.skill;
            const skill = skills.find(skill => skill.name === skillName);
            if (skill) {
                const abilityValue = parseInt(document.getElementById(skill.abilities[0]).value || 0);
                const skillBonus = skill.skillPoints + abilityValue;
                const roll = rollD20();
                const total = roll + skillBonus;

                logRollResult(skillName, roll, skillBonus, total);
            } else {
                console.error(`Skill not found: ${skillName}`);
            }
        } else if (event.target.classList.contains('skill-increase-button')) {
            handleSkillIncrease(event.target.dataset.skill);
        } else if (event.target.classList.contains('skill-decrease-button')) {
            handleSkillDecrease(event.target.dataset.skill);
        }
    });

    const handleSkillIncrease = (skillName) => {
        const skill = skills.find(skill => skill.name === skillName);
        if (skill) {
            if (!skill.proficient && skillPointsTotal > 0) {
                skill.proficient = true;
                skillPointsTotal -= 1; // Spend a skill point to make the skill proficient
            } else if (skill.proficient && skillPointsTotal > 0) {
                skill.skillPoints += 1;
                skillPointsTotal -= 1;
            }
            updateSkillButtons();
            updateSkillPointsTotal();
        }
    };

    const handleSkillDecrease = (skillName) => {
        const skill = skills.find(skill => skill.name === skillName);
        if (skill) {
            if (skill.proficient && skill.skillPoints === 0) {
                skill.proficient = false;
                skillPointsTotal += 1; // Refund a skill point when removing proficiency
                if (!skill.instinctive) {
                    const skillItem = Array.from(skillsListContainer.getElementsByClassName('skill-item'))
                        .find(item => item.querySelector('span.skill-name').textContent === skillName);
                    if (skillItem) {
                        skillsListContainer.removeChild(skillItem);
                    }
                    updateSkillDropdown();
                }
            } else if (skill.skillPoints > 0) {
                skill.skillPoints -= 1;
                skillPointsTotal += 1;
            }
            updateSkillButtons();
            updateSkillPointsTotal();
        }
    };

    // Add this function to update skill buttons
    const updateSkillButtons = () => {
        const skillItems = Array.from(skillsListContainer.getElementsByClassName('skill-item'));
        skillItems.forEach(item => {
            const skillName = item.querySelector('span.skill-name').textContent;
            const skill = skills.find(skill => skill.name === skillName);
            const abilitySelect = item.querySelector('select');
            const ability = abilitySelect ? abilitySelect.value : skill.abilities[0];
            const abilityValue = parseInt(document.getElementById(ability).value || 0);
            const skillBonus = calculateSkillBonus(skill, abilityValue);
            const skillButton = item.querySelector('button.skill-roll-button');
            skillButton.textContent = `${skillBonus >= 0 ? '+' : ''}${skillBonus}`;
            skillButton.classList.toggle('proficient', skill.proficient);
            const increaseButton = item.querySelector('button.skill-increase-button');
            const decreaseButton = item.querySelector('button.skill-decrease-button');
            increaseButton.disabled = skillPointsTotal <= 0 && skill.proficient;
            decreaseButton.disabled = !skill.proficient && skill.skillPoints <= 0;
            if (abilitySelect) {
                abilitySelect.innerHTML = skill.abilities.map(ability => `<option value="${ability}">${abilityAbbreviations[ability]}</option>`).join('');
                abilitySelect.value = ability;
            }
        });
    };

    // Call updateSkillButtons initially to set the correct values
    updateSkillButtons();

    const hpIncreaseButton = document.getElementById('hp-increase');
    if (hpIncreaseButton) {
        hpIncreaseButton.addEventListener('click', handleHPIncrease);
    }

    const hpDecreaseButton = document.getElementById('hp-decrease');
    if (hpDecreaseButton) {
        hpDecreaseButton.addEventListener('click', handleHPDecrease);
    }

    const energyIncreaseButton = document.getElementById('energy-increase');
    if (energyIncreaseButton) {
        energyIncreaseButton.addEventListener('click', handleEnergyIncrease);
    }

    const energyDecreaseButton = document.getElementById('energy-decrease');
    if (energyDecreaseButton) {
        energyDecreaseButton.addEventListener('click', handleEnergyDecrease);
    }

    toggleMode(); // Ensure the mode is set correctly on load
    // Ensure ability roll buttons are visible in play mode
    if (!isEditMode) {
        abilities.forEach(ability => {
            const button = document.getElementById(`${ability}-button`);
            button.classList.remove('hidden');
            button.classList.add('ability-roll-button'); // Ensure the roll buttons are shown in play mode
        });
    }

    const martialProficiencySelect = document.getElementById('martial-proficiency');
    const powerProficiencySelect = document.getElementById('power-proficiency');

    const updateProficiencyOptions = () => {
        const level = parseInt(document.getElementById('level').value);
        const archetypeProficiency = Math.floor(level / 5) + 2;
        const martialProficiency = parseInt(martialProficiencySelect.value || 0);
        const powerProficiency = parseInt(powerProficiencySelect.value || 0);

        const updateOptions = (select, max, currentValue) => {
            select.innerHTML = '';
            for (let i = 0; i <= max; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i;
                select.appendChild(option);
            }
            if (currentValue > max) {
                select.value = max;
            } else {
                select.value = currentValue;
            }
        };

        updateOptions(martialProficiencySelect, archetypeProficiency - powerProficiency, martialProficiency);
        updateOptions(powerProficiencySelect, archetypeProficiency - martialProficiency, powerProficiency);
    };

    document.getElementById('level').addEventListener('change', updateProficiencyOptions);
    martialProficiencySelect.addEventListener('change', updateProficiencyOptions);
    powerProficiencySelect.addEventListener('change', updateProficiencyOptions);

    // Set initial values and update options
    martialProficiencySelect.value = 0;
    powerProficiencySelect.value = 0;
    updateProficiencyOptions();

    updateProficiencyOptions(); // Initial call to set the correct options

    const updateBonusAttackValues = () => {
        const martialProficiency = parseInt(document.getElementById('martial-proficiency').value || 0);
        const powerProficiency = parseInt(document.getElementById('power-proficiency').value || 0);
        const strength = parseInt(document.getElementById('strength').value || 0);
        const agility = parseInt(document.getElementById('agility').value || 0);
        const acuity = parseInt(document.getElementById('acuity').value || 0);
        const powerAbility = 0; // Placeholder for Power Ability

        document.getElementById('strength-attack-roll').textContent = `+${martialProficiency + strength}`;
        document.getElementById('agility-attack-roll').textContent = `+${martialProficiency + agility}`;
        document.getElementById('acuity-attack-roll').textContent = `+${martialProficiency + acuity}`;
        document.getElementById('power-attack-roll').textContent = `+${powerProficiency + powerAbility}`;
    };

    const handleBonusAttackRoll = (attackType, bonus) => {
        const roll = rollD20();
        const total = roll + parseInt(bonus);
        logRollResult(attackType, roll, parseInt(bonus), total);
    };

    document.getElementById('strength-attack-roll').addEventListener('click', () => {
        const bonus = document.getElementById('strength-attack-roll').textContent;
        handleBonusAttackRoll('Strength Attack', bonus);
    });

    document.getElementById('agility-attack-roll').addEventListener('click', () => {
        const bonus = document.getElementById('agility-attack-roll').textContent;
        handleBonusAttackRoll('Agility Attack', bonus);
    });

    document.getElementById('acuity-attack-roll').addEventListener('click', () => {
        const bonus = document.getElementById('acuity-attack-roll').textContent;
        handleBonusAttackRoll('Acuity Attack', bonus);
    });

    document.getElementById('power-attack-roll').addEventListener('click', () => {
        const bonus = document.getElementById('power-attack-roll').textContent;
        handleBonusAttackRoll('Power Attack', bonus);
    });

    document.getElementById('martial-proficiency').addEventListener('change', updateBonusAttackValues);
    document.getElementById('power-proficiency').addEventListener('change', updateBonusAttackValues);
    document.getElementById('strength').addEventListener('change', updateBonusAttackValues);
    document.getElementById('agility').addEventListener('change', updateBonusAttackValues);
    document.getElementById('acuity').addEventListener('change', updateBonusAttackValues);

    updateBonusAttackValues(); // Initial call to set the correct values

    const featsDropdown = document.getElementById('featsDropdown');
    const addFeatButton = document.getElementById('addFeatButton');
    const featsListContainer = document.getElementById('feats-list');

    // Populate the feats dropdown on page load
    const updateFeatsDropdown = () => {
        featsDropdown.innerHTML = feats
            .map(feat => `<option value="${feat.name}">${feat.name}</option>`)
            .join('');
    };

    const createFeatItem = (feat) => {
        const newFeatItem = document.createElement('div');
        newFeatItem.className = 'feat-item';
        newFeatItem.innerHTML = `
            <span class="feat-name">${feat.name}</span>
            <span class="feat-description">${feat.description}</span>
        `;
        return newFeatItem;
    };

    addFeatButton.addEventListener('click', () => {
        const selectedFeatName = featsDropdown.value;
        const selectedFeat = feats.find(feat => feat.name === selectedFeatName);
        if (selectedFeat) {
            const newFeatItem = createFeatItem(selectedFeat);
            featsListContainer.appendChild(newFeatItem);

            // Sort the feats list alphabetically
            const featItems = Array.from(featsListContainer.getElementsByClassName('feat-item'));
            featItems.sort((a, b) => a.querySelector('span.feat-name').textContent.localeCompare(b.querySelector('span.feat-name').textContent));
            featsListContainer.innerHTML = '';
            featItems.forEach(item => featsListContainer.appendChild(item));
        }
    });

    updateFeatsDropdown();

    const saveCharacterButton = document.getElementById("saveCharacterButton");
    if (saveCharacterButton) {
        saveCharacterButton.addEventListener("click", async () => {
            const characterData = {
                name: document.getElementById('characterName').value,
                level: document.getElementById('level').value,
                abilities: abilities.reduce((acc, ability) => {
                    acc[ability] = document.getElementById(ability).value;
                    return acc;
                }, {}),
                skills: Array.from(document.getElementById('skills-list').getElementsByClassName('skill-item')).map(item => ({
                    name: item.querySelector('span.skill-name').textContent,
                    points: item.querySelector('button.skill-roll-button').textContent,
                })),
                feats: Array.from(document.getElementById('feats-list').getElementsByClassName('feat-item')).map(item => item.querySelector('span.feat-name').textContent),
            };
            const user = auth.currentUser;
            if (user) {
                const token = await user.getIdToken();
                await authenticateUser(token);
                await saveCharacterData(characterData);
                alert('Character data saved!');
            } else {
                alert('Please log in to save your character data.');
            }
        });
    }
});

function calculateSkillPointsTotal() {
    const level = parseInt(document.getElementById('level').value);
    const baseSkillPoints = level * 3;
    const totalReductions = calculateTotalReductions();
    const totalSkillIncreases = calculateTotalSkillIncreases();
    return baseSkillPoints - totalReductions - totalSkillIncreases;
}

function calculateTotalReductions() {
    const defenses = ['might', 'fortitude', 'reflex', 'discernment', 'mental-fortitude', 'resolve'];
    let totalReductions = 0;

    defenses.forEach(defense => {
        const bonusElement = document.getElementById(`${defense}-bonus`);
        const skillPointIncrease = parseInt(bonusElement.dataset.skillPointIncrease || 0);
        totalReductions += skillPointIncrease * 2;
    });

    return totalReductions;
}

function calculateTotalSkillIncreases() {
    const skillItems = Array.from(document.getElementById('skills-list').getElementsByClassName('skill-item'));
    let totalSkillIncreases = 0;

    skillItems.forEach(item => {
        const skillName = item.querySelector('span.skill-name').textContent;
        const skill = skills.find(skill => skill.name === skillName);
        totalSkillIncreases += skill.skillPoints;
    });

    return totalSkillIncreases;
}

function updateAbilityOptions() {
    const level = parseInt(document.getElementById('level').value);
    const maxAbilityValue = level === 1 ? 3 : 5;
    const maxTotal = baseMaxTotal + Math.floor(level / 3);

    const total = abilities.reduce((sum, ability) => {
        const value = parseInt(document.getElementById(ability).value || 0);
        const halfPoint = document.getElementById(`${ability}-half`).checked ? 1 : 0;
        const extraPoint = value > 4 ? value - 4 : 0;
        return sum + value + halfPoint + extraPoint;
    }, 0);

    const negativeTotal = abilities.reduce((sum, ability) => {
        const value = parseInt(document.getElementById(ability).value || 0);
        return value < 0 ? sum + value : sum;
    }, 0);

    abilities.forEach(ability => {
        const select = document.getElementById(ability);
        const button = document.getElementById(`${ability}-button`);
        const currentValue = parseInt(select.value || 0);
        const halfPointCheckbox = document.getElementById(`${ability}-half`);
        const halfPointLabel = document.querySelector(`label[for="${ability}-half"]`);

        select.innerHTML = '';
        abilityOptions.forEach(option => {
            const newTotal = total - currentValue + option - (currentValue > 4 ? currentValue - 4 : 0) + (option > 4 ? option - 4 : 0);
            const newNegativeTotal = negativeTotal - (currentValue < 0 ? currentValue : 0) + (option < 0 ? option : 0);
            if (newTotal <= maxTotal &&
                newNegativeTotal >= maxNegativeTotal &&
                option <= maxAbilityValue) {
                const opt = document.createElement('option');
                opt.value = option;
                opt.textContent = option;
                select.appendChild(opt);
            }
        });

        if (currentValue > 4) {
            halfPointCheckbox.checked = false;
            halfPointCheckbox.disabled = true;
        } else {
            halfPointCheckbox.disabled = total >= maxTotal && !halfPointCheckbox.checked;
        }

        select.value = currentValue;
        button.textContent = `${currentValue >= 0 ? '+' : ''}${currentValue}`;
    });
}

function updateTotal() {
    const level = parseInt(document.getElementById('level').value);
    const total = (level * 12) + 6 - (HPMaxIncrease + ENMaxIncrease);
    const totalElement = document.getElementById('total');
    if (totalElement) {
        totalElement.textContent = total;
    }
}

function toggleMode() {
    isEditMode = !isEditMode;
    document.getElementById('modeLabel').textContent = isEditMode ? 'Edit Mode' : 'Play Mode';
    document.body.classList.toggle('play-mode', !isEditMode); // Update body class based on mode

    abilities.forEach(ability => {
        const select = document.getElementById(ability);
        const button = document.getElementById(`${ability}-button`);
        const halfPointCheckbox = document.getElementById(`${ability}-half`);
        const halfPointLabel = document.querySelector(`label[for="${ability}-half"]`);

        if (isEditMode) {
            select.classList.remove('hidden');
            button.classList.add('hidden');
            halfPointCheckbox.classList.remove('hidden');
            halfPointLabel.classList.remove('hidden');
        } else {
            select.classList.add('hidden');
            button.classList.remove('hidden'); // Ensure the roll buttons are shown in play mode
            halfPointCheckbox.classList.add('hidden');
            halfPointLabel.classList.add('hidden');
        }
    });

    const skillItems = Array.from(document.getElementById('skills-list').getElementsByClassName('skill-item'));
    skillItems.forEach(item => {
        const skillButtons = item.querySelector('.skill-buttons');
        const abilitySelect = item.querySelector('select.skill-ability-select');
        const abilityText = item.querySelector('span.skill-abilities');

        if (isEditMode) {
            skillButtons.classList.remove('hidden');
            if (abilitySelect) {
                abilitySelect.classList.remove('hidden');
                if (abilityText) {
                    abilityText.classList.add('hidden');
                }
            }
        } else {
            skillButtons.classList.add('hidden');
            if (abilitySelect) {
                abilitySelect.classList.add('hidden');
                if (abilityText) {
                    abilityText.textContent = abilitySelect.options[abilitySelect.selectedIndex].text;
                    abilityText.classList.remove('hidden');
                } else {
                    const newAbilityText = document.createElement('span');
                    newAbilityText.className = 'skill-abilities';
                    newAbilityText.textContent = abilitySelect.options[abilitySelect.selectedIndex].text;
                    item.insertBefore(newAbilityText, abilitySelect);
                }
            }
        }
    });

    const hpButtons = document.querySelector('.hp-buttons');
    const energyButtons = document.querySelector('.energy-buttons');
    if (hpButtons && energyButtons) {
        if (isEditMode) {
            hpButtons.classList.remove('hidden');
            energyButtons.classList.remove('hidden');
        } else {
            hpButtons.classList.add('hidden');
            energyButtons.classList.add('hidden');
        }
    }

    const totalBox = document.querySelector('.total-box');
    if (totalBox) {
        if (isEditMode) {
            totalBox.classList.remove('hidden');
        } else {
            totalBox.classList.add('hidden');
        }
    }

    const skillPointsContainer = document.querySelector('.skill-points-container');
    if (skillPointsContainer) {
        if (isEditMode) {
            skillPointsContainer.classList.remove('hidden');
        } else {
            skillPointsContainer.classList.add('hidden');
        }
    }

    const defenseButtonsContainers = document.querySelectorAll('.defense-buttons-container');
    defenseButtonsContainers.forEach(container => {
        if (isEditMode) {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    });

    // Ensure the skill points container is displayed correctly in edit mode
    const skillPointsContainerElement = document.querySelector('.skill-points-container');
    if (isEditMode) {
        skillPointsContainerElement.classList.remove('hidden');
    } else {
        skillPointsContainerElement.classList.add('hidden');
    }

    // Toggle proficiency dropdowns and static values
    const martialProficiencySelect = document.getElementById('martial-proficiency');
    const powerProficiencySelect = document.getElementById('power-proficiency');
    const martialProficiencyValue = document.getElementById('martial-proficiency-value');
    const powerProficiencyValue = document.getElementById('power-proficiency-value');

    if (isEditMode) {
        martialProficiencySelect.classList.remove('hidden');
        powerProficiencySelect.classList.remove('hidden');
        martialProficiencyValue.classList.add('hidden');
        powerProficiencyValue.classList.add('hidden');
    } else {
        martialProficiencySelect.classList.add('hidden');
        powerProficiencySelect.classList.add('hidden');
        martialProficiencyValue.textContent = martialProficiencySelect.value;
        powerProficiencyValue.textContent = powerProficiencySelect.value;
        martialProficiencyValue.classList.remove('hidden');
        powerProficiencyValue.classList.remove('hidden');
    }

    // Toggle feats dropdown and add button
    if (isEditMode) {
        featsDropdown.classList.remove('hidden');
        addFeatButton.classList.remove('hidden');
    } else {
        featsDropdown.classList.add('hidden');
        addFeatButton.classList.add('hidden');
    }
}

function rollD20() {
    const roll = Math.floor(Math.random() * 20) + 1;
    if (roll === 20) {
        return roll + 2;
    } else if (roll === 1) {
        return roll - 2;
    }
    return roll;
}

function logRollResult(name, roll, value, total) {
    const logContent = document.getElementById('logContent');

    const nameElement = document.createElement('div');
    nameElement.className = 'log-ability';
    nameElement.textContent = name.charAt(0).toUpperCase() + name.slice(1);

    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = `d20 ${roll} ${value >= 0 ? '+' : ''}${value} = ${total}`;

    logContent.appendChild(nameElement);
    logContent.appendChild(logEntry);

    // Scroll to the bottom of the log
    logContent.scrollTop = logContent.scrollHeight;
}

function handleAbilityClick(event) {
    if (!isEditMode) {
        const ability = event.target.id.replace('-button', '');
        const value = parseInt(document.getElementById(ability).value || 0);
        const roll = rollD20();
        const total = roll + value;

        logRollResult(ability, roll, value, total);
    }
}

function handleDefenseRoll(defense) {
    const bonusElement = document.getElementById(`${defense}-bonus`);
    const bonus = parseInt(bonusElement.textContent);
    const roll = rollD20();
    const total = roll + bonus;

    logRollResult(defense, roll, bonus, total);
}

function updateSkillPointsTotal() {
    document.getElementById('skill-points-total').textContent = skillPointsTotal;
}

function updateDefenseScores() {
    const defenses = ['might', 'fortitude', 'reflex', 'discernment', 'mental-fortitude', 'resolve'];
    const relatedAbilities = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'];

    defenses.forEach((defense, index) => {
        const ability = relatedAbilities[index];
        const abilityValue = parseInt(document.getElementById(ability).value || 0);
        const bonusElement = document.getElementById(`${defense}-bonus`);
        const scoreElement = document.getElementById(`${defense}-score`);
        const skillPointIncrease = parseInt(bonusElement.dataset.skillPointIncrease || 0);
        const bonus = abilityValue + skillPointIncrease;
        const score = 10 + bonus;

        bonusElement.textContent = `${bonus >= 0 ? '+' : ''}${bonus}`;
        scoreElement.textContent = score;

        const rollButton = document.getElementById(`${defense}-roll`);
        rollButton.textContent = `${bonus >= 0 ? '+' : ''}${bonus}`;
        rollButton.classList.remove('hidden'); // Ensure the roll buttons are always visible
    });
}

function handleDefenseIncrease(defense) {
    const bonusElement = document.getElementById(`${defense}-bonus`);
    let skillPointIncrease = parseInt(bonusElement.dataset.skillPointIncrease || 0);

    if (skillPointsTotal >= 2) {
        skillPointIncrease += 1;
        skillPointsTotal -= 2;
        bonusElement.dataset.skillPointIncrease = skillPointIncrease;
        updateDefenseScores();
        updateSkillPointsTotal();
    }
}

function handleDefenseDecrease(defense) {
    const bonusElement = document.getElementById(`${defense}-bonus`);
    let skillPointIncrease = parseInt(bonusElement.dataset.skillPointIncrease || 0);

    if (skillPointIncrease > 0) {
        skillPointIncrease -= 1;
        skillPointsTotal += 2;
        bonusElement.dataset.skillPointIncrease = skillPointIncrease;
        updateDefenseScores();
        updateSkillPointsTotal();
    }
}

function calculateDefenseBonus(defense) {
    // Calculate defense bonus based on some logic
    return 0; // Placeholder value
}

const calculateSkillBonus = (skill, abilityValue) => {
    if (skill.proficient) {
        return skill.skillPoints + abilityValue;
    } else if (skill.instinctive) {
        if (abilityValue >= 0) {
            return Math.ceil(abilityValue / 2);
        } else {
            return abilityValue * 2;
        }
    }
    return 0;
};

function updateEvasion() {
    const agilityValue = parseInt(document.getElementById('agility').value || 0);
    const evasionValue = 10 + agilityValue + evFeatMod;
    document.getElementById('evasion').textContent = evasionValue;
}

function updateHP() {
    const vitalityValue = parseInt(document.getElementById('vitality').value || 0);
    const level = parseInt(document.getElementById('level').value || 1);
    const baseHP = vitalityValue * level;
    const minHP = baseHP + 6;
    const maxHP = Math.max(minHP, baseHP + 6 + HPMaxIncrease);
    document.getElementById('max-hp').textContent = maxHP;
    document.getElementById('current-hp').value = maxHP; // Default current HP to max HP

    // Calculate and update the Terminal value
    const terminalValue = Math.ceil(maxHP / 4);
    document.getElementById('terminal-value').textContent = terminalValue;

    // Add gradient red border if max HP is equal to or less than Terminal value
    const hpBox = document.getElementById('hit-points').parentElement;
    if (maxHP <= terminalValue) {
        hpBox.classList.add('low-health');
    } else {
        hpBox.classList.remove('low-health');
    }

    // Update total HP and energy points box
    const totalBox = document.getElementById('total-box');
    if (totalBox) {
        totalBox.textContent = `Total HP: ${maxHP}, Total Energy: ${ENMaxIncrease}`;
    }
}

function updateEnergy() {
    const maxEnergy = ENMaxIncrease;
    document.getElementById('max-energy').textContent = maxEnergy;
    document.getElementById('current-energy').value = maxEnergy; // Default current energy to max energy

    // Update total HP and energy points box
    const totalBox = document.getElementById('total-box');
    if (totalBox) {
        totalBox.textContent = `Total HP: ${document.getElementById('max-hp').textContent}, Total Energy: ${maxEnergy}`;
    }
}

function handleHPIncrease() {
    const remainingPoints = calculateTotalIncreasePoints();
    if (remainingPoints > 0) {
        HPMaxIncrease += 1;
        updateHP();
        updateTotal();
        updateIncreasePointsDisplay();
    }
}

function handleHPDecrease() {
    const vitalityValue = parseInt(document.getElementById('vitality').value || 0);
    const level = parseInt(document.getElementById('level').value || 1);
    const baseHP = vitalityValue * level;
    const minHP = baseHP + 6;

    if (HPMaxIncrease > 0 || (vitalityValue < 0 && HPMaxIncrease > minHP)) {
        HPMaxIncrease -= 1;
        updateHP();
        updateTotal();
        updateIncreasePointsDisplay();
    }
}

function handleEnergyIncrease() {
    const remainingPoints = calculateTotalIncreasePoints();
    if (remainingPoints > 0) {
        ENMaxIncrease += 1;
        updateEnergy();
        updateTotal();
        updateIncreasePointsDisplay();
    }
}

function handleEnergyDecrease() {
    if (ENMaxIncrease > 0) {
        ENMaxIncrease -= 1;
        updateEnergy();
        updateTotal();
        updateIncreasePointsDisplay();
    }
}

function updateMovementSpeed() {
    const agilityValue = parseInt(document.getElementById('agility').value || 0);
    const movementSpeed = 6 + Math.ceil(agilityValue / 2);
    document.getElementById('movement-speed').textContent = movementSpeed;
}

function calculateTotalIncreasePoints() {
    const level = parseInt(document.getElementById('level').value);
    return (level * 12 + 6) - (HPMaxIncrease + ENMaxIncrease);
}

function updateIncreasePointsDisplay() {
    const remainingPoints = calculateTotalIncreasePoints();
    const increasePointsBox = document.getElementById('increase-points-box');
    if (increasePointsBox) {
        increasePointsBox.textContent = `Remaining Increase Points: ${remainingPoints}`;
    }
}