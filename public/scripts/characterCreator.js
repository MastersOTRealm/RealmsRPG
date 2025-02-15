import species from './speciesData.js';
import skills from './skillsData.js';
import geneticFeats from './geneticFeatsData.js';
import { featsData } from './featsData.js';

export function openTab(evt, tabName) {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.style.display = 'none');

    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));

    document.getElementById(tabName).style.display = 'block';
    evt.currentTarget.classList.add('active');
}

export function initializeTabs() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function(event) {
            const tabName = this.getAttribute('data-tab');
            openTab(event, tabName);
        });
    });

    // Open the first tab by default
    const firstTabButton = document.querySelector('.tab-button');
    if (firstTabButton) {
        firstTabButton.click();
    }
}

export function showMartialOptions() {
    hideAllOptions();
    document.getElementById('martial-options').style.display = 'block';
}

export function showPoweredMartialOptions() {
    hideAllOptions();
    document.getElementById('powered-martial-options').style.display = 'block';
}

export function showPowerOptions() {
    hideAllOptions();
    document.getElementById('power-options').style.display = 'block';
}

function hideAllOptions() {
    document.getElementById('martial-options').style.display = 'none';
    document.getElementById('powered-martial-options').style.display = 'none';
    document.getElementById('power-options').style.display = 'none';
}

export function initializeAbilityButtons() {
    document.querySelectorAll('.ability-button').forEach(button => {
        button.addEventListener('click', function() {
            if (this.classList.contains('martial')) {
                document.querySelectorAll('.ability-button.martial').forEach(btn => btn.classList.remove('selected'));
            } else if (this.classList.contains('power')) {
                document.querySelectorAll('.ability-button.power').forEach(btn => btn.classList.remove('selected'));
            } else {
                document.querySelectorAll('.ability-button').forEach(btn => btn.classList.remove('selected'));
            }
            this.classList.add('selected');
        });
        button.addEventListener('mouseover', function() {
            const tooltip = this.getAttribute('data-tooltip');
            this.setAttribute('title', tooltip);
        });
    });
}

export function selectArchetype(button, archetype) {
    document.querySelectorAll('.archetype-button').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    if (archetype === 'martial') {
        showMartialOptions();
    } else if (archetype === 'powered-martial') {
        showPoweredMartialOptions();
    } else if (archetype === 'power') {
        showPowerOptions();
    }
    initializeArchetypeFeats(); // Call initializeArchetypeFeats after selecting an archetype
}

export function populateSpeciesDropdown() {
    const dropdown = document.getElementById('speciesDropdown');
    dropdown.innerHTML = ''; // Clear existing options
    species.forEach(species => {
        const option = document.createElement('option');
        option.value = species.Name;
        option.textContent = species.Name;
        dropdown.appendChild(option);
    });
}

export function populateSkillDropdown(excludeSkills) {
    const skillDropdown = document.createElement('select');
    skills.forEach(skill => {
        if (!skill.subSkill && !excludeSkills.includes(skill.name)) {
            const option = document.createElement('option');
            option.value = skill.name;
            option.textContent = skill.name;
            skillDropdown.appendChild(option);
        }
    });
    return skillDropdown;
}

export function populateLanguageDropdown(excludeLanguages) {
    const languageDropdown = document.createElement('select');
    const allLanguages = ["Universal", "Darkened Tongue", "Any Common"]; // Add all possible languages here
    allLanguages.forEach(language => {
        if (!excludeLanguages.includes(language)) {
            const option = document.createElement('option');
            option.value = language;
            option.textContent = language;
            languageDropdown.appendChild(option);
        }
    });
    return languageDropdown;
}

export function populateSizeDropdown(sizes) {
    const sizeDropdown = document.getElementById('sizeDropdown');
    sizeDropdown.innerHTML = '';
    sizes.forEach(size => {
        const option = document.createElement('option');
        option.value = size;
        option.textContent = size;
        sizeDropdown.appendChild(option);
    });
}

