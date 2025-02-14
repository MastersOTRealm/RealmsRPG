import species from './speciesData.js';
import skills from './skillsData.js';

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
}

export function populateSpeciesDropdown() {
    const dropdown = document.getElementById('speciesDropdown');
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
    const selectedSpeciesName = document.getElementById('speciesDropdown').value;
    const selectedSpecies = species.find(species => species.Name === selectedSpeciesName);
    if (selectedSpecies) {
        document.getElementById('speciesName').textContent = selectedSpecies.Name;
        document.getElementById('averageHeight').textContent = selectedSpecies.AverageHeight;
        document.getElementById('averageWeight').textContent = selectedSpecies.AverageWeight;
        document.getElementById('speciesType').textContent = selectedSpecies.SpeciesType;
        populateSizeDropdown(selectedSpecies.Size);

        const skillsContainer = document.getElementById('skills');
        skillsContainer.innerHTML = '';
        selectedSpecies.Skills.forEach(skill => {
            if (skill === "Any") {
                skillsContainer.appendChild(populateSkillDropdown(selectedSpecies.Skills));
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
                languagesContainer.appendChild(populateLanguageDropdown(selectedSpecies.Languages));
            } else {
                const languageSpan = document.createElement('span');
                languageSpan.textContent = language;
                languagesContainer.appendChild(languageSpan);
                languagesContainer.appendChild(document.createTextNode(', '));
            }
        });

        document.getElementById('adulthood').textContent = selectedSpecies.Adulthood;
        document.getElementById('maxAge').textContent = selectedSpecies.MaxAge;
        document.getElementById('speciesDescription').textContent = selectedSpecies.Description;
        document.getElementById('speciesDetails').style.display = 'block';
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
