console.log("cloud.js loaded");

const SUPABASE_URL = "https://jzxdiunwfjbztcytohye.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6eGRpdW53ZmpienRjeXRvaHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NzM3NzYsImV4cCI6MjA4OTI0OTc3Nn0.kc7RnQ-d05PVzo6hfjmSJFLkPHqT87kjp8Ok-Cc7I18";

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal"
};

function getCloudUser(username) {
  if (username && String(username).trim()) return String(username).trim();

  const raw =
    localStorage.getItem("saveit_current_user_v2") ||
    localStorage.getItem("saveit_current_user") ||
    localStorage.getItem("currentUser");

  if (!raw) return "guest";

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.username) return String(parsed.username).trim();
  } catch {}

  return String(raw).trim();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function makeId(prefix, value) {
  if (value?.id) return String(value.id);
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/* ---------------- PRODUCTS ---------------- */

function cleanProduct(item, username) {
  const user = getCloudUser(username);

  return {
    id: makeId("product", item),
    user_id: user,
    name: item?.name ?? "",
    note: item?.note ?? "",
    quantity: Number(item?.quantity ?? 0),
    unit: item?.unit ?? "db",
    price: Number(item?.price ?? 0),

    // main.js expiryDate-et használ, adatbázisban expiry oszlop van
    expiry: item?.expiryDate || item?.expiry || null,

    location: item?.location ?? "",
    barcode: item?.barcode ?? "",
    created_at: item?.created_at || item?.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function mapProductFromCloud(row) {
  return {
    ...row,
    id: row?.id || makeId("product", row),
    expiryDate: row?.expiry || "",
    createdAt: row?.created_at || "",
    updatedAt: row?.updated_at || ""
  };
}

/* ---------------- WASTE HISTORY ---------------- */

function cleanWasteEntry(item, username) {
  const user = getCloudUser(username);

  return {
    id: makeId("waste", item),
    user_id: user,
    product_name: item?.productName ?? item?.name ?? "",
    note: item?.note ?? "",
    quantity: Number(item?.quantity ?? 0),
    unit: item?.unit ?? "db",
    price_loss: Number(item?.priceLoss ?? item?.price_loss ?? item?.price ?? 0),
    location: item?.location ?? "",
    happened_at: item?.happenedAt || item?.date || new Date().toISOString(),
    created_at: item?.created_at || item?.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function mapWasteFromCloud(row) {
  return {
    ...row,
    id: row?.id || makeId("waste", row),
    productName: row?.product_name || "",
    priceLoss: Number(row?.price_loss ?? 0),
    happenedAt: row?.happened_at || "",
    createdAt: row?.created_at || "",
    updatedAt: row?.updated_at || ""
  };
}

/* ---------------- GENERIC HELPERS ---------------- */

async function fetchRows(table, username) {
  const user = getCloudUser(username);
  const url =
    `${SUPABASE_URL}/rest/v1/${table}` +
    `?user_id=eq.${encodeURIComponent(user)}` +
    `&select=*` +
    `&order=created_at.asc`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  if (!res.ok) {
    console.error(`SELECT ${table} hiba:`, await res.text());
    return [];
  }

  return await res.json();
}

async function replaceAllRows(table, username, rows) {
  const user = getCloudUser(username);

  const delRes = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?user_id=eq.${encodeURIComponent(user)}`,
    {
      method: "DELETE",
      headers: HEADERS
    }
  );

  if (!delRes.ok) {
    console.error(`DELETE ${table} hiba:`, await delRes.text());
    return false;
  }

  if (!rows.length) return true;

  const insRes = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(rows)
  });

  if (!insRes.ok) {
    console.error(`INSERT ${table} hiba:`, await insRes.text());
    return false;
  }

  return true;
}

/* ---------------- API FOR main.js ---------------- */

async function loadProductsCloud(username) {
  const rows = await fetchRows("items", username);
  return asArray(rows).map(mapProductFromCloud);
}

async function saveProductsCloud(username, products) {
  const rows = asArray(products).map((item) => cleanProduct(item, username));
  return await replaceAllRows("items", username, rows);
}

async function loadWasteHistoryCloud(username) {
  const rows = await fetchRows("waste_history", username);
  return asArray(rows).map(mapWasteFromCloud);
}

async function saveWasteHistoryCloud(username, history) {
  const rows = asArray(history).map((item) => cleanWasteEntry(item, username));
  return await replaceAllRows("waste_history", username, rows);
}

/* ---- ezek még későbbre maradnak ---- */

async function loadShoppingListCloud() {
  return [];
}

async function saveShoppingListCloud() {
  return true;
}

async function loadKnownProductsCloud() {
  return {};
}

async function saveKnownProductsCloud() {
  return true;
}
