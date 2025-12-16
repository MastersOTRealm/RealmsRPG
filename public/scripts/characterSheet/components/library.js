import { createFeatsContent } from './library/feats.js';
import { createTechniquesContent } from './library/techniques.js';
import { createPowersContent } from './library/powers.js';
import { createInventoryContent } from './library/inventory.js';
import { createProficienciesContent } from './library/proficiencies.js';
import { createNotesContent } from './library/notes.js';
import { sanitizeId } from '../utils.js';
import { enrichCharacterData } from '../utils/data-enrichment.js';

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

    // Get user ID for enrichment
    const user = window.firebase?.auth?.()?.currentUser;
    const userId = user?.uid;

    // Use centralized data enrichment (will use cached data if already enriched)
    const enriched = charData._displayFeats ? charData : await enrichCharacterData(charData, userId);

    // Use _displayFeats if present, otherwise fallback to feats
    const featsContent = createFeatsContent(enriched._displayFeats || enriched.feats || [], enriched);
    const techniquesContent = createTechniquesContent(enriched._techniques || []);
    const powersContent = createPowersContent(enriched._powers || []);
    // Pass enriched inventory object with weapons, armor, equipment arrays
    const inventoryContent = createInventoryContent(enriched._inventory || {});
    const proficienciesContent = await createProficienciesContent(enriched);
    // Pass full enriched data for notes (includes appearance, archetypeDesc, notes)
    const notesContent = createNotesContent(enriched);

    container.appendChild(featsContent);
    container.appendChild(techniquesContent);
    container.appendChild(powersContent);
    container.appendChild(inventoryContent);
    container.appendChild(proficienciesContent);
    container.appendChild(notesContent);

    // --- Insert currency box above weapons section when inventory tab is active ---
    function showCurrencyBoxIfNeeded() {
        document.querySelectorAll('.inventory-currency-box').forEach(el => el.remove());
        if (inventoryContent.classList.contains('active') && inventoryContent._currencyBox) {
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

    showCurrencyBoxIfNeeded();
}