export function displaySpeciesDetails() {
    const speciesDropdown = document.getElementById('speciesDropdown');
    const selectedSpecies = species.find(s => s.Name === speciesDropdown.value);
    if (selectedSpecies) {
        document.getElementById('speciesName').textContent = selectedSpecies.Name;
        document.getElementById('averageHeight').textContent = selectedSpecies.AverageHeight;
        document.getElementById('averageWeight').textContent = selectedSpecies.AverageWeight;
        document.getElementById('speciesType').textContent = selectedSpecies.SpeciesType;
        document.getElementById('adulthood').textContent = selectedSpecies.Adulthood;
        document.getElementById('maxAge').textContent = selectedSpecies.MaxAge;

        populateSizeDropdown(selectedSpecies.Size);

        const skillsContainer = document.getElementById('skills');
        skillsContainer.innerHTML = '';
        selectedSpecies.Skills.forEach(skill => {
            if (skill === "Any") {
                const skillDropdown = populateSkillDropdown(selectedSpecies.Skills);
                skillsContainer.appendChild(skillDropdown);
            } else {
                const skillSpan = document.createElement('span');
                skillSpan.textContent = skill;
                skillsContainer.appendChild(skillSpan);
                skillsContainer.appendChild(document.createTextNode(', '));
            }
        });

        const languagesContainer = document.getElementById('languages');
        languagesContainer.innerHTML = '';
        selectedSpecies.Languages.forEach(language => {
            if (language === "Any") {
                const languageDropdown = populateLanguageDropdown(selectedSpecies.Languages);
                languagesContainer.appendChild(languageDropdown);
            } else {
                const languageSpan = document.createElement('span');
                languageSpan.textContent = language;
                languagesContainer.appendChild(languageSpan);
                languagesContainer.appendChild(document.createTextNode(', '));
            }
        });

        document.getElementById('speciesDescription').textContent = selectedSpecies.Description;
        document.getElementById('speciesDetails').style.display = 'block';

        populateSpeciesTraits(selectedSpecies);
        populateAncestryTraitDropdown(selectedSpecies);
        populateCharacteristicDropdown(selectedSpecies);
        populateFlawDropdown(selectedSpecies);
    } else {
        document.getElementById('speciesDetails').style.display = 'none';
    }

    document.getElementById('descriptionButton').addEventListener('click', () => {
        document.getElementById('descriptionModal').style.display = 'block';
    });

    document.getElementById('closeDescriptionButton').addEventListener('click', () => {
        document.getElementById('descriptionModal').style.display = 'none';
    });
}

export function toggleDescriptionModal() {
    const descriptionButton = document.getElementById('descriptionButton');
    const descriptionModal = document.getElementById('descriptionModal');
    if (descriptionModal.style.display === 'none') {
        descriptionModal.style.display = 'block';
        descriptionButton.classList.add('active');
    } else {
        descriptionModal.style.display = 'none';
        descriptionButton.classList.remove('active');
    }
}

export function toggleExpandableBox(event) {
    const summaryRow = event.currentTarget;
    const detailsRow = summaryRow.nextElementSibling;
    const expandArrow = summaryRow.querySelector('.expand-arrow');
    if (detailsRow.style.display === 'none') {
        detailsRow.style.display = 'block';
        expandArrow.textContent = '▲';
    } else {
        detailsRow.style.display = 'none';
        expandArrow.textContent = '▼';
    }
}

export function populateSpeciesTraits(species) {
    const speciesTraitsList = document.getElementById('speciesTraitsList');
    speciesTraitsList.innerHTML = '';
    species.SpeciesTraits.forEach(traitName => {
        const trait = geneticFeats.find(feat => feat.Name === traitName);
        if (trait) {
            const listItem = document.createElement('li');
            const expandableBox = document.createElement('div');
            expandableBox.classList.add('expandable-box');
            expandableBox.innerHTML = `
                <div class="summary-row">
                    <span>${trait.Name}</span>
                    <span class="expand-arrow">▼</span>
                </div>
                <div class="details-row" style="display: none;">
                    <p>${trait.Description}</p>
                </div>
            `;
            expandableBox.querySelector('.summary-row').addEventListener('click', toggleExpandableBox);
            listItem.appendChild(expandableBox);
            speciesTraitsList.appendChild(listItem);
        }
    });
}

