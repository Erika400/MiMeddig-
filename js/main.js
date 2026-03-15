function initializeApp() {
  renderMap();
  renderShopping();
  renderAdmin();
  calculateStats();
}

function showView(viewId) {
  const views = ["mapView", "shoppingView", "statsView", "adminView"];
  views.forEach(v => {
    const el = document.getElementById(v);
    if (el) el.style.display = "none";
  });
  const target = document.getElementById(viewId);
  if (target) target.style.display = "block";
}

function renderMap() {
  const items = getItems();
  const places = ["fridge", "freezer", "pantry", "bath", "meds", "cosmetics"];

  places.forEach(place => {
    const container = document.querySelector(`#${place} .place-items`);
    if (!container) return;
    container.innerHTML = "";

    items
      .filter(item => item.location === place)
      .forEach(item => {
        const div = document.createElement("div");
        div.className = "item";
        div.textContent = item.name;
        container.appendChild(div);
      });
  });
}

function renderShopping() {
  const list = getShopping();
  const box = document.getElementById("shoppingList");
  if (!box) return;

  box.innerHTML = "";
  list.forEach(item => {
    const div = document.createElement("div");
    div.textContent = item;
    box.appendChild(div);
  });
}

function renderAdmin() {
  const users = getUsers();
  const box = document.getElementById("adminUsersList");
  if (!box) return;

  box.innerHTML = "";

  Object.keys(users).forEach(username => {
    const user = users[username];
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${username}</strong><br>
      Email: ${user.email || "-"}<br>
      Plan: ${user.plan || "demo"}
    `;
    box.appendChild(div);
  });
}

function calculateStats() {
  const items = getItems();
  let weeklyWaste = 0;
  let monthlyWaste = 0;
  const now = new Date();

  items.forEach(item => {
    if (!item.wasteDate) return;

    const wasteDate = new Date(item.wasteDate);
    const diffDays = (now - wasteDate) / (1000 * 60 * 60 * 24);
    const price = item.price || 0;

    if (diffDays <= 7) weeklyWaste += price;
    if (diffDays <= 30) monthlyWaste += price;
  });

  const weeklyEl = document.getElementById("weeklyWasteValue");
  const monthlyEl = document.getElementById("monthlyWasteValue");

  if (weeklyEl) weeklyEl.textContent = weeklyWaste;
  if (monthlyEl) monthlyEl.textContent = monthlyWaste;
}
