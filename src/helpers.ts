export function emitAvatarEvent(name: string, detail: {}) {
  window.dispatchEvent(new CustomEvent("avatar-" + name, { detail }));
}
