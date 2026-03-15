const STORAGE_KEYS = {
  USERS: "saveit_users_v2",
  CURRENT_USER: "saveit_current_user_v2",
  ITEMS: "saveit_items_v2",
  SHOPPING: "saveit_shopping_v2"
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUsers() {
  const users = readJson(STORAGE_KEYS.USERS, {});
  if (!users["Erika"]) {
    users["Erika"] = {
      username: "Erika",
      password: "Erika",
      email: "admin@saveit.local",
      plan: "premiumPro",
      family: [],
      isAdmin: true
    };
    writeJson(STORAGE_KEYS.USERS, users);
  }
  return users;
}

function saveUsers(users) {
  writeJson(STORAGE_KEYS.USERS, users);
}

function getCurrentUser() {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
}

function setCurrentUser(username) {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, username);
}

function clearCurrentUser() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

function getItems() {
  return readJson(STORAGE_KEYS.ITEMS, []);
}

function saveItems(items) {
  writeJson(STORAGE_KEYS.ITEMS, items);
}

function getShopping() {
  return readJson(STORAGE_KEYS.SHOPPING, []);
}

function saveShopping(list) {
  writeJson(STORAGE_KEYS.SHOPPING, list);
}
