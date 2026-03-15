/* =========================================================
   Save It – Before You Waste It
   TELJES js/main.js cserefájl
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     KONFIG
     ========================================================= */

  const STORAGE_KEYS = {
    products: "products",
    shoppingList: "shoppingList",
    currentUser: "currentUser",
    users: "users"
  };

  const LOCATION_ALIASES = {
    "Hűtő": "Hűtő",
    "Huto": "Hűtő",
    "Fridge": "Hűtő",

    "Fagyasztó": "Fagyasztó",
    "Fagyaszto": "Fagyasztó",
    "Freezer": "Fagyasztó",

    "Kamra": "Kamra",
    "Pantry": "Kamra",

    "Fürdő": "Fürdő",
    "Furdo": "Fürdő",
    "Bathroom": "Fürdő",

    "Gyógyszerek": "Gyógyszerek",
    "Gyogyszerek": "Gyógyszerek",
    "Medicines": "Gyógyszerek",

    "Kozmetikumok": "Kozmetikumok",
    "Cosmetics": "Kozmetikumok"
  };

  const LOCATION_SELECTORS = {
    "Hűtő": [
      "#fridge-products",
      "#fridgeList",
      "#huto-products",
      '[data-location-list="Hűtő"]',
      '[data-location-list="Huto"]'
    ],
    "Fagyasztó": [
      "#freezer-products",
      "#freezerList",
      "#fagyaszto-products",
      '[data-location-list="Fagyasztó"]',
      '[data-location-list="Fagyaszto"]'
    ],
    "Kamra": [
      "#pantry-products",
      "#pantryList",
      "#kamra-products",
      '[data-location-list="Kamra"]'
    ],
    "Fürdő": [
      "#bathroom-products",
      "#bathroomList",
      "#furdo-products",
      '[data-location-list="Fürdő"]',
      '[data-location-list="Furdo"]'
    ],
    "Gyógyszerek": [
      "#medicines-products",
      "#medicinesList",
      "#gyogyszerek-products",
      '[data-location-list="Gyógyszerek"]',
      '[data-location-list="Gyogyszerek"]'
    ],
    "Kozmetikumok": [
      "#cosmetics-products",
      "#cosmeticsList",
      "#kozmetikumok-products",
      '[data-location-list="Kozmetikumok"]'
    ]
  };

  const SELECTORS = {
    allProductsList: [
      "#products-list",
      "#productsList",
      "#all-products",
      '[data-role="products-list"]'
    ],
    shoppingList: [
      "#shopping-list",
      "#shoppingList",
      '[data-role="shopping-list"]'
    ],
    weeklyWaste: [
      "#weekly-waste",
      "#weeklyWaste",
      '[data-role="weekly-waste"]'
    ],
    monthlyWaste: [
      "#monthly-waste",
      "#monthlyWaste",
      '[data-role="monthly-waste"]'
    ],
    totalProducts: [
      "#total-products",
      "#totalProducts",
      '[data-role="total-products"]'
    ],
    expiringSoon: [
      "#expiring-soon",
      "#expiringSoon",
      '[data-role="expiring-soon"]'
    ],
    wasteChart: [
      "#wasteChart",
      "#statsChart",
      "canvas[data-role='waste-chart']"
    ],
    adminPanel: [
      "#admin-panel",
      "#adminPanel",
      '[data-role="admin-panel"]'
    ],
    adminUsersTable: [
      "#admin-users",
      "#adminUsers",
      "#users-table-body",
      '[data-role="admin-users"]'
    ]
  };

  /* =========================================================
     STATE
     ========================================================= */

  let wasteChartInstance = null;

  /* =========================================================
     ALAP HELPER
     ========================================================= */

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function queryFirst(selectors) {
    for (const selector of selectors) {
      const el = $(selector);
      if (el) return el;
    }
    return null;
  }

  function safeParse(json, fallback) {
    try {
      const parsed = JSON.parse(json);
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  function getStorage(key, fallback) {
    return safeParse(localStorage.getItem(key), fallback);
  }

  function setStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeLocation(location) {
    if (!location) return "Kamra";
    return LOCATION_ALIASES[location] || location;
  }

  function normalizeUnit(unit) {
    if (!unit) return "db";
    const value = String(unit).trim().toLowerCase();
    if (["db", "kg", "liter", "l"].includes(value)) {
      return value === "l" ? "liter" : value;
    }
    return "db";
  }

  function toNumber(value, fallback = 0) {
    const normalized = String(value ?? "")
      .trim()
      .replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : fallback;
  }

  function roundByUnit(value, unit) {
    const n = toNumber(value, 0);
    if (normalizeUnit(unit) === "db") return Math.round(n);
    return Math.round(n * 1000) / 1000;
  }

  function formatNumber(value, unit = "") {
    const n = toNumber(value, 0);
    if (normalizeUnit(unit) === "db") return String(Math.round(n));
    return String(Math.round(n * 1000) / 1000);
  }

  function formatCurrency(value) {
    return `${Math.round(toNumber(value, 0))} Ft`;
  }

  function generateId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function daysBetween(from, to) {
    const a = new Date(from);
    const b = new Date(to);
    a.setHours(0, 0, 0, 0);
    b.setHours(0, 0, 0, 0);
    return Math.round((b - a) / 86400000);
  }

  function isExpiringSoon(expiryDate, days = 3) {
    if (!expiryDate) return false;
    const diff = daysBetween(todayISO(), expiryDate);
    return diff >= 0 && diff <= days;
  }

  function isExpired(expiryDate) {
    if (!expiryDate) return false;
    return daysBetween(todayISO(), expiryDate) < 0;
  }

  function getCurrentUser() {
    return getStorage(STORAGE_KEYS.currentUser, null);
  }

  function getUsers() {
    return getStorage(STORAGE_KEYS.users, []);
  }

  function isAdminUser() {
    const currentUser = getCurrentUser();
    return !!currentUser?.admin;
  }

  /* =========================================================
     TERMÉKEK
     ========================================================= */

  function normalizeProduct(product) {
    const unit = normalizeUnit(product?.unit);

    return {
      id: product?.id || generateId(),
      name: String(product?.name || "").trim(),
      barcode: String(product?.barcode || "").trim(),
      location: normalizeLocation(product?.location),
      quantity: roundByUnit(product?.quantity ?? 0, unit),
      unit,
      price: toNumber(product?.price ?? 0, 0),
      expiryDate: String(product?.expiryDate || "").trim(),
      status: String(product?.status || "active"),
      wastedQuantity: roundByUnit(product?.wastedQuantity ?? 0, unit),
      consumedQuantity: roundByUnit(product?.consumedQuantity ?? 0, unit),
      wasteDate: String(product?.wasteDate || "").trim(),
      toShopping: !!product?.toShopping
    };
  }

  function getProducts() {
    return getStorage(STORAGE_KEYS.products, []).map(normalizeProduct);
  }

  function saveProducts(products) {
    setStorage(
      STORAGE_KEYS.products,
      products.map(normalizeProduct)
    );
  }

  function getProductById(productId) {
    return getProducts().find((p) => String(p.id) === String(productId)) || null;
  }

  function upsertProduct(product) {
    const products = getProducts();
    const normalized = normalizeProduct(product);
    const index = products.findIndex((p) => String(p.id) === String(normalized.id));

    if (index >= 0) {
      products[index] = normalized;
    } else {
      products.push(normalized);
    }

    saveProducts(products);
    return normalized;
  }

  function removeProduct(productId) {
    const products = getProducts().filter((p) => String(p.id) !== String(productId));
    saveProducts(products);
  }

  function recalcStatus(product) {
    const p = normalizeProduct(product);
    if (p.quantity <= 0) {
      p.quantity = 0;
      p.status = "finished";
    } else {
      p.status = "active";
    }
    return p;
  }

  /* =========================================================
     BEVÁSÁRLÓLISTA
     ========================================================= */

  function getShoppingList() {
    return getStorage(STORAGE_KEYS.shoppingList, []);
  }

  function saveShoppingList(list) {
    setStorage(STORAGE_KEYS.shoppingList, list);
  }

  function addToShoppingList(product) {
    const list = getShoppingList();
    const exists = list.some(
      (item) =>
        String(item.id) === String(product.id) ||
        String(item.name || "").toLowerCase() === String(product.name || "").toLowerCase()
    );

    if (!exists) {
      list.push({
        id: product.id,
        name: product.name,
        quantity: product.quantity,
        unit: product.unit
      });
      saveShoppingList(list);
    }

    const updated = { ...product, toShopping: true };
    upsertProduct(updated);
  }

  function removeFromShoppingList(itemId) {
    const list = getShoppingList().filter((item) => String(item.id) !== String(itemId));
    saveShoppingList(list);
  }

  /* =========================================================
     MENNYISÉG BEKÉRÉS
     ========================================================= */

  function askAmount(product, label) {
    const p = normalizeProduct(product);
    const max = p.quantity;

    const input = prompt(
      `${label}\n\nTermék: ${p.name}\nElérhető: ${formatNumber(max, p.unit)} ${p.unit}`,
      p.unit === "db" ? "1" : "0.1"
    );

    if (input === null) return null;

    const value = toNumber(input, NaN);

    if (!Number.isFinite(value) || value <= 0) {
      alert("Érvénytelen mennyiség.");
      return null;
    }

    if (p.unit === "db" && !Number.isInteger(value)) {
      alert("Darab alapú terméknél csak egész szám adható meg.");
      return null;
    }

    if (value > max) {
      alert("Nem adhatsz meg többet, mint a jelenlegi készlet.");
      return null;
    }

    return roundByUnit(value, p.unit);
  }

  /* =========================================================
     MŰVELETEK
     ========================================================= */

  function consumeProduct(productId) {
    const product = getProductById(productId);
    if (!product) {
      alert("A termék nem található.");
      return;
    }

    const amount = askAmount(product, "Mennyit fogyasztottál el?");
    if (amount === null) return;

    product.quantity = roundByUnit(product.quantity - amount, product.unit);
    product.consumedQuantity = roundByUnit(
      product.consumedQuantity + amount,
      product.unit
    );

    upsertProduct(recalcStatus(product));
    renderApp();
  }

  function wasteProduct(productId) {
    const product = getProductById(productId);
    if (!product) {
      alert("A termék nem található.");
      return;
    }

    const amount = askAmount(product, "Mennyit dobtál ki?");
    if (amount === null) return;

    product.quantity = roundByUnit(product.quantity - amount, product.unit);
    product.wastedQuantity = roundByUnit(
      product.wastedQuantity + amount,
      product.unit
    );
    product.wasteDate = new Date().toISOString();

    upsertProduct(recalcStatus(product));

    const loss = amount * product.price;
    alert(`Kidobva: ${formatNumber(amount, product.unit)} ${product.unit}\nVeszteség: ${formatCurrency(loss)}`);

    renderApp();
  }

  function editProduct(productId) {
    const product = getProductById(productId);
    if (!product) {
      alert("A termék nem található.");
      return;
    }

    const name = prompt("Termék neve:", product.name);
    if (name === null) return;

    const barcode = prompt("Vonalkód:", product.barcode || "");
    if (barcode === null) return;

    const quantityRaw = prompt(`Mennyiség (${product.unit}):`, String(product.quantity));
    if (quantityRaw === null) return;

    const unitRaw = prompt("Egység (db / kg / liter):", product.unit);
    if (unitRaw === null) return;

    const priceRaw = prompt("Egységár (Ft):", String(product.price));
    if (priceRaw === null) return;

    const expiryDate = prompt("Lejárati idő (YYYY-MM-DD):", product.expiryDate || "");
    if (expiryDate === null) return;

    const location = prompt(
      "Hely (Hűtő / Fagyasztó / Kamra / Fürdő / Gyógyszerek / Kozmetikumok):",
      product.location
    );
    if (location === null) return;

    const unit = normalizeUnit(unitRaw);
    let quantity = roundByUnit(quantityRaw, unit);
    let price = toNumber(priceRaw, NaN);

    if (!name.trim()) {
      alert("A termék neve kötelező.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity < 0) {
      alert("Érvénytelen mennyiség.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      alert("Érvénytelen ár.");
      return;
    }

    const updated = {
      ...product,
      name: name.trim(),
      barcode: barcode.trim(),
      quantity,
      unit,
      price,
      expiryDate: expiryDate.trim(),
      location: normalizeLocation(location)
    };

    upsertProduct(recalcStatus(updated));
    renderApp();
  }

  function deleteProduct(productId) {
    const product = getProductById(productId);
    if (!product) {
      alert("A termék nem található.");
      return;
    }

    const ok = confirm(`Biztosan törlöd ezt a terméket?\n\n${product.name}`);
    if (!ok) return;

    removeProduct(productId);
    renderApp();
  }

  function openProductActions(productId) {
    const product = getProductById(productId);
    if (!product) return;

    const choice = prompt(
`Termék: ${product.name}
Mennyiség: ${formatNumber(product.quantity, product.unit)} ${product.unit}

1 - Szerkesztés
2 - Elfogyasztva
3 - Kidobva
4 - Bevásárlólistára
5 - Törlés

Írd be a számot:`
    );

    if (choice === null) return;

    switch (choice.trim()) {
      case "1":
        editProduct(productId);
        break;
      case "2":
        consumeProduct(productId);
        break;
      case "3":
        wasteProduct(productId);
        break;
      case "4":
        addToShoppingList(product);
        renderApp();
        break;
      case "5":
        deleteProduct(productId);
        break;
      default:
        alert("Nincs ilyen opció.");
    }
  }

  /* =========================================================
     KÁRTYÁK / RENDER
     ========================================================= */

  function createProductCard(product) {
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.productId = product.id;

    const expiring = isExpiringSoon(product.expiryDate);
    const expired = isExpired(product.expiryDate);

    card.innerHTML = `
      <div class="product-card__header">
        <strong class="product-card__title">${escapeHtml(product.name)}</strong>
      </div>

      <div class="product-card__body">
        <div>Mennyiség: ${escapeHtml(formatNumber(product.quantity, product.unit))} ${escapeHtml(product.unit)}</div>
        <div>Ár: ${escapeHtml(formatCurrency(product.price))}</div>
        <div>Lejárat: ${escapeHtml(product.expiryDate || "-")}</div>
        <div>Hely: ${escapeHtml(product.location)}</div>
        ${
          expired
            ? `<div class="product-card__status product-card__status--expired">Lejárt</div>`
            : expiring
            ? `<div class="product-card__status product-card__status--soon">Hamar lejár</div>`
            : ""
        }
      </div>
    `;

    card.addEventListener("click", () => openProductActions(product.id));
    return card;
  }

  function renderLocationLists(products) {
    Object.entries(LOCATION_SELECTORS).forEach(([location, selectors]) => {
      const container = queryFirst(selectors);
      if (!container) return;

      const items = products.filter((p) => p.location === location && p.quantity > 0);

      container.innerHTML = "";

      if (!items.length) {
        container.innerHTML = `<div class="empty-state">Nincs termék</div>`;
        return;
      }

      items.forEach((product) => {
        container.appendChild(createProductCard(product));
      });
    });
  }

  function renderAllProductsList(products) {
    const container = queryFirst(SELECTORS.allProductsList);
    if (!container) return;

    container.innerHTML = "";

    const visible = products.filter((p) => p.quantity > 0);

    if (!visible.length) {
      container.innerHTML = `<div class="empty-state">Nincs termék</div>`;
      return;
    }

    visible.forEach((product) => {
      container.appendChild(createProductCard(product));
    });
  }

  function renderShoppingList() {
    const container = queryFirst(SELECTORS.shoppingList);
    if (!container) return;

    const list = getShoppingList();
    container.innerHTML = "";

    if (!list.length) {
      container.innerHTML = `<div class="empty-state">A bevásárlólista üres</div>`;
      return;
    }

    list.forEach((item) => {
      const row = document.createElement("div");
      row.className = "shopping-item";
      row.innerHTML = `
        <span>${escapeHtml(item.name)} ${item.quantity ? `(${escapeHtml(formatNumber(item.quantity, item.unit))} ${escapeHtml(item.unit || "")})` : ""}</span>
        <button type="button" data-remove-shopping="${escapeHtml(String(item.id))}">Törlés</button>
      `;
      container.appendChild(row);
    });

    container.querySelectorAll("[data-remove-shopping]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeFromShoppingList(btn.dataset.removeShopping);
        renderShoppingList();
      });
    });
  }

  function renderStats() {
    const products = getProducts();

    const weeklyEl = queryFirst(SELECTORS.weeklyWaste);
    const monthlyEl = queryFirst(SELECTORS.monthlyWaste);
    const totalEl = queryFirst(SELECTORS.totalProducts);
    const expiringEl = queryFirst(SELECTORS.expiringSoon);

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - 1);

    let weeklyWaste = 0;
    let monthlyWaste = 0;

    products.forEach((product) => {
      if (!product.wasteDate || !product.wastedQuantity) return;

      const wasteDate = new Date(product.wasteDate);
      const loss = product.wastedQuantity * product.price;

      if (wasteDate >= weekAgo) weeklyWaste += loss;
      if (wasteDate >= monthAgo) monthlyWaste += loss;
    });

    const activeProducts = products.filter((p) => p.quantity > 0).length;
    const expiringSoonCount = products.filter(
      (p) => p.quantity > 0 && isExpiringSoon(p.expiryDate)
    ).length;

    if (weeklyEl) weeklyEl.textContent = formatCurrency(weeklyWaste);
    if (monthlyEl) monthlyEl.textContent = formatCurrency(monthlyWaste);
    if (totalEl) totalEl.textContent = String(activeProducts);
    if (expiringEl) expiringEl.textContent = String(expiringSoonCount);

    renderWasteChart(weeklyWaste, monthlyWaste);
  }

  function renderWasteChart(weeklyWaste, monthlyWaste) {
    const canvas = queryFirst(SELECTORS.wasteChart);
    if (!canvas || typeof window.Chart === "undefined") return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (wasteChartInstance) {
      wasteChartInstance.destroy();
    }

    wasteChartInstance = new window.Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Heti pazarlás", "Havi pazarlás"],
        datasets: [
          {
            label: "Pazarlás (Ft)",
            data: [Math.round(weeklyWaste), Math.round(monthlyWaste)]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  function renderAdminPanel() {
    const panel = queryFirst(SELECTORS.adminPanel);
    const tableBody = queryFirst(SELECTORS.adminUsersTable);

    if (!panel) return;

    if (!isAdminUser()) {
      panel.style.display = "none";
      return;
    }

    panel.style.display = "";
    if (!tableBody) return;

    const users = getUsers();
    tableBody.innerHTML = "";

    if (!users.length) {
      tableBody.innerHTML = `<div class="empty-state">Nincs regisztrált felhasználó</div>`;
      return;
    }

    users.forEach((user) => {
      const row = document.createElement("div");
      row.className = "admin-user-row";
      row.innerHTML = `
        <div><strong>${escapeHtml(user.username || "-")}</strong></div>
        <div>${escapeHtml(user.email || "-")}</div>
        <div>${escapeHtml(user.plan || "demo")}</div>
        <div>${user.admin ? "Igen" : "Nem"}</div>
      `;
      tableBody.appendChild(row);
    });
  }

  function renderApp() {
    const products = getProducts();
    renderLocationLists(products);
    renderAllProductsList(products);
    renderShoppingList();
    renderStats();
    renderAdminPanel();
  }

  /* =========================================================
     FORM KEZELÉS
     ========================================================= */

  function findValue(selectors, fallback = "") {
    const el = queryFirst(selectors);
    if (!el) return fallback;
    if ("value" in el) return el.value;
    return fallback;
  }

  function clearValue(selectors) {
    const el = queryFirst(selectors);
    if (el && "value" in el) el.value = "";
  }

  function findChecked(selectors, fallback = false) {
    const el = queryFirst(selectors);
    if (!el) return fallback;
    return !!el.checked;
  }

  function collectProductFormData() {
    const name = findValue([
      "#product-name",
      "#productName",
      'input[name="name"]'
    ]);

    const barcode = findValue([
      "#product-barcode",
      "#productBarcode",
      'input[name="barcode"]'
    ]);

    const quantity = findValue([
      "#product-quantity",
      "#productQuantity",
      'input[name="quantity"]'
    ]);

    const unit = findValue([
      "#product-unit",
      "#productUnit",
      'select[name="unit"]'
    ], "db");

    const price = findValue([
      "#product-price",
      "#productPrice",
      'input[name="price"]'
    ], "0");

    const expiryDate = findValue([
      "#product-expiry",
      "#productExpiry",
      "#expiryDate",
      'input[name="expiryDate"]'
    ]);

    const location = findValue([
      "#product-location",
      "#productLocation",
      'select[name="location"]'
    ], "Kamra");

    const toShopping = findChecked([
      "#product-to-shopping",
      "#productToShopping",
      'input[name="toShopping"]'
    ], false);

    return {
      name: String(name).trim(),
      barcode: String(barcode).trim(),
      quantity: toNumber(quantity, NaN),
      unit: normalizeUnit(unit),
      price: toNumber(price, NaN),
      expiryDate: String(expiryDate || "").trim(),
      location: normalizeLocation(location),
      toShopping
    };
  }

  function resetProductForm() {
    [
      "#product-name",
      "#productName",
      'input[name="name"]',

      "#product-barcode",
      "#productBarcode",
      'input[name="barcode"]',

      "#product-quantity",
      "#productQuantity",
      'input[name="quantity"]',

      "#product-price",
      "#productPrice",
      'input[name="price"]',

      "#product-expiry",
      "#productExpiry",
      "#expiryDate",
      'input[name="expiryDate"]'
    ].forEach((selector) => {
      const el = $(selector);
      if (el && "value" in el) el.value = "";
    });

    const unitEl = queryFirst([
      "#product-unit",
      "#productUnit",
      'select[name="unit"]'
    ]);
    if (unitEl) unitEl.value = "db";

    const locationEl = queryFirst([
      "#product-location",
      "#productLocation",
      'select[name="location"]'
    ]);
    if (locationEl) locationEl.value = "Kamra";

    const shoppingEl = queryFirst([
      "#product-to-shopping",
      "#productToShopping",
      'input[name="toShopping"]'
    ]);
    if (shoppingEl) shoppingEl.checked = false;
  }

  function handleProductFormSubmit(event) {
    event.preventDefault();

    const data = collectProductFormData();

    if (!data.name) {
      alert("A termék neve kötelező.");
      return;
    }

    if (!Number.isFinite(data.quantity) || data.quantity <= 0) {
      alert("Érvénytelen mennyiség.");
      return;
    }

    if (!Number.isFinite(data.price) || data.price < 0) {
      alert("Érvénytelen ár.");
      return;
    }

    if (data.unit === "db" && !Number.isInteger(data.quantity)) {
      alert("Darab alapú terméknél egész szám szükséges.");
      return;
    }

    const product = normalizeProduct({
      id: generateId(),
      name: data.name,
      barcode: data.barcode,
      location: data.location,
      quantity: data.quantity,
      unit: data.unit,
      price: data.price,
      expiryDate: data.expiryDate,
      status: "active",
      wastedQuantity: 0,
      consumedQuantity: 0,
      wasteDate: "",
      toShopping: data.toShopping
    });

    upsertProduct(product);

    if (product.toShopping) {
      addToShoppingList(product);
    }

    resetProductForm();
    renderApp();
  }

  function bindProductForm() {
    const form = queryFirst([
      "#product-form",
      "#productForm",
      "#add-product-form",
      "#addProductForm"
    ]);

    if (form) {
      form.addEventListener("submit", handleProductFormSubmit);
    }

    const addButton = queryFirst([
      "#add-product-btn",
      "#addProductBtn",
      '[data-action="add-product"]'
    ]);

    if (addButton && !form) {
      addButton.addEventListener("click", () => {
        const data = collectProductFormData();

        if (!data.name) {
          alert("A termék neve kötelező.");
          return;
        }

        if (!Number.isFinite(data.quantity) || data.quantity <= 0) {
          alert("Érvénytelen mennyiség.");
          return;
        }

        if (!Number.isFinite(data.price) || data.price < 0) {
          alert("Érvénytelen ár.");
          return;
        }

        if (data.unit === "db" && !Number.isInteger(data.quantity)) {
          alert("Darab alapú terméknél egész szám szükséges.");
          return;
        }

        const product = normalizeProduct({
          id: generateId(),
          name: data.name,
          barcode: data.barcode,
          location: data.location,
          quantity: data.quantity,
          unit: data.unit,
          price: data.price,
          expiryDate: data.expiryDate,
          status: "active",
          wastedQuantity: 0,
          consumedQuantity: 0,
          wasteDate: "",
          toShopping: data.toShopping
        });

        upsertProduct(product);

        if (product.toShopping) {
          addToShoppingList(product);
        }

        resetProductForm();
        renderApp();
      });
    }
  }

  /* =========================================================
     HTML ESCAPE
     ========================================================= */

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /* =========================================================
     GLOBÁLIS FÜGGVÉNYEK
     ========================================================= */

  window.renderApp = renderApp;
  window.renderProducts = renderApp;
  window.renderStats = renderStats;
  window.renderShoppingList = renderShoppingList;

  window.consumeProduct = consumeProduct;
  window.wasteProduct = wasteProduct;
  window.editProduct = editProduct;
  window.deleteProduct = deleteProduct;
  window.openProductActions = openProductActions;

  window.getProducts = getProducts;
  window.saveProducts = saveProducts;
  window.getProductById = getProductById;

  /* =========================================================
     INIT
     ========================================================= */

  function init() {
    saveProducts(getProducts().map(normalizeProduct));
    bindProductForm();
    renderApp();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
