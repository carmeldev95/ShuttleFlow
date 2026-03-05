const LS_KEYS = {
  users: "sf_users",
  session: "sf_session",
  registrations: "sf_registrations",
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const mockDb = {
  LS_KEYS,
  read,
  write,
};