export function updateTraitDescription(event) {
    const dropdown = event.currentTarget;
    const selectedTraitName = dropdown.value;
    const descriptionElement = dropdown.nextElementSibling;
    const trait = geneticFeats.find(feat => feat.Name === selectedTraitName);
    descriptionElement.textContent = trait ? trait.Description : '';
}

function getSelectedSpecies() {
    const selectedSpeciesName = document.getElementById('speciesDropdown').value;
    return species.find(species => species.Name === selectedSpeciesName);
}

export function populateAncestryTraitDropdown(species) {
    const ancestryTraitDropdown = document.getElementById('ancestryTraitDropdown');
    ancestryTraitDropdown.innerHTML = ''; // Clear existing options
    species.AncestryTraits.forEach(traitName => {
        const trait = geneticFeats.find(feat => feat.Name === traitName);
        if (trait) {
            const option = document.createElement('option');
            option.value = trait.Name;
            option.textContent = trait.Name;
            ancestryTraitDropdown.appendChild(option);
        }
    });

    // Populate additional ancestry trait dropdown with the same options
    const additionalAncestryTraitDropdown = document.getElementById('additionalAncestryTraitDropdown');
    additionalAncestryTraitDropdown.innerHTML = ancestryTraitDropdown.innerHTML;

    // Add event listener for additional ancestry trait dropdown
    additionalAncestryTraitDropdown.addEventListener('change', updateAdditionalAncestryTraitDescription);

    function updateAdditionalAncestryTraitDescription(event) {
        const dropdown = event.currentTarget;
        const selectedTraitName = dropdown.value;
        const descriptionElement = document.getElementById('additionalAncestryTraitDescription');
        const trait = geneticFeats.find(feat => feat.Name === selectedTraitName);
        descriptionElement.textContent = trait ? trait.Description : '';
        populateAncestryTraitDropdowns();
    }

    function populateAncestryTraitDropdowns() {
        const selectedTraits = [ancestryTraitDropdown.value, additionalAncestryTraitDropdown.value];
        [ancestryTraitDropdown, additionalAncestryTraitDropdown].forEach(dropdown => {
            const selectedTrait = dropdown.value;
            dropdown.innerHTML = '';
            species.AncestryTraits.forEach(traitName => {
                const trait = geneticFeats.find(feat => feat.Name === traitName);
                if (trait && (!selectedTrait || selectedTrait === trait.Name || !selectedTraits.includes(trait.Name))) {
                    const option = document.createElement('option');
                    option.value = trait.Name;
                    option.textContent = trait.Name;
                    option.selected = trait.Name === selectedTrait;
                    dropdown.appendChild(option);
                }
            });
        });
    }

    populateAncestryTraitDropdowns();
}

export function updateAdditionalAncestryTraitDescription(event) {
    const dropdown = event.currentTarget;
    const selectedTraitName = dropdown.value;
    const descriptionElement = document.getElementById('additionalAncestryTraitDescription');
    const trait = geneticFeats.find(feat => feat.Name === selectedTraitName);
    descriptionElement.textContent = trait ? trait.Description : '';
}

export function populateCharacteristicDropdown(species) {
    const characteristicDropdown = document.getElementById('characteristicDropdown');
    characteristicDropdown.innerHTML = '';
    species.Characteristics.forEach(characteristicName => {
        const characteristic = geneticFeats.find(feat => feat.Name === characteristicName);
        if (characteristic) {
            const option = document.createElement('option');
            option.value = characteristic.Name;
            option.textContent = characteristic.Name;
            characteristicDropdown.appendChild(option);
        }
    });
}

export function populateFlawDropdown(species) {
    const flawDropdown = document.getElementById('flawDropdown');
    flawDropdown.innerHTML = '<option value="">No Flaw</option>'; // Add "No Flaw" option
    species.Flaws.forEach(flawName => {
        const flaw = geneticFeats.find(feat => feat.Name === flawName);
        if (flaw) {
            const option = document.createElement('option');
            option.value = flaw.Name;
            option.textContent = flaw.Name;
            flawDropdown.appendChild(option);
        }
    });

    flawDropdown.addEventListener('change', function() {
        const selectedFlaw = flawDropdown.value;
        const additionalAncestryTraitBox = document.getElementById('additional-ancestry-trait-box');
        if (selectedFlaw && selectedFlaw !== 'No Flaw') {
            additionalAncestryTraitBox.style.display = 'block';
        } else {
            additionalAncestryTraitBox.style.display = 'none';
        }
    });
}

