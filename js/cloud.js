console.log("cloud.js loaded");

const SUPABASE_URL = "https://jzxdiunwfjbztcytohye.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6eGRpdW53ZmpienRjeXRvaHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NzM3NzYsImV4cCI6MjA4OTI0OTc3Nn0.kc7RnQ-d05PVzo6hfjmSJFLkPHqT87kjp8Ok-Cc7I18";

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json"
};

function getUser(username) {
  if (username) return username;

  const raw =
    localStorage.getItem("saveit_current_user_v2") ||
    localStorage.getItem("currentUser");

  if (!raw) return "guest";

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.username) return parsed.username;
  } catch {}

  return raw;
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function makeId(item) {
  if (item?.id) return item.id;
  if (crypto.randomUUID) return crypto.randomUUID();
  return "id_" + Date.now() + "_" + Math.random().toString(16).slice(2);
}

function cleanProduct(item, username) {
  const user = getUser(username);

  return {
    id: makeId(item),
    user_id: user,
    name: item?.name ?? "",
    note: item?.note ?? "",
    quantity: Number(item?.quantity ?? 0),
    unit: item?.unit ?? "db",
    price: Number(item?.price ?? 0),

    // FONTOS: a main.js expiryDate mezőt használ
    expiry: item?.expiryDate || item?.expiry || null,

    location: item?.location ?? "",
    barcode: item?.barcode ?? "",
    created_at: item?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function mapCloudProduct(row) {
  return {
    ...row,

    // FONTOS: visszatöltéskor expiry -> expiryDate
    expiryDate: row?.expiry || "",

    // a main.js ezt várja
    id: row?.id || makeId(row)
  };
}

async function selectRows(table, username) {
  const user = getUser(username);

  const url =
    `${SUPABASE_URL}/rest/v1/${table}` +
    `?user_id=eq.${encodeURIComponent(user)}` +
    `&select=*`;

  const res = await fetch(url, { headers: HEADERS });

  if (!res.ok) {
    console.error(await res.text());
    return [];
  }

  return await res.json();
}

async function replaceRows(table, username, rows) {
  const user = getUser(username);

  const delRes = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?user_id=eq.${encodeURIComponent(user)}`,
    {
      method: "DELETE",
      headers: HEADERS
    }
  );

  if (!delRes.ok) {
    console.error("DELETE hiba:", await delRes.text());
    return false;
  }

  if (!rows.length) return true;

  const insRes = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(rows)
  });

  if (!insRes.ok) {
    console.error("INSERT hiba:", await insRes.text());
    return false;
  }

  return true;
}

async function loadProductsCloud(username) {
  const rows = await selectRows("items", username);
  return safeArray(rows).map(mapCloudProduct);
}

async function saveProductsCloud(username, products) {
  const rows = safeArray(products).map((p) => cleanProduct(p, username));
  return await replaceRows("items", username, rows);
}

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

async function loadWasteHistoryCloud() {
  return [];
}

async function saveWasteHistoryCloud() {
  return true;
}
