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

async function saveItems(items) {
  writeJson(STORAGE_KEYS.ITEMS, items);

  if (typeof saveItemsCloud === "function") {
    try {
      await saveItemsCloud(items);
    } catch (error) {
      console.error("Cloud mentési hiba:", error);
    }
  }
}

function getShopping() {
  return readJson(STORAGE_KEYS.SHOPPING, []);
}

async function saveShopping(list) {
  writeJson(STORAGE_KEYS.SHOPPING, list);

  if (typeof saveShoppingCloud === "function") {
    try {
      await saveShoppingCloud(list);
    } catch (error) {
      console.error("Cloud bevásárlólista mentési hiba:", error);
    }
  }
}

async function loadItemsWithCloudFallback() {
  const localItems = getItems();

  if (typeof loadItemsCloud === "function") {
    try {
      const cloudItems = await loadItemsCloud();

      if (Array.isArray(cloudItems) && cloudItems.length > 0) {
        writeJson(STORAGE_KEYS.ITEMS, cloudItems);
        return cloudItems;
      }
    } catch (error) {
      console.error("Cloud betöltési hiba:", error);
    }
  }

  return localItems;
}

async function loadShoppingWithCloudFallback() {
  const localShopping = getShopping();

  if (typeof loadShoppingCloud === "function") {
    try {
      const cloudShopping = await loadShoppingCloud();

      if (Array.isArray(cloudShopping) && cloudShopping.length > 0) {
        writeJson(STORAGE_KEYS.SHOPPING, cloudShopping);
        return cloudShopping;
      }
    } catch (error) {
      console.error("Cloud bevásárlólista betöltési hiba:", error);
    }
  }

  return localShopping;
}
