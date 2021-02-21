export function emitEvent(name: string, detail: {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}
