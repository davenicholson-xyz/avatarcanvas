export function emitEvent(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
}
//# sourceMappingURL=helpers.js.map