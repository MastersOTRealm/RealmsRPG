function sanitizeId(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '_');
}

export function createFeatsContent(feats) {
    const content = document.createElement('div');
    content.id = 'feats-content';
    content.className = 'tab-content active';
    if (!feats.length) {
        content.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px;">No feats selected</p>';
        return content;
    }
    // Header
    const header = document.createElement('div');
    header.className = 'library-table-header';
    header.innerHTML = '<div>NAME</div><div>DESCRIPTION</div><div>USES</div>';
    content.appendChild(header);

    // Build collapsible rows
    feats.forEach(f => {
        const wrapper = document.createElement('div');
        wrapper.className = 'collapsible-feat';
        const truncatedDesc = (f.description || 'No description').split(/\s+/).slice(0,14).join(' ') + '...';

        // Uses cell (collapsed)
        const usesActive = f.uses ? `
            <div class="uses-cell">
                <button class="use-button" data-dir="-1">-</button>
                <span id="uses-${sanitizeId(f.name)}">${f.currentUses ?? f.uses}</span>/<span>${f.uses}</span>
                <button class="use-button" data-dir="1">+</button>
            </div>` : '<div style="text-align:right;font-size:11px;color:var(--text-secondary);">—</div>';

        wrapper.innerHTML = `
            <div class="collapsed-row">
                <div>
                  <strong>${f.name}</strong>
                  <span class="expand-indicator">▼</span><br>
                  <span style="font-size:10px;color:var(--text-secondary);">${f.category ? f.category.toUpperCase() : ''}</span>
                </div>
                <div class="truncated">${truncatedDesc}</div>
                ${usesActive}
            </div>
            <div class="expanded-body">
                <p style="margin:0 0 10px 0;">${f.description || 'No description available.'}</p>
                ${f.uses ? `
                    <div style="margin:6px 0 10px;font-size:12px;">
                        <strong>Recovery:</strong> ${f.recovery || 'Full Recovery'}<br>
                        <strong>Uses:</strong> <span id="exp-uses-${sanitizeId(f.name)}">${f.currentUses ?? f.uses}</span> / ${f.uses}
                    </div>` : ''
                }
            </div>
        `;
        // Toggle handler
        wrapper.querySelector('.collapsed-row').addEventListener('click', (e) => {
            // Ignore clicks on use buttons
            if (e.target.classList.contains('use-button')) return;
            wrapper.classList.toggle('open');
            const ind = wrapper.querySelector('.expand-indicator');
            if (ind) ind.textContent = wrapper.classList.contains('open') ? '▲' : '▼';
        });
        // Use buttons
        if (f.uses) {
            wrapper.querySelectorAll('.use-button').forEach(btn => {
                btn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    const dir = parseInt(btn.dataset.dir);
                    changeFeatUses(f.name, dir);
                    // Sync expanded display if open
                    const expSpan = wrapper.querySelector(`#exp-uses-${sanitizeId(f.name)}`);
                    const baseSpan = wrapper.querySelector(`#uses-${sanitizeId(f.name)}`);
                    if (expSpan && baseSpan) expSpan.textContent = baseSpan.textContent;
                });
            });
        }
        content.appendChild(wrapper);
    });

    return content;
}
