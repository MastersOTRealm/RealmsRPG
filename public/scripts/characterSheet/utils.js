export function formatBonus(value) {
    return value >= 0 ? `+${value}` : `${value}`;
}

export function createElement(tag, className, content) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (content) el.innerHTML = content;
    return el;
}

export function clearElement(el) {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
}
