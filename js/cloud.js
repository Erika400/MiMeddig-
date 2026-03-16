console.log("cloud.js loaded");

const SUPABASE_URL = "https://jzxdiunwfjbztcytohye.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6eGRpdW53ZmpienRjeXRvaHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NzM3NzYsImV4cCI6MjA4OTI0OTc3Nn0.kc7RnQ-d05PVzo6hfjmSJFLkPHqT87kjp8Ok-Cc7I18";

const SUPABASE_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json"
};

function cloudUser(username) {
  if (username && String(username).trim()) return String(username).trim();

  const currentUserRaw =
    localStorage.getItem("saveit_current_user_v2") ||
    localStorage.getItem("saveit_current_user") ||
    localStorage.getItem("currentUser");

  if (!currentUserRaw) return "guest";

  try {
    const parsed = JSON.parse(currentUserRaw);
    if (parsed?.username) return String(parsed.username).trim();
  } catch {}

  return String(currentUserRaw).trim();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function makeId(item) {
  if (item?.id) return String(item.id);
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id_" + Date.now() + "_" + Math.random().toString(16).slice(2);
}

function sanitizeProductForCloud(item, username) {
  const user = cloudUser(username);

  return {
    id: makeId(item),
    user_id: user,
    name: item?.name ?? "",
    note: item?.note ?? "",
    quantity: Number(item?.quantity ?? 0),
    unit: item?.unit ?? "db",
    price: Number(item?.price ?? 0),
    expiry: item?.expiry || null,
    location: item?.location ?? "",
    barcode: item?.barcode ?? "",
    created_at: item?.created_at || item?.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

async function selectRows(table, username) {
  const user = cloudUser(username);
  const url =
    `${SUPABASE_URL}/rest/v1/${table}` +
    `?user_id=eq.${encodeURIComponent(user)}` +
    `&select=*` +
    `&order=created_at.asc`;

  const response = await fetch(url, {
    method: "GET",
    headers: SUPABASE_HEADERS
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SELECT ${table}: ${response.status} ${text}`);
  }

  return await response.json();
}

async function replaceRows(table, username, rows) {
  const user = cloudUser(username);

  const deleteUrl = `${SUPABASE_URL}/rest/v1/${table}?user_id=eq.${encodeURIComponent(user)}`;
  const deleteResponse = await fetch(deleteUrl, {
    method: "DELETE",
    headers: {
      ...SUPABASE_HEADERS,
      Prefer: "return=minimal"
    }
  });

  if (!deleteResponse.ok) {
    const text = await deleteResponse.text();
    throw new Error(`DELETE ${table}: ${deleteResponse.status} ${text}`);
  }

  if (!rows.length) return true;

  const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      ...SUPABASE_HEADERS,
      Prefer: "return=minimal"
    },
    body: JSON.stringify(rows)
  });

  if (!insertResponse.ok) {
    const text = await insertResponse.text();
    throw new Error(`INSERT ${table}: ${insertResponse.status} ${text}`);
  }

  return true;
}

async function loadProductsCloud(username) {
  try {
    return asArray(await selectRows("items", username));
  } catch (error) {
    console.error("Cloud termék betöltési hiba:", error);
    return [];
  }
}

async function saveProductsCloud(username, products) {
  try {
    const safeRows = asArray(products).map((item) =>
      sanitizeProductForCloud(item, username)
    );

    await replaceRows("items", username, safeRows);
    return true;
  } catch (error) {
    console.error("Cloud termék mentési hiba:", error);
    return false;
  }
}

async function loadShoppingListCloud(username) {
  return [];
}

async function saveShoppingListCloud(username, list) {
  return true;
}

async function loadKnownProductsCloud(username) {
  return {};
}

async function saveKnownProductsCloud(username, data) {
  return true;
}

async function loadWasteHistoryCloud(username) {
  return [];
}

async function saveWasteHistoryCloud(username, history) {
  return true;
}
