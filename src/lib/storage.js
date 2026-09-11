// Lightweight storage shim.
//
// Inside Claude, artifacts get a `window.storage` object backed by Anthropic's
// servers (works across devices/sessions). Outside Claude there's no such
// service, so this mirrors the same get/set/delete/list API using the
// browser's localStorage instead. Data stays on the device it was entered on.
//
// If you later add a real backend (Supabase, Firebase, your own API), you can
// swap the implementation below without touching any of the app code that
// calls `storage.get/set/delete/list`.

const PREFIX = "stocked-beauty:";

function readRaw(key) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeRaw(key, value) {
  window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

const storage = {
  async get(key) {
    const value = readRaw(key);
    if (value === null) return null;
    return { key, value, shared: false };
  },

  async set(key, value) {
    writeRaw(key, value);
    return { key, value, shared: false };
  },

  async delete(key) {
    window.localStorage.removeItem(PREFIX + key);
    return { key, deleted: true, shared: false };
  },

  async list(prefix = "") {
    const keys = Object.keys(window.localStorage)
      .filter((k) => k.startsWith(PREFIX + prefix))
      .map((k) => k.slice(PREFIX.length));
    return { keys, prefix, shared: false };
  },
};

export default storage;
