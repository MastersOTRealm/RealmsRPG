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
