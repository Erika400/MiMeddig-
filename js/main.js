let wasteChartInstance = null;
let selectedItemId = null;

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

  if (viewId === "shoppingView") renderShopping();
  if (viewId === "statsView") calculateStats();
  if (viewId === "adminView") renderAdmin();
}

function getCurrentPlan() {
  const currentUser = getCurrentUser();
  const users = getUsers();
  if (!currentUser || !users[currentUser]) return "demo";
  return users[currentUser].plan || "demo";
}

function canAddMoreItems() {
  const plan = getCurrentPlan();
  const items = getItems();

  if (plan === "demo" && items.length >= 10) {
    alert("A demo verzióban maximum 10 termék lehet.");
    return false;
  }

  return true;
}

function openAddItemModal() {
  document.getElementById("addItemModal").style.display = "flex";
}

function closeAddItemModal() {
  document.getElementById("addItemModal").style.display = "none";

  document.getElementById("itemName").value = "";
  document.getElementById("itemBarcode").value = "";
  document.getElementById("itemQuantity").value = "";
  document.getElementById("itemUnit").value = "db";
  document.getElementById("itemPrice").value = "";
  document.getElementById("itemExpiry").value = "";
  document.getElementById("itemLocation").value = "fridge";
  document.getElementById("itemToShopping").checked = false;
}

function saveNewItem() {
  if (!canAddMoreItems()) return;

  const name = document.getElementById("itemName").value.trim();
  const barcode = document.getElementById("itemBarcode").value.trim();
  const quantity = parseFloat(document.getElementById("itemQuantity").value);
  const unit = document.getElementById("itemUnit").value;
  const price = parseFloat(document.getElementById("itemPrice").value) || 0;
  const expiryDate = document.getElementById("itemExpiry").value;
  const location = document.getElementById("itemLocation").value;
  const toShopping = document.getElementById("itemToShopping").checked;

  if (!name) {
    alert("Adj meg terméknevet.");
    return;
  }

  const items = getItems();

  items.push({
    id: Date.now().toString(),
    name,
    barcode,
    location,
    quantity: isNaN(quantity) ? 1 : quantity,
    unit,
    price,
    expiryDate,
    status: "active",
    wastedQuantity: 0,
    consumedQuantity: 0,
    wasteDate: null,
    toShopping
  });

  saveItems(items);

  if (toShopping) {
    const shopping = getShopping();
    shopping.push(name);
    saveShopping(shopping);
  }

  closeAddItemModal();
  renderMap();
  renderShopping();
  calculateStats();
}

function renderMap() {
  const items = getItems();
  const places = ["fridge", "freezer", "pantry", "bath", "meds", "cosmetics"];

  places.forEach(place => {
    const container = document.querySelector(`#${place} .place-items`);
    if (!container) return;

    container.innerHTML = "";

    items
      .filter(item => item.location === place && item.status === "active")
      .forEach(item => {
        const div = document.createElement("div");
        div.className = "item";
        div.textContent = `${item.name} (${item.quantity} ${item.unit})`;
        div.onclick = () => showItemActions(item.id);
        container.appendChild(div);
      });
  });
}

function renderShopping() {
  const list = getShopping();
  const box = document.getElementById("shoppingList");
  if (!box) return;

  box.innerHTML = "";

  list.forEach((item, index) => {
    const div = document.createElement("div");
    div.innerHTML = `
      ${item}
      <button style="float:right;" onclick="removeShoppingItem(${index})">Törlés</button>
    `;
    box.appendChild(div);
  });
}

function removeShoppingItem(index) {
  const shopping = getShopping();
  shopping.splice(index, 1);
  saveShopping(shopping);
  renderShopping();
}

