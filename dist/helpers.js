export function emitAvatarEvent(name, detail) {
    window.dispatchEvent(new CustomEvent("avatar-" + name, { detail: detail }));
}
//# sourceMappingURL=helpers.js.map