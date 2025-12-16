export function createNotesContent(charData) {
    const content = document.createElement('div');
    content.id = 'notes-content';
    content.className = 'tab-content';
    
    const appearance = charData?.appearance || '';
    const archetypeDesc = charData?.archetypeDesc || '';
    const notes = charData?.notes || '';
    
    content.innerHTML = `
        <div class="notes-section">
            <label class="notes-label">APPEARANCE</label>
            <textarea id="character-appearance" class="notes-textarea" placeholder="Describe your character's appearance...">${appearance}</textarea>
        </div>
        <div class="notes-section">
            <label class="notes-label">ARCHETYPE DESCRIPTION</label>
            <textarea id="character-archetype-desc" class="notes-textarea" placeholder="Describe your character's archetype background...">${archetypeDesc}</textarea>
        </div>
        <div class="notes-section">
            <label class="notes-label">NOTES</label>
            <textarea id="character-notes" class="notes-textarea notes-main" placeholder="Additional notes, backstory, goals...">${notes}</textarea>
        </div>
    `;
    
    // Setup autosave on blur (tab change) and on Enter for single-line feel
    setTimeout(() => {
        const appearanceEl = document.getElementById('character-appearance');
        const archetypeDescEl = document.getElementById('character-archetype-desc');
        const notesEl = document.getElementById('character-notes');
        
        const saveField = (field, value) => {
            const charData = typeof window.currentCharacterData === 'function' 
                ? window.currentCharacterData() 
                : window.currentCharacterData;
            if (!charData) return;
            charData[field] = value;
            if (window.scheduleAutoSave) window.scheduleAutoSave();
        };
        
        if (appearanceEl) {
            appearanceEl.addEventListener('blur', () => saveField('appearance', appearanceEl.value));
            appearanceEl.addEventListener('keydown', e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveField('appearance', appearanceEl.value);
                    appearanceEl.blur();
                }
            });
        }
        
        if (archetypeDescEl) {
            archetypeDescEl.addEventListener('blur', () => saveField('archetypeDesc', archetypeDescEl.value));
            archetypeDescEl.addEventListener('keydown', e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveField('archetypeDesc', archetypeDescEl.value);
                    archetypeDescEl.blur();
                }
            });
        }
        
        if (notesEl) {
            notesEl.addEventListener('blur', () => saveField('notes', notesEl.value));
            // Notes can be multi-line, so only save on blur, not Enter
        }
    }, 0);
    
    return content;
}
