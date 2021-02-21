export function emitEvent(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail: detail }));
}
//# sourceMappingURL=helpers.js.map