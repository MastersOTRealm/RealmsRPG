export function createNotesContent(notes) {
    const content = document.createElement('div');
    content.id = 'notes-content';
    content.className = 'tab-content';
    
    content.innerHTML = `
        <textarea id="character-notes" style="width:100%;min-height:300px;padding:12px;border:1px solid var(--border-color);border-radius:8px;font-family:inherit;font-size:14px;resize:vertical;">${notes}</textarea>
        <button class="bonus-button" style="margin-top:12px;" onclick="saveNotes()">Save Notes</button>
    `;
    
    return content;
}
