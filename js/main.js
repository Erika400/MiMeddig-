(() => {
  "use strict";

  const STORAGE_KEYS = {
    products: "products",
    shoppingList: "shoppingList",
    users: "users",
    currentUser: "currentUser"
  };

  const LOCATIONS = [
    "Hűtő",
    "Fagyasztó",
    "Kamra",
    "Fürdő",
    "Gyógyszerek",
    "Kozmetikumok"
  ];

  let wasteChart = null;
  let selectedProductId = null;
  let pendingAmountAction = null;

  function seedDemoData() {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users)) || [];

    if (!users.length) {
      const demoUsers = [
        {
          username: "Erika",
          email: "erika@demo.hu",
          password: "Erika",
          plan: "premiumPro",
          admin: true
        }
      ];
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(demoUsers));
    }

    const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
    if (!currentUser) {
      localStorage.setItem(
        STORAGE_KEYS.currentUser,
        JSON.stringify({
          username: "Erika",
          email: "erika@demo.hu",
          plan: "premiumPro",
          admin: true
        })
      );
    }
  }

  function getProducts() {
    return (JSON.parse(localStorage.getItem(STORAGE_KEYS.products)) || []).map(normalizeProduct);
  }

  function saveProducts(products) {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
  }

  function getShoppingList() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.shoppingList)) || [];
  }

  function saveShoppingList(list) {
    localStorage.setItem(STORAGE_KEYS.shoppingList, JSON.stringify(list));
  }

  function getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.users)) || [];
  }

  function getCurrentUser() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
  }

  function normalizeUnit(unit) {
    const value = String(unit || "db").trim().toLowerCase();
    if (value === "l") return "liter";
    if (["db", "kg", "liter"].includes(value)) return value;
    return "db";
  }

  function toNumber(value, fallback = 0) {
    const n = Number(String(value ?? "").replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
  }

  function roundByUnit(value, unit) {
    const n = toNumber(value, 0);
    if (normalizeUnit(unit) === "db") return Math.round(n);
    return Math.round(n * 1000) / 1000;
  }

  function formatNumber(value, unit) {
    const n = roundByUnit(value, unit);
    return normalizeUnit(unit) === "db" ? String(Math.round(n)) : String(n);
  }

  function formatCurrency(value) {
    return `${Math.round(toNumber(value, 0))} Ft`;
  }

  function normalizeLocation(location) {
    return LOCATIONS.includes(location) ? location : "Kamra";
  }

  function normalizeProduct(product) {
    const unit = normalizeUnit(product?.unit);
    return {
      id: product?.id || createId(),
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

  function createId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
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
  }

  function removeProduct(productId) {
    const products = getProducts().filter((p) => String(p.id) !== String(productId));
    saveProducts(products);
  }

  function recalcStatus(product) {
    const updated = normalizeProduct(product);
    if (updated.quantity <= 0) {
      updated.quantity = 0;
      updated.status = "finished";
    } else {
      updated.status = "active";
    }
    return updated;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function daysBetween(from, to) {
    const a = new Date(from);
    const b = new Date(to);
    a.setHours(0, 0, 0, 0);
    b.setHours(0, 0, 0, 0);
    return Math.round((b - a) / 86400000);
  }

  function isExpired(expiryDate) {
    if (!expiryDate) return false;
    return daysBetween(todayISO(), expiryDate) < 0;
  }

  function isExpiringSoon(expiryDate, days = 3) {
    if (!expiryDate) return false;
    const diff = daysBetween(todayISO(), expiryDate);
    return diff >= 0 && diff <= days;
  }

  function renderProductCard(product) {
    const expired = isExpired(product.expiryDate);
    const expiringSoon = isExpiringSoon(product.expiryDate);

    return `
      <div class="product-card" onclick="openProductActions('${product.id}')">
        <h3 class="product-title">${escapeHtml(product.name)}</h3>
        <div class="product-meta">
          <div>Mennyiség: ${escapeHtml(formatNumber(product.quantity, product.unit))} ${escapeHtml(product.unit)}</div>
          <div>Ár: ${escapeHtml(formatCurrency(product.price))}</div>
          <div>Lejárat: ${escapeHtml(product.expiryDate || "-")}</div>
          <div>Hely: ${escapeHtml(product.location)}</div>
        </div>
        <div class="product-tags">
          ${expired ? '<span class="tag expired">Lejárt</span>' : ""}
          ${!expired && expiringSoon ? '<span class="tag soon">Hamar lejár</span>' : ""}
        </div>
      </div>
    `;
  }

  function renderLocationLists(products) {
    const groups = {
      "Hűtő": document.getElementById("fridge-products"),
      "Fagyasztó": document.getElementById("freezer-products"),
      "Kamra": document.getElementById("pantry-products"),
      "Fürdő": document.getElementById("bathroom-products"),
      "Gyógyszerek": document.getElementById("medicines-products"),
      "Kozmetikumok": document.getElementById("cosmetics-products")
    };

    Object.entries(groups).forEach(([location, container]) => {
      if (!container) return;

      const filtered = products.filter((p) => p.location === location && p.quantity > 0);
      container.innerHTML = filtered.length
        ? filtered.map(renderProductCard).join("")
        : '<div class="empty-state">Nincs termék</div>';
    });
  }

  function renderAllProducts(products) {
    const container = document.getElementById("productsList");
    if (!container) return;

    const active = products.filter((p) => p.quantity > 0);
    container.innerHTML = active.length
      ? active.map(renderProductCard).join("")
      : '<div class="empty-state">Nincs aktív termék</div>';
  }

  function renderShoppingList() {
    const container = document.getElementById("shoppingList");
    if (!container) return;

    const list = getShoppingList();

    if (!list.length) {
      container.innerHTML = '<div class="empty-state">A bevásárlólista üres</div>';
      return;
    }

    container.innerHTML = list.map((item) => `
      <div class="shopping-item">
        <span>${escapeHtml(item.name)} ${item.quantity ? `(${escapeHtml(formatNumber(item.quantity, item.unit))} ${escapeHtml(item.unit || "")})` : ""}</span>
        <button type="button" onclick="removeShoppingItem('${item.id}')">Törlés</button>
      </div>
    `).join("");
  }

  function renderAdminPanel() {
    const panel = document.getElementById("adminPanel");
    const container = document.getElementById("adminUsers");
    const currentUser = getCurrentUser();

    if (!panel || !container) return;

    if (!currentUser?.admin) {
      panel.style.display = "none";
      return;
    }

    panel.style.display = "block";

    const users = getUsers();
    container.innerHTML = users.map((user) => `
      <div class="admin-user">
        <div><strong>${escapeHtml(user.username || "-")}</strong></div>
        <div>${escapeHtml(user.email || "-")}</div>
        <div>Csomag: ${escapeHtml(user.plan || "demo")}</div>
        <div>Admin: ${user.admin ? "igen" : "nem"}</div>
      </div>
    `).join("");
  }

  function renderStats() {
    const products = getProducts();
    const totalProducts = products.filter((p) => p.quantity > 0).length;
    const expiringSoonCount = products.filter((p) => p.quantity > 0 && isExpiringSoon(p.expiryDate)).length;

    let weeklyWaste = 0;
    let monthlyWaste = 0;

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - 1);

    products.forEach((product) => {
      if (!product.wasteDate || !product.wastedQuantity) return;
      const wasteDate = new Date(product.wasteDate);
      const loss = product.wastedQuantity * product.price;

      if (wasteDate >= weekAgo) weeklyWaste += loss;
      if (wasteDate >= monthAgo) monthlyWaste += loss;
    });

    document.getElementById("totalProducts").textContent = String(totalProducts);
    document.getElementById("expiringSoon").textContent = String(expiringSoonCount);
    document.getElementById("weeklyWaste").textContent = formatCurrency(weeklyWaste);
    document.getElementById("monthlyWaste").textContent = formatCurrency(monthlyWaste);

    renderChart(weeklyWaste, monthlyWaste);
  }

  function renderChart(weeklyWaste, monthlyWaste) {
    const canvas = document.getElementById("wasteChart");
    if (!canvas || typeof Chart === "undefined") return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (wasteChart) {
      wasteChart.destroy();
    }

    wasteChart = new Chart(ctx, {
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

  function renderApp() {
    const products = getProducts();
    renderLocationLists(products);
    renderAllProducts(products);
    renderShoppingList();
    renderStats();
    renderAdminPanel();
  }

  function resetProductForm() {
    document.getElementById("productForm").reset();
    document.getElementById("productUnit").value = "db";
    document.getElementById("productLocation").value = "Kamra";
  }

  function addProduct(event) {
    event.preventDefault();

    const name = document.getElementById("productName").value.trim();
    const barcode = document.getElementById("productBarcode").value.trim();
    const quantityRaw = document.getElementById("productQuantity").value;
    const unit = normalizeUnit(document.getElementById("productUnit").value);
    const priceRaw = document.getElementById("productPrice").value;
    const expiryDate = document.getElementById("productExpiry").value;
    const location = normalizeLocation(document.getElementById("productLocation").value);
    const toShopping = document.getElementById("productToShopping").checked;

    const quantity = roundByUnit(quantityRaw, unit);
    const price = toNumber(priceRaw, NaN);

    if (!name) {
      alert("A termék neve kötelező.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      alert("Érvénytelen mennyiség.");
      return;
    }

    if (unit === "db" && !Number.isInteger(quantity)) {
      alert("Darab alapú terméknél egész szám kell.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      alert("Érvénytelen ár.");
      return;
    }

    const product = normalizeProduct({
      id: createId(),
      name,
      barcode,
      location,
      quantity,
      unit,
      price,
      expiryDate,
      status: "active",
      wastedQuantity: 0,
      consumedQuantity: 0,
      wasteDate: "",
      toShopping
    });

    upsertProduct(product);

    if (toShopping) {
      addToShoppingList(product.id);
    }

    resetProductForm();
    renderApp();
  }

  function openProductActions(productId) {
    const product = getProductById(productId);
    if (!product) return;

    selectedProductId = productId;

    const modal = document.getElementById("productActionModal");
    const title = document.getElementById("productActionTitle");

    title.textContent = `${product.name} – ${formatNumber(product.quantity, product.unit)} ${product.unit}`;
    modal.classList.remove("hidden");
  }

  function closeProductActions() {
    document.getElementById("productActionModal").classList.add("hidden");
    selectedProductId = null;
  }

  function openAmountModal(type) {
    const product = getProductById(selectedProductId);
    if (!product) return;

    pendingAmountAction = type;

    const title = document.getElementById("amountModalTitle");
    const info = document.getElementById("amountModalInfo");
    const input = document.getElementById("amountInput");
    const modal = document.getElementById("amountModal");

    title.textContent = type === "consume" ? "Elfogyasztott mennyiség" : "Kidobott mennyiség";
    info.textContent = `Termék: ${product.name} | Elérhető: ${formatNumber(product.quantity, product.unit)} ${product.unit}`;
    input.value = product.unit === "db" ? "1" : "0.1";
    input.step = product.unit === "db" ? "1" : "0.001";
    input.min = "0";
    modal.classList.remove("hidden");
  }

  function closeAmountModal() {
    document.getElementById("amountModal").classList.add("hidden");
    pendingAmountAction = null;
  }

  function saveAmountAction() {
    const product = getProductById(selectedProductId);
    if (!product || !pendingAmountAction) return;

    const input = document.getElementById("amountInput");
    const amount = toNumber(input.value, NaN);

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Érvénytelen mennyiség.");
      return;
    }

    if (product.unit === "db" && !Number.isInteger(amount)) {
      alert("Darab alapú terméknél csak egész szám adható meg.");
      return;
    }

    if (amount > product.quantity) {
      alert("Nem adhatsz meg többet, mint a jelenlegi készlet.");
      return;
    }

    if (pendingAmountAction === "consume") {
      product.quantity = roundByUnit(product.quantity - amount, product.unit);
      product.consumedQuantity = roundByUnit((product.consumedQuantity || 0) + amount, product.unit);
    }

    if (pendingAmountAction === "waste") {
      product.quantity = roundByUnit(product.quantity - amount, product.unit);
      product.wastedQuantity = roundByUnit((product.wastedQuantity || 0) + amount, product.unit);
      product.wasteDate = new Date().toISOString();
    }

    upsertProduct(recalcStatus(product));

    closeAmountModal();
    closeProductActions();

    if (pendingAmountAction === "waste") {
      alert(`Veszteség: ${formatCurrency(amount * product.price)}`);
    }

    renderApp();
  }

  function editProduct(productId) {
    const product = getProductById(productId);
    if (!product) return;

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

    const location = prompt("Hely:", product.location);
    if (location === null) return;

    const unit = normalizeUnit(unitRaw);
    const quantity = roundByUnit(quantityRaw, unit);
    const price = toNumber(priceRaw, NaN);

    if (!name.trim()) {
      alert("A termék neve kötelező.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity < 0) {
      alert("Érvénytelen mennyiség.");
      return;
    }

    if (unit === "db" && !Number.isInteger(quantity)) {
      alert("Darab alapú terméknél egész szám kell.");
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
    closeProductActions();
    renderApp();
  }

  function deleteProduct(productId) {
    const product = getProductById(productId);
    if (!product) return;

    if (!confirm(`Biztosan törlöd ezt a terméket?\n\n${product.name}`)) {
      return;
    }

    removeProduct(productId);
    closeProductActions();
    renderApp();
  }

  function addToShoppingList(productId) {
    const product = getProductById(productId);
    if (!product) return;

    const list = getShoppingList();
    const exists = list.some(
      (item) =>
        String(item.id) === String(product.id) ||
        String(item.name).toLowerCase() === String(product.name).toLowerCase()
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

    closeProductActions();
    renderApp();
  }

  function removeShoppingItem(itemId) {
    const list = getShoppingList().filter((item) => String(item.id) !== String(itemId));
    saveShoppingList(list);
    renderShoppingList();
  }

  function bindEvents() {
    document.getElementById("productForm").addEventListener("submit", addProduct);

    document.getElementById("closeActionModalBtn").addEventListener("click", closeProductActions);
    document.getElementById("actionBackdrop").addEventListener("click", closeProductActions);
    document.getElementById("actionCancel").addEventListener("click", closeProductActions);

    document.getElementById("actionEdit").addEventListener("click", () => {
      if (!selectedProductId) return;
      editProduct(selectedProductId);
    });

    document.getElementById("actionConsume").addEventListener("click", () => {
      if (!selectedProductId) return;
      openAmountModal("consume");
    });

    document.getElementById("actionWaste").addEventListener("click", () => {
      if (!selectedProductId) return;
      openAmountModal("waste");
    });

    document.getElementById("actionShopping").addEventListener("click", () => {
      if (!selectedProductId) return;
      addToShoppingList(selectedProductId);
    });

    document.getElementById("actionDelete").addEventListener("click", () => {
      if (!selectedProductId) return;
      deleteProduct(selectedProductId);
    });

    document.getElementById("closeAmountModalBtn").addEventListener("click", closeAmountModal);
    document.getElementById("amountBackdrop").addEventListener("click", closeAmountModal);
    document.getElementById("cancelAmountBtn").addEventListener("click", closeAmountModal);
    document.getElementById("saveAmountBtn").addEventListener("click", saveAmountAction);
  }

  window.openProductActions = openProductActions;
  window.removeShoppingItem = removeShoppingItem;

  function init() {
    seedDemoData();
    saveProducts(getProducts());
    bindEvents();
    renderApp();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