function renderAdmin() {
  const currentUser = getCurrentUser();
  const users = getUsers();
  const box = document.getElementById("adminUsersList");

  if (!box) return;

  if (!currentUser || !users[currentUser] || !users[currentUser].isAdmin) {
    box.innerHTML = "Ehhez nincs jogosultságod.";
    return;
  }

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

function showItemActions(itemId) {
  selectedItemId = itemId;

  const item = getItems().find(i => i.id === itemId);
  if (!item) return;

  const message =
    `${item.name}\n` +
    `Mennyiség: ${item.quantity} ${item.unit}\n` +
    `Ár: ${item.price} Ft\n` +
    `Lejárat: ${item.expiryDate || "-"}\n\n` +
    `1 = Elfogyasztva\n` +
    `2 = Kidobva\n` +
    `3 = Bevásárlólistára\n` +
    `4 = Törlés`;

  const action = prompt(message);

  if (action === "1") consumeItem(itemId);
  if (action === "2") wasteItem(itemId);
  if (action === "3") addItemToShopping(itemId);
  if (action === "4") deleteItem(itemId);
}

function consumeItem(itemId) {
  const items = getItems();
  const item = items.find(i => i.id === itemId);
  if (!item) return;

  const amount = parseFloat(prompt(`Mennyit fogyasztottál el? (${item.quantity} ${item.unit} van most)`, item.quantity));
  if (isNaN(amount) || amount <= 0) return;

  item.consumedQuantity += amount;
  item.quantity -= amount;

  if (item.quantity <= 0) {
    item.quantity = 0;
    item.status = "consumed";
  }

  saveItems(items);
  renderMap();
  calculateStats();
}

function wasteItem(itemId) {
  const items = getItems();
  const item = items.find(i => i.id === itemId);
  if (!item) return;

  const amount = parseFloat(prompt(`Mennyit dobtál ki? (${item.quantity} ${item.unit} van most)`, item.quantity));
  if (isNaN(amount) || amount <= 0) return;

  item.wastedQuantity += amount;
  item.quantity -= amount;
  item.wasteDate = new Date().toISOString();

  if (item.quantity <= 0) {
    item.quantity = 0;
    item.status = "wasted";
  }

  saveItems(items);
  renderMap();
  calculateStats();
}

function addItemToShopping(itemId) {
  const items = getItems();
  const item = items.find(i => i.id === itemId);
  if (!item) return;

  const shopping = getShopping();
  shopping.push(item.name);
  saveShopping(shopping);
  renderShopping();
}

function deleteItem(itemId) {
  let items = getItems();
  items = items.filter(i => i.id !== itemId);
  saveItems(items);
  renderMap();
  calculateStats();
}

function calculateStats() {
  const items = getItems();

  let weeklyWaste = 0;
  let monthlyWaste = 0;

  const now = new Date();

  items.forEach(item => {
    if (!item.wasteDate || !item.wastedQuantity) return;

    const wasteDate = new Date(item.wasteDate);
    const diffDays = (now - wasteDate) / (1000 * 60 * 60 * 24);

    let wastedValue = 0;
    const originalQuantity = item.wastedQuantity + item.quantity;

    if (originalQuantity > 0) {
      wastedValue = (item.wastedQuantity / originalQuantity) * item.price;
    }

    if (diffDays <= 7) weeklyWaste += wastedValue;
    if (diffDays <= 30) monthlyWaste += wastedValue;
  });

  const weeklyEl = document.getElementById("weeklyWasteValue");
  const monthlyEl = document.getElementById("monthlyWasteValue");

  if (weeklyEl) weeklyEl.textContent = Math.round(weeklyWaste);
  if (monthlyEl) monthlyEl.textContent = Math.round(monthlyWaste);

  renderWasteChart(Math.round(weeklyWaste), Math.round(monthlyWaste));
}

function renderWasteChart(weeklyWaste, monthlyWaste) {
  const canvas = document.getElementById("wasteChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (wasteChartInstance) {
    wasteChartInstance.destroy();
  }

  wasteChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Heti pazarlás", "Havi pazarlás"],
      datasets: [{
        label: "Ft",
        data: [weeklyWaste, monthlyWaste]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}
