// Termékek tárolása
function getItems() {
  return JSON.parse(localStorage.getItem("items") || "[]");
}

function saveItems(items) {
  localStorage.setItem("items", JSON.stringify(items));
}

// Bevásárlólista tárolása
function getShopping() {
  return JSON.parse(localStorage.getItem("shopping") || "[]");
}

function saveShopping(list) {
  localStorage.setItem("shopping", JSON.stringify(list));
}

// Felhasználók kezelése (demo / regisztráció)
function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "[]");
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

// Felhasználó prémium státusza
function getPremiumStatus(username) {
  let users = getUsers();
  let user = users.find(u => u.username === username);
  return user ? user.premium || "demo" : "demo"; // "demo", "premium", "premiumPro"
}

// Felhasználó családtagok
function getFamily(username) {
  let users = getUsers();
  let user = users.find(u => u.username === username);
  return user ? user.family || [] : [];
}

function addFamilyMember(username, familyUsername) {
  let users = getUsers();
  let user = users.find(u => u.username === username);
  if (user) {
    if (!user.family) user.family = [];
    if (!user.family.includes(familyUsername)) user.family.push(familyUsername);
  }
  saveUsers(users);
}

// Példa fizetés logika (még csak jelzés szinten)
function upgradeToPremium(username) {
  let users = getUsers();
  let user = users.find(u => u.username === username);
  if (user) {
    user.premium = "premium";
  }
  saveUsers(users);
}

function upgradeToPremiumPro(username) {
  let users = getUsers();
  let user = users.find(u => u.username === username);
  if (user) {
    user.premium = "premiumPro";
  }
  saveUsers(users);
}
