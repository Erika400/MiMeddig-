(() => {
  "use strict";

  const STORAGE_KEYS = {
    products: "products",
    shoppingList: "shoppingList",
    users: "users",
    currentUser: "currentUser",
    knownProducts: "knownProducts"
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
  let currentOpenGroup = null;
  let pendingMove = null;
  let scannerStream = null;
  let scannerInterval = null;
  let draggedGroupRef = null;

  /* ------------------------------ */
  /* Seed */
  /* ------------------------------ */

  function seedDemoData() {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users)) || [];
    if (!users.length) {
      localStorage.setItem(
        STORAGE_KEYS.users,
        JSON.stringify([
          {
            username: "Erika",
            email: "erika@demo.hu",
            password: "Erika",
            plan: "premiumPro",
            admin: true
          }
        ])
      );
    }
  }

  /* ------------------------------ */
  /* Storage */
  /* ------------------------------ */

  function getProducts() {
    return (JSON.parse(localStorage.getItem(STORAGE_KEYS.products)) || []).map(normalizeProduct);
  }

  function saveProducts(products) {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products.map(normalizeProduct)));
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

  function setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
  }

  function clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  }

  function getKnownProducts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.knownProducts)) || {};
  }

  function saveKnownProducts(data) {
    localStorage.setItem(STORAGE_KEYS.knownProducts, JSON.stringify(data));
  }

  /* ------------------------------ */
  /* Utils */
  /* ------------------------------ */

  function createId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
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
    return normalizeUnit(unit) === "db" ? Math.round(n) : Math.round(n * 1000) / 1000;
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

  function getStatusFromExpiry(expiryDate) {
    if (!expiryDate) return "ok";
    if (isExpired(expiryDate)) return "expired";
    if (isExpiringSoon(expiryDate)) return "soon";
    return "ok";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function slugName(name) {
    return String(name || "").trim().toLowerCase();
  }

  function statusLabel(status) {
    if (status === "expired") return "Lejárt";
    if (status === "soon") return "Közeli lejárat";
    return "Rendben";
  }

  function statusBadgeClass(status) {
    if (status === "expired") return "badge-expired";
    if (status === "soon") return "badge-soon";
    return "badge-ok";
  }

  function statusDotClass(status) {
    if (status === "expired") return "status-expired";
    if (status === "soon") return "status-soon";
    return "status-ok";
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /* ------------------------------ */
  /* Product model */
  /* ------------------------------ */

  function normalizeProduct(product) {
    const unit = normalizeUnit(product?.unit);

    return {
      id: product?.id || createId(),
      name: String(product?.name || "").trim(),
      note: String(product?.note || "").trim(),
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
      wasteLog: Array.isArray(product?.wasteLog) ? product.wasteLog : [],
      consumeLog: Array.isArray(product?.consumeLog) ? product.consumeLog : [],
      toShopping: !!product?.toShopping
    };
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

  function rememberKnownProduct(product) {
    if (!product.barcode) return;
    const known = getKnownProducts();
    known[product.barcode] = {
      name: product.name,
      note: product.note || "",
      unit: product.unit,
      defaultLocation: product.location
    };
    saveKnownProducts(known);
  }

  function applyKnownProduct(barcode) {
    const known = getKnownProducts();
    const item = known[barcode];
    if (!item) return false;

    document.getElementById("productName").value = item.name || "";
    document.getElementById("productNote").value = item.note || "";
    document.getElementById("productUnit").value = item.unit || "db";
    document.getElementById("productLocation").value = item.defaultLocation || "Kamra";
    return true;
  }

  /* ------------------------------ */
  /* Grouping */
  /* ------------------------------ */

  function getVisibleProducts() {
    return getProducts().filter((p) => p.quantity > 0);
  }

  function getGroupStatus(items) {
    const validExpiryItems = items
      .filter((item) => item.expiryDate)
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    if (!validExpiryItems.length) return "ok";

    return getStatusFromExpiry(validExpiryItems[0].expiryDate);
  }

  function getNearestExpiry(items) {
    const validExpiryItems = items
      .filter((item) => item.expiryDate)
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    return validExpiryItems.length ? validExpiryItems[0].expiryDate : "";
  }

  function groupProductsByLocation(products) {
    const groupedByLocation = {};
    LOCATIONS.forEach((location) => {
      groupedByLocation[location] = [];
    });

    products.forEach((product) => {
      const location = product.location;
      const key = slugName(product.name);

      let group = groupedByLocation[location].find((entry) => entry.key === key);
      if (!group) {
        group = {
          key,
          displayName: product.name,
          location,
          items: []
        };
        groupedByLocation[location].push(group);
      }

      group.items.push(product);
    });

    Object.values(groupedByLocation).forEach((groups) => {
      groups.forEach((group) => {
        group.items.sort((a, b) => {
          const aExpiry = a.expiryDate ? new Date(a.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
          const bExpiry = b.expiryDate ? new Date(b.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
          return aExpiry - bExpiry;
        });
        group.status = getGroupStatus(group.items);
        group.nearestExpiry = getNearestExpiry(group.items);
        group.count = group.items.length;
      });

      groups.sort((a, b) => {
        const statusOrder = { expired: 0, soon: 1, ok: 2 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        return a.displayName.localeCompare(b.displayName, "hu");
      });
    });

    return groupedByLocation;
  }

  function findGroup(location, groupKey) {
    const grouped = groupProductsByLocation(getVisibleProducts());
    return (grouped[location] || []).find((group) => group.key === groupKey) || null;
  }

  /* ------------------------------ */
  /* Auth */
  /* ------------------------------ */

  function showApp() {
    document.getElementById("authScreen").classList.add("hidden");
    document.getElementById("appScreen").classList.remove("hidden");
    renderApp();
  }

  function showAuth() {
    document.getElementById("appScreen").classList.add("hidden");
    document.getElementById("authScreen").classList.remove("hidden");
  }

  function showLoginForm() {
    document.getElementById("loginForm").classList.remove("hidden");
    document.getElementById("registerForm").classList.add("hidden");
  }

  function showRegisterForm() {
    document.getElementById("registerForm").classList.remove("hidden");
    document.getElementById("loginForm").classList.add("hidden");
  }

  function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;

    const user = getUsers().find(
      (entry) => entry.username === username && entry.password === password
    );

    if (!user) {
      alert("Hibás felhasználónév vagy jelszó.");
      return;
    }

    setCurrentUser(user);
    showApp();
  }

  function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById("registerUsername").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    if (!username || !email || !password) {
      alert("Minden mező kitöltése kötelező.");
      return;
    }

    const users = getUsers();
    const exists = users.some((user) => user.username === username || user.email === email);

    if (exists) {
      alert("Ez a felhasználónév vagy email már létezik.");
      return;
    }

    const newUser = {
      username,
      email,
      password,
      plan: "demo",
      admin: false
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
    setCurrentUser(newUser);
    showApp();
  }

  function logout() {
    clearCurrentUser();
    showAuth();
  }

  /* ------------------------------ */
  /* Add product */
  /* ------------------------------ */

  function resetProductForm() {
    document.getElementById("productForm").reset();
    document.getElementById("productUnit").value = "db";
    document.getElementById("productLocation").value = "Kamra";
  }

  function addProduct(event) {
    event.preventDefault();

    const name = document.getElementById("productName").value.trim();
    const note = document.getElementById("productNote").value.trim();
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
      note,
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
      wasteLog: [],
      consumeLog: [],
      toShopping
    });

    upsertProduct(product);
    rememberKnownProduct(product);

    if (toShopping) {
      addToShoppingList(product.id, 1, false);
    }

    resetProductForm();
    renderApp();
    document.getElementById("mapSection").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ------------------------------ */
  /* Shopping */
  /* ------------------------------ */

  function addToShoppingList(productId, initialQuantity = 1, rerender = true) {
    const product = getProductById(productId);
    if (!product) return;

    const list = getShoppingList();
    const existing = list.find((item) => String(item.id) === String(product.id));

    if (existing) {
      existing.quantity = roundByUnit(existing.quantity + initialQuantity, existing.unit);
    } else {
      list.push({
        id: product.id,
        name: product.name,
        note: product.note || "",
        quantity: roundByUnit(initialQuantity, product.unit),
        unit: product.unit
      });
    }

    saveShoppingList(list);

    const updated = { ...product, toShopping: true };
    upsertProduct(updated);

    if (rerender) {
      renderApp();
      if (currentOpenGroup) {
        openGroupModal(currentOpenGroup.location, currentOpenGroup.groupKey);
      }
    }
  }

  function removeShoppingItem(itemId) {
    const list = getShoppingList().filter((item) => String(item.id) !== String(itemId));
    saveShoppingList(list);
    renderShoppingList();
  }

  function changeShoppingQty(itemId, delta) {
    const list = getShoppingList();
    const item = list.find((entry) => String(entry.id) === String(itemId));
    if (!item) return;

    if (item.unit === "db") {
      item.quantity = Math.max(1, Math.round(item.quantity + delta));
    } else {
      item.quantity = Math.max(0.1, Math.round((item.quantity + delta) * 1000) / 1000);
    }

    saveShoppingList(list);
    renderShoppingList();
  }

  /* ------------------------------ */
  /* Rendering grouped cards */
  /* ------------------------------ */

  function renderGroupCard(group) {
    return `
      <div class="group-card"
           draggable="true"
           data-group-location="${escapeHtml(group.location)}"
           data-group-key="${escapeHtml(group.key)}"
           onclick="openGroupModal('${escapeHtml(group.location)}','${escapeHtml(group.key)}')">
        <div class="group-card-top">
          <div class="group-name">
            <span class="status-dot ${statusDotClass(group.status)}"></span>
            <span class="group-title">${escapeHtml(group.displayName)}</span>
          </div>
          <span class="badge">${group.count} tétel</span>
        </div>

        <div class="group-badges">
          <span class="badge ${statusBadgeClass(group.status)}">${statusLabel(group.status)}</span>
          ${
            group.nearestExpiry
              ? `<span class="badge">Következő lejárat: ${escapeHtml(group.nearestExpiry)}</span>`
              : `<span class="badge">Nincs lejárat</span>`
          }
        </div>
      </div>
    `;
  }

  function renderLocationLists(products) {
    const grouped = groupProductsByLocation(products);

    const map = {
      "Hűtő": document.getElementById("fridge-products"),
      "Fagyasztó": document.getElementById("freezer-products"),
      "Kamra": document.getElementById("pantry-products"),
      "Fürdő": document.getElementById("bathroom-products"),
      "Gyógyszerek": document.getElementById("medicines-products"),
      "Kozmetikumok": document.getElementById("cosmetics-products")
    };

    Object.entries(map).forEach(([location, container]) => {
      if (!container) return;

      const groups = grouped[location] || [];
      container.innerHTML = groups.length
        ? groups.map(renderGroupCard).join("")
        : '<div class="empty-state">Nincs termék</div>';
    });

    bindDragAndDrop();
  }

  /* ------------------------------ */
  /* Group modal */
  /* ------------------------------ */

  function renderBatchCard(item) {
    const status = getStatusFromExpiry(item.expiryDate);
    const title = item.note ? `${item.name} – ${item.note}` : item.name;
    const miniText = item.expiryDate
      ? `Lejárat: ${item.expiryDate}`
      : "Nincs lejárat";

    return `
      <div class="batch-card" id="batch-${escapeHtml(item.id)}">
        <div class="batch-summary" onclick="toggleBatchDetails('${escapeHtml(item.id)}')">
          <div class="batch-summary-left">
            <span class="status-dot ${statusDotClass(status)}"></span>
            <div>
              <div class="batch-main-title">${escapeHtml(title)}</div>
              <div class="batch-mini">${escapeHtml(miniText)}</div>
            </div>
          </div>
          <div class="batch-arrow">⌄</div>
        </div>

        <div class="batch-details">
          <div class="details-grid">
            <div><strong>Név:</strong> ${escapeHtml(item.name)}</div>
            <div><strong>Részletezés:</strong> ${escapeHtml(item.note || "-")}</div>
            <div><strong>Mennyiség:</strong> ${escapeHtml(formatNumber(item.quantity, item.unit))} ${escapeHtml(item.unit)}</div>
            <div><strong>Egységár:</strong> ${escapeHtml(formatCurrency(item.price))}</div>
            <div><strong>Lejárat:</strong> ${escapeHtml(item.expiryDate || "-")}</div>
            <div><strong>Vonalkód:</strong> ${escapeHtml(item.barcode || "-")}</div>
            <div><strong>Állapot:</strong> ${escapeHtml(statusLabel(status))}</div>
          </div>

          <div class="action-row">
            <button type="button" class="ghost-btn" onclick="editProduct('${escapeHtml(item.id)}')">Szerkesztés</button>
            <button type="button" class="ghost-btn" onclick="startConsumeProduct('${escapeHtml(item.id)}')">Elfogyasztva</button>
            <button type="button" class="ghost-btn" onclick="startWasteProduct('${escapeHtml(item.id)}')">Kidobva</button>
            <button type="button" class="ghost-btn" onclick="addBatchToShopping('${escapeHtml(item.id)}')">Bevásárlólistára</button>
            <button type="button" class="danger-btn" style="grid-column: 1 / -1;" onclick="deleteProduct('${escapeHtml(item.id)}')">Törlés</button>
          </div>
        </div>
      </div>
    `;
  }

  function openGroupModal(location, groupKey) {
    const group = findGroup(location, groupKey);
    if (!group) return;

    currentOpenGroup = { location, groupKey };

    document.getElementById("groupModalTitle").textContent = group.displayName;
    document.getElementById("groupModalSubtitle").textContent =
      `${group.location} • ${group.count} tétel • ${statusLabel(group.status)}`;

    document.getElementById("groupModalList").innerHTML = group.items
      .map(renderBatchCard)
      .join("");

    document.getElementById("groupModal").classList.remove("hidden");
  }

  function closeGroupModal() {
    document.getElementById("groupModal").classList.add("hidden");
    currentOpenGroup = null;
  }

  function toggleBatchDetails(productId) {
    const card = document.getElementById(`batch-${productId}`);
    if (!card) return;
    card.classList.toggle("open");
  }

  /* ------------------------------ */
  /* Amount actions */
  /* ------------------------------ */

  function openAmountModal(type) {
    const product = getProductById(selectedProductId);
    if (!product) return;

    pendingAmountAction = type;

    document.getElementById("amountModalTitle").textContent =
      type === "consume" ? "Elfogyasztott mennyiség" : "Kidobott mennyiség";

    document.getElementById("amountModalInfo").textContent =
      `${product.name}${product.note ? ` – ${product.note}` : ""} | Elérhető: ${formatNumber(product.quantity, product.unit)} ${product.unit}`;

    const input = document.getElementById("amountInput");
    input.value = product.unit === "db" ? "1" : "0.1";
    input.step = product.unit === "db" ? "1" : "0.001";
    input.min = "0";

    document.getElementById("amountModal").classList.remove("hidden");
  }

  function closeAmountModal() {
    document.getElementById("amountModal").classList.add("hidden");
    pendingAmountAction = null;
  }

  function startConsumeProduct(productId) {
    selectedProductId = productId;
    openAmountModal("consume");
  }

  function startWasteProduct(productId) {
    selectedProductId = productId;
    openAmountModal("waste");
  }

  function saveAmountAction() {
    const product = getProductById(selectedProductId);
    if (!product || !pendingAmountAction) return;

    const actionType = pendingAmountAction;
    const amount = toNumber(document.getElementById("amountInput").value, NaN);

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

    const now = new Date().toISOString();

    if (actionType === "consume") {
      product.quantity = roundByUnit(product.quantity - amount, product.unit);
      product.consumedQuantity = roundByUnit((product.consumedQuantity || 0) + amount, product.unit);
      product.consumeLog = Array.isArray(product.consumeLog) ? product.consumeLog : [];
      product.consumeLog.push({
        date: now,
        amount,
        unit: product.unit
      });
    }

    if (actionType === "waste") {
      const loss = amount * product.price;
      product.quantity = roundByUnit(product.quantity - amount, product.unit);
      product.wastedQuantity = roundByUnit((product.wastedQuantity || 0) + amount, product.unit);
      product.wasteDate = now;
      product.wasteLog = Array.isArray(product.wasteLog) ? product.wasteLog : [];
      product.wasteLog.push({
        date: now,
        amount,
        unit: product.unit,
        loss
      });
    }

    upsertProduct(recalcStatus(product));

    closeAmountModal();
    renderApp();

    if (actionType === "waste") {
      const lastLoss = product.wasteLog[product.wasteLog.length - 1]?.loss || 0;
      alert(`Veszteség: ${formatCurrency(lastLoss)}`);
    }

    if (currentOpenGroup) {
      const freshGroup = findGroup(currentOpenGroup.location, currentOpenGroup.groupKey);
      if (freshGroup) {
        openGroupModal(currentOpenGroup.location, currentOpenGroup.groupKey);
      } else {
        closeGroupModal();
      }
    }
  }

  /* ------------------------------ */
  /* Edit / delete */
  /* ------------------------------ */

  function editProduct(productId) {
    const product = getProductById(productId);
    if (!product) return;

    const name = prompt("Termék neve:", product.name);
    if (name === null) return;

    const note = prompt("Részletezés / márka / kiszerelés:", product.note || "");
    if (note === null) return;

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
      note: note.trim(),
      barcode: barcode.trim(),
      quantity,
      unit,
      price,
      expiryDate: expiryDate.trim(),
      location: normalizeLocation(location)
    };

    upsertProduct(recalcStatus(updated));
    rememberKnownProduct(updated);
    renderApp();

    if (currentOpenGroup) {
      openGroupModal(currentOpenGroup.location, currentOpenGroup.groupKey);
    }
  }

  function deleteProduct(productId) {
    const product = getProductById(productId);
    if (!product) return;

    if (!confirm(`Biztosan törlöd ezt a terméket?\n\n${product.name}${product.note ? ` – ${product.note}` : ""}`)) {
      return;
    }

    removeProduct(productId);
    renderApp();

    if (currentOpenGroup) {
      const freshGroup = findGroup(currentOpenGroup.location, currentOpenGroup.groupKey);
      if (freshGroup) {
        openGroupModal(currentOpenGroup.location, currentOpenGroup.groupKey);
      } else {
        closeGroupModal();
      }
    }
  }

  function addBatchToShopping(productId) {
    addToShoppingList(productId, 1, true);
  }

  /* ------------------------------ */
  /* Drag and drop */
  /* ------------------------------ */

  function bindDragAndDrop() {
    const cards = document.querySelectorAll(".group-card");
    const dropzones = document.querySelectorAll("[data-location-drop]");

    cards.forEach((card) => {
      card.addEventListener("dragstart", (e) => {
        card.classList.add("dragging");
        draggedGroupRef = {
          location: card.dataset.groupLocation,
          groupKey: card.dataset.groupKey
        };
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", JSON.stringify(draggedGroupRef));
        }
      });

      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
      });
    });

    dropzones.forEach((zone) => {
      zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        zone.classList.add("drag-over");
      });

      zone.addEventListener("dragleave", () => {
        zone.classList.remove("drag-over");
      });

      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("drag-over");

        let payload = draggedGroupRef;
        try {
          if (e.dataTransfer) {
            const raw = e.dataTransfer.getData("text/plain");
            if (raw) payload = JSON.parse(raw);
          }
        } catch {}

        if (!payload) return;

        const targetLocation = zone.dataset.locationDrop;
        moveGroupToLocation(payload.location, payload.groupKey, targetLocation);
      });
    });
  }

  function moveGroupToLocation(fromLocation, groupKey, toLocation) {
    if (!toLocation || fromLocation === toLocation) return;

    const group = findGroup(fromLocation, groupKey);
    if (!group) return;

    const products = getProducts();
    group.items.forEach((item) => {
      const idx = products.findIndex((p) => String(p.id) === String(item.id));
      if (idx >= 0) {
        products[idx].location = toLocation;
      }
    });
    saveProducts(products);

    pendingMove = {
      toLocation,
      itemIds: group.items.map((item) => item.id),
      groupName: group.displayName
    };

    renderApp();
    openMoveModal();
  }

  /* ------------------------------ */
  /* Move expiry modal */
  /* ------------------------------ */

  function openMoveModal() {
    if (!pendingMove) return;
    document.getElementById("moveModalInfo").textContent =
      `${pendingMove.groupName} áthelyezve ide: ${pendingMove.toLocation}. Szeretnéd frissíteni a lejárati dátumot?`;
    document.getElementById("moveExpiryInput").value = "";
    document.getElementById("moveModal").classList.remove("hidden");
  }

  function closeMoveModal() {
    document.getElementById("moveModal").classList.add("hidden");
    pendingMove = null;
  }

  function skipMoveExpiry() {
    closeMoveModal();
  }

  function saveMoveExpiry() {
    if (!pendingMove) return;
    const newExpiry = document.getElementById("moveExpiryInput").value.trim();
    if (!newExpiry) {
      closeMoveModal();
      return;
    }

    const products = getProducts();
    pendingMove.itemIds.forEach((id) => {
      const idx = products.findIndex((p) => String(p.id) === String(id));
      if (idx >= 0) {
        products[idx].expiryDate = newExpiry;
      }
    });
    saveProducts(products);
    closeMoveModal();
    renderApp();
  }

  /* ------------------------------ */
  /* Barcode scanner */
  /* ------------------------------ */

  async function openScannerModal() {
    document.getElementById("scannerModal").classList.remove("hidden");
    document.getElementById("scannerStatus").textContent = "Kamera indítása…";

    if (!navigator.mediaDevices?.getUserMedia) {
      document.getElementById("scannerStatus").textContent = "A böngésző nem támogatja a kamerát.";
      return;
    }

    try {
      scannerStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });

      const video = document.getElementById("scannerVideo");
      video.srcObject = scannerStream;
      await video.play();

      if ("BarcodeDetector" in window) {
        const formats = ["ean_13", "ean_8", "code_128", "upc_a", "upc_e"];
        const detector = new BarcodeDetector({ formats });

        document.getElementById("scannerStatus").textContent = "Irányítsd a kamerát a vonalkódra.";

        scannerInterval = setInterval(async () => {
          try {
            const barcodes = await detector.detect(video);
            if (barcodes && barcodes.length) {
              const code = barcodes[0].rawValue;
              handleScannedBarcode(code);
            }
          } catch {}
        }, 800);
      } else {
        document.getElementById("scannerStatus").textContent =
          "Ez a böngésző nem támogatja a beépített vonalkódolvasást. Írd be kézzel, vagy használj újabb Chrome-ot mobilon.";
      }
    } catch (error) {
      document.getElementById("scannerStatus").textContent = "A kamera nem indítható el.";
    }
  }

  function closeScannerModal() {
    document.getElementById("scannerModal").classList.add("hidden");
    if (scannerInterval) {
      clearInterval(scannerInterval);
      scannerInterval = null;
    }
    if (scannerStream) {
      scannerStream.getTracks().forEach((track) => track.stop());
      scannerStream = null;
    }
    const video = document.getElementById("scannerVideo");
    if (video) {
      video.srcObject = null;
    }
  }

  function handleScannedBarcode(code) {
    document.getElementById("productBarcode").value = code;
    const found = applyKnownProduct(code);
    document.getElementById("scannerStatus").textContent = found
      ? "Ismert termék betöltve a rendszerből."
      : "Vonalkód beolvasva. Add meg a többi adatot.";
    setTimeout(closeScannerModal, 700);
  }

  /* ------------------------------ */
  /* Rendering shopping / stats / admin */
  /* ------------------------------ */

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
        <div class="shopping-main">
          <strong>${escapeHtml(item.name)}</strong>
          <div class="muted">${escapeHtml(item.note || "Mennyiség külön a bevásárlólistához")}</div>
        </div>

        <div class="shopping-controls">
          <button type="button" class="qty-btn" onclick="changeShoppingQty('${escapeHtml(item.id)}', -1)">-</button>
          <div class="qty-value">${escapeHtml(formatNumber(item.quantity, item.unit))} ${escapeHtml(item.unit)}</div>
          <button type="button" class="qty-btn" onclick="changeShoppingQty('${escapeHtml(item.id)}', 1)">+</button>
          <button type="button" class="remove-btn" onclick="removeShoppingItem('${escapeHtml(item.id)}')">Törlés</button>
        </div>
      </div>
    `).join("");
  }

  function renderStats() {
    const products = getProducts();
    const activeProducts = products.filter((p) => p.quantity > 0);
    const totalProducts = activeProducts.length;
    const expiringSoonCount = activeProducts.filter((p) => isExpiringSoon(p.expiryDate)).length;

    let weeklyWaste = 0;
    let monthlyWaste = 0;

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - 1);

    products.forEach((product) => {
      const wasteLog = Array.isArray(product.wasteLog) ? product.wasteLog : [];
      wasteLog.forEach((entry) => {
        const date = new Date(entry.date);
        const loss = toNumber(entry.loss, 0);

        if (date >= weekAgo) weeklyWaste += loss;
        if (date >= monthAgo) monthlyWaste += loss;
      });
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

  function renderUserInfo() {
    const currentUser = getCurrentUser();
    const label = document.getElementById("currentUserLabel");
    if (!label) return;

    label.textContent = currentUser
      ? `${currentUser.username} • ${currentUser.plan || "demo"}`
      : "";
  }

  function renderApp() {
    const products = getVisibleProducts();
    renderLocationLists(products);
    renderShoppingList();
    renderStats();
    renderAdminPanel();
    renderUserInfo();
  }

  /* ------------------------------ */
  /* Events */
  /* ------------------------------ */

  function bindEvents() {
    document.getElementById("showLoginBtn").addEventListener("click", showLoginForm);
    document.getElementById("showRegisterBtn").addEventListener("click", showRegisterForm);
    document.getElementById("loginForm").addEventListener("submit", handleLogin);
    document.getElementById("registerForm").addEventListener("submit", handleRegister);
    document.getElementById("logoutBtn").addEventListener("click", logout);

    document.getElementById("productForm").addEventListener("submit", addProduct);
    document.getElementById("saveAmountBtn").addEventListener("click", saveAmountAction);
    document.getElementById("saveMoveBtn").addEventListener("click", saveMoveExpiry);

    document.getElementById("fabAddBtn").addEventListener("click", () => {
      document.getElementById("addSection").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    document.getElementById("scanBarcodeBtn").addEventListener("click", openScannerModal);

    document.getElementById("productBarcode").addEventListener("change", (e) => {
      const code = e.target.value.trim();
      if (code) {
        applyKnownProduct(code);
      }
    });
  }

  /* ------------------------------ */
  /* Expose */
  /* ------------------------------ */

  window.openGroupModal = openGroupModal;
  window.closeGroupModal = closeGroupModal;
  window.toggleBatchDetails = toggleBatchDetails;
  window.startConsumeProduct = startConsumeProduct;
  window.startWasteProduct = startWasteProduct;
  window.closeAmountModal = closeAmountModal;
  window.editProduct = editProduct;
  window.deleteProduct = deleteProduct;
  window.addBatchToShopping = addBatchToShopping;
  window.removeShoppingItem = removeShoppingItem;
  window.changeShoppingQty = changeShoppingQty;
  window.closeMoveModal = closeMoveModal;
  window.skipMoveExpiry = skipMoveExpiry;
  window.closeScannerModal = closeScannerModal;

  /* ------------------------------ */
  /* Init */
  /* ------------------------------ */

  function init() {
    seedDemoData();
    saveProducts(getProducts());
    bindEvents();

    if (getCurrentUser()) {
      showApp();
    } else {
      showAuth();
      showLoginForm();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
