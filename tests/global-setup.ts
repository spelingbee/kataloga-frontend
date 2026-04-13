// Global setup: runs in the main process before any test workers start.
// We patch globalThis.localStorage here so that @vue/devtools-kit (which
// calls localStorage.getItem at module-init time inside workers) doesn't crash.
export function setup() {
  // nothing needed in main process
}