export function initializeAbilityDropdowns() {
    const abilityDropdowns = document.querySelectorAll('.ability-dropdown');
    abilityDropdowns.forEach(dropdown => {
        dropdown.addEventListener('change', updateAbilityDropdowns);
    });
}

function updateAbilityDropdowns() {
    const abilityDropdowns = document.querySelectorAll('.ability-dropdown');
    let total = 0;
    let negativeTotal = 0;

    abilityDropdowns.forEach(dropdown => {
        const value = parseInt(dropdown.value);
        if (!isNaN(value)) {
            total += value;
            if (value < 0) {
                negativeTotal += value;
            }
        }
    });

    const remainingPoints = 7 - total;
    document.getElementById('remaining-points').textContent = remainingPoints;

    abilityDropdowns.forEach(dropdown => {
        const selectedValue = parseInt(dropdown.value);
        const options = dropdown.querySelectorAll('option');
        options.forEach(option => {
            const optionValue = parseInt(option.value);
            if (isNaN(optionValue)) return;

            const newTotal = total - (isNaN(selectedValue) ? 0 : selectedValue) + optionValue;
            const newNegativeTotal = negativeTotal - (selectedValue < 0 ? selectedValue : 0) + (optionValue < 0 ? optionValue : 0);

            if (newTotal > 7 || newNegativeTotal < -3) {
                option.disabled = true;
            } else {
                option.disabled = false;
            }
        });
    });
}

function getSelectedArchetype() {
    const selectedButton = document.querySelector('.archetype-button.selected');
    if (selectedButton) {
        return selectedButton.getAttribute('onclick').split("'")[1];
    }
    return null;
}

export function initializeArchetypeFeats() {
    const archetypeFeatsList = document.getElementById('archetype-feats-list');
    archetypeFeatsList.innerHTML = ''; // Clear previous feats
    const archetype = getSelectedArchetype();
    let featCount = 0;

    if (archetype === 'martial') {
        featCount = 3;
    } else if (archetype === 'powered-martial') {
        featCount = 2;
    } else if (archetype === 'power') {
        featCount = 1;
    }

    const availableFeats = featsData
        .filter(feat => (!feat.Level || feat.Level === 1) && !feat.Name.match(/II|III|IV|V|VI/) && !feat.characterFeat)
        .sort((a, b) => a.Name.localeCompare(b.Name));

    for (let i = 0; i < featCount; i++) {
        const expandableBox = document.createElement('div');
        expandableBox.classList.add('expandable-box');
        expandableBox.innerHTML = `
            <div class="summary-row">
                <span>Choose an Archetype Feat</span>
                <span class="expand-arrow">▼</span>
            </div>
            <div class="details-row" style="display: none;">
                <select class="archetype-feat-dropdown" onchange="updateFeatDescription(this)"></select>
                <div class="feat-description"></div>
                <div class="feat-requirements"></div>
            </div>
        `;
        expandableBox.querySelector('.summary-row').addEventListener('click', toggleExpandableBox);
        archetypeFeatsList.appendChild(expandableBox);
    }

    const featDropdowns = document.querySelectorAll('.archetype-feat-dropdown');
    const featDescriptions = document.querySelectorAll('.feat-description');
    const featRequirements = document.querySelectorAll('.feat-requirements');

    function populateFeatDropdowns() {
        featDropdowns.forEach((dropdown, index) => {
            const selectedFeat = dropdown.value;
            dropdown.innerHTML = '<option value="">Select a feat</option>';
            availableFeats.forEach(feat => {
                if (!selectedFeat || selectedFeat === feat.Name || !Array.from(featDropdowns).some(d => d.value === feat.Name)) {
                    const option = document.createElement('option');
                    option.value = feat.Name;
                    option.textContent = feat.Name;
                    option.selected = feat.Name === selectedFeat;
                    dropdown.appendChild(option);
                }
            });
        });
    }

    featDropdowns.forEach((dropdown, index) => {
        dropdown.addEventListener('change', () => {
            const selectedFeat = featsData.find(feat => feat.Name === dropdown.value);
            featDescriptions[index].textContent = selectedFeat ? selectedFeat.Description : '';
            featRequirements[index].textContent = selectedFeat ? `Requires: ${selectedFeat.Requirements || 'None'}` : '';
            populateFeatDropdowns();
        });
    });

    populateFeatDropdowns();
}

