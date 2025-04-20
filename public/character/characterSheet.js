let logVisible = false;

        function toggleLog() {
            const rollLog = document.getElementById('rollLog');
            const arrow = document.querySelector('.arrow');
            logVisible = !logVisible;
            rollLog.classList.toggle('visible', logVisible);
            arrow.textContent = logVisible ? '↓' : '↑';
        }

        function addToLog(entry) {
            const logEntries = document.getElementById('logEntries');
            const entryElement = document.createElement('p');
            entryElement.textContent = entry;
            logEntries.appendChild(entryElement);
            logEntries.scrollTop = logEntries.scrollHeight;
        }

        function rollAbility(ability, modifier) {
            const roll = Math.floor(Math.random() * 20) + 1;
            const total = roll + modifier;
            const logEntry = `${ability} d20: ${roll} + ${modifier} = ${total}`;
            addToLog(logEntry);
        }

        function rollDefense(defense, modifier) {
            const roll = Math.floor(Math.random() * 20) + 1;
            const total = roll + modifier;
            const logEntry = `${defense} d20: ${roll} + ${modifier} = ${total}`;
            addToLog(logEntry);
        }

        function rollSkill(skill, bonus) {
            const roll = Math.floor(Math.random() * 20) + 1;
            const total = roll + bonus;
            const logEntry = `${skill} d20: ${roll} + ${bonus} = ${total}`;
            addToLog(logEntry);
        }

        function rollDamage(weapon, die, damageType) {
            const roll = Math.floor(Math.random() * die) + 1;
            const logEntry = `${weapon} 1d${die} ${damageType}: ${roll}`;
            addToLog(logEntry);
        }

        function rollBonus(bonusType, modifier) {
            const roll = Math.floor(Math.random() * 20) + 1;
            const total = roll + modifier;
            const logEntry = `${bonusType} d20: ${roll} + ${modifier} = ${total}`;
            addToLog(logEntry);
        }

        function useEnergy(cost) {
            const currentEnergyInput = document.getElementById('currentEnergy');
            const currentEnergy = parseInt(currentEnergyInput.value);
            if (currentEnergy - cost >= 0) {
                currentEnergyInput.value = currentEnergy - cost;
            }
        }

        function changeUses(featId, change, max) {
            const usesElement = document.getElementById(featId);
            let currentUses = parseInt(usesElement.textContent);
            currentUses = Math.max(0, Math.min(max, currentUses + change));
            usesElement.textContent = currentUses;
        }

        function openTab(tabName) {
            const tabs = document.getElementsByClassName('tab-content');
            for (let i = 0; i < tabs.length; i++) {
                tabs[i].classList.remove('active');
            }
            const buttons = document.getElementsByClassName('tab-button');
            for (let i = 0; i < buttons.length; i++) {
                buttons[i].classList.remove('active');
            }
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
        }

export {
    toggleLog,
    addToLog,
    rollAbility,
    rollDefense,
    rollSkill,
    rollDamage,
    rollBonus,
    useEnergy,
    changeUses,
    openTab
};