import { formatPowerDamage } from '../../power_calc.js';
import { createFeatsContent } from './library/feats.js';
import { createTechniquesContent } from './library/techniques.js';
import { createPowersContent } from './library/powers.js';
import { createInventoryContent } from './library/inventory.js';
import { createProficienciesContent } from './library/proficiencies.js';
import { createNotesContent } from './library/notes.js';

export async function renderLibrary(charData) {
    const container = document.getElementById('library-section');
    container.innerHTML = '';
    
    const tabs = document.createElement('div');
    tabs.className = 'tabs';
    tabs.innerHTML = `
        <button class="tab active" data-tab="feats">FEATS</button>
        <button class="tab" data-tab="techniques">TECHNIQUES</button>
        <button class="tab" data-tab="powers">POWERS</button>
        <button class="tab" data-tab="inventory">INVENTORY</button>
        <button class="tab" data-tab="proficiencies">PROFICIENCIES</button>
        <button class="tab" data-tab="notes">NOTES</button>
    `;
    
    container.appendChild(tabs);
    
    // Tab contents
    const featsContent = createFeatsContent(charData.feats || []);
    const techniquesContent = createTechniquesContent(charData.techniques || []);
    const powersContent = createPowersContent(charData.powers || []);
    const inventoryContent = createInventoryContent(charData.equipment || []);
    const proficienciesContent = await createProficienciesContent(charData);
    const notesContent = createNotesContent(charData.notes || '');
    
    container.appendChild(featsContent);
    container.appendChild(techniquesContent);
    container.appendChild(powersContent);
    container.appendChild(inventoryContent);
    container.appendChild(proficienciesContent);
    container.appendChild(notesContent);

    // --- Insert currency box above weapons section when inventory tab is active ---
    function showCurrencyBoxIfNeeded() {
        // Remove any existing currency box
        document.querySelectorAll('.inventory-currency-box').forEach(el => el.remove());
        // Only show if inventory tab is active
        if (inventoryContent.classList.contains('active') && inventoryContent._currencyBox) {
            // Insert at the top of inventoryContent
            inventoryContent.insertBefore(inventoryContent._currencyBox, inventoryContent.firstChild);
        }
    }
    
    // Tab switching
    const tabButtons = tabs.querySelectorAll('.tab');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const targetTab = button.dataset.tab;
            container.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                if (content.id === `${targetTab}-content`) {
                    content.classList.add('active');
                }
            });
            showCurrencyBoxIfNeeded();
        });
    });

    // Show currency box on initial render if inventory is active
    showCurrencyBoxIfNeeded();
}

// Shared helper (if needed elsewhere)
export function sanitizeId(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '_');
}