export function updateFeatDescription(selectElement) {
    const selectedFeatName = selectElement.value;
    const descriptionElement = selectElement.nextElementSibling;
    const requirementsElement = descriptionElement.nextElementSibling;
    const feat = featsData.find(feat => feat.Name === selectedFeatName);
    if (feat) {
        descriptionElement.textContent = feat.Description;
        requirementsElement.textContent = `Requires: ${feat.Requirements || 'None'}`;
    } else {
        descriptionElement.textContent = '';
        requirementsElement.textContent = '';
    }
}

export function initializeSkillSelection() {
    const skillBoxesContainer = document.getElementById('skill-boxes');
    const speciesSkillsContainer = document.getElementById('species-skills');
    skillBoxesContainer.innerHTML = ''; // Clear existing skill boxes
    speciesSkillsContainer.innerHTML = ''; // Clear existing species skills
    const selectedSkills = [];

    // Example: Pre-select skills for a chosen species
    const chosenSpeciesSkills = ['Acrobatics', 'Animal Handling']; // Replace with actual species skills
    speciesSkillsContainer.textContent = `Species Skills: ${chosenSpeciesSkills.join(', ')} Proficiency`;

    // Create skill boxes
    for (let i = 0; i < 3; i++) {
        const skillBox = document.createElement('div');
        skillBox.classList.add('expandable-box');
        skillBox.innerHTML = `
            <div class="summary-row">
                <span>Choose a Skill</span>
                <span class="expand-arrow">▼</span>
            </div>
            <div class="details-row" style="display: none;">
                <select class="skill-dropdown"></select>
                <div class="skill-description"></div>
            </div>
        `;
        skillBox.querySelector('.summary-row').addEventListener('click', toggleExpandableBox);
        skillBoxesContainer.appendChild(skillBox);
    }

    const skillDropdowns = document.querySelectorAll('.skill-dropdown');
    const skillDescriptions = document.querySelectorAll('.skill-description');

    // Populate skill dropdowns
    function populateSkillDropdowns() {
        skillDropdowns.forEach((dropdown, index) => {
            const selectedSkill = dropdown.value;
            dropdown.innerHTML = '';
            skills.forEach(skill => {
                if ((!skill.subSkill || selectedSkills.includes(skill.baseSkill)) && !selectedSkills.includes(skill.name)) {
                    const option = document.createElement('option');
                    option.value = skill.name;
                    option.textContent = skill.name;
                    option.selected = skill.name === selectedSkill;
                    dropdown.appendChild(option);
                }
            });
        });
    }

    skillDropdowns.forEach((dropdown, index) => {
        dropdown.addEventListener('change', () => {
            const selectedSkill = skills.find(skill => skill.name === dropdown.value);
            skillDescriptions[index].textContent = selectedSkill ? selectedSkill.description : '';
            selectedSkills[index] = dropdown.value;
            populateSkillDropdowns();
        });
    });

    populateSkillDropdowns();
}

document.addEventListener('DOMContentLoaded', async function() {
    initializeTabs();
    initializeAbilityButtons();
    initializeAbilityDropdowns();
    populateSpeciesDropdown();
    document.getElementById('speciesDropdown').addEventListener('change', displaySpeciesDetails);
    document.querySelectorAll('.expandable-box .summary-row').forEach(row => {
        row.addEventListener('click', toggleExpandableBox);
    });
    document.getElementById('ancestryTraitDropdown').addEventListener('change', updateTraitDescription);
    document.getElementById('characteristicDropdown').addEventListener('change', updateTraitDescription);
    document.getElementById('flawDropdown').addEventListener('change', updateTraitDescription);
    document.getElementById('descriptionButton').addEventListener('click', toggleDescriptionModal);
    initializeArchetypeFeats();
    initializeSkillSelection();
});
