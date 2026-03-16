console.log("cloud.js loaded");

const SUPABASE_URL = "https://jzxdiunwfjbztcytohye.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6eGRpdW53ZmpienRjeXRvaHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NzM3NzYsImV4cCI6MjA4OTI0OTc3Nn0.kc7RnQ-d05PVzo6hfjmSJFLkPHqT87kjp8Ok-Cc7I18";

const SUPABASE_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json"
};

function getCurrentCloudUser() {
  const currentUser =
    localStorage.getItem("saveit_current_user_v2") ||
    localStorage.getItem("saveit_current_user") ||
    "guest";

  return String(currentUser).trim();
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function ensureItemId(item) {
  if (item && item.id) return item.id;
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id_" + Date.now() + "_" + Math.random().toString(16).slice(2);
}

async function supabaseSelect(table, userId) {
  const url =
    `${SUPABASE_URL}/rest/v1/${table}` +
    `?user_id=eq.${encodeURIComponent(userId)}` +
    `&select=*` +
    `&order=created_at.asc`;

  const response = await fetch(url, {
    method: "GET",
    headers: SUPABASE_HEADERS
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SELECT ${table} hiba: ${response.status} ${text}`);
  }

  return await response.json();
}

async function supabaseDeleteAllForUser(table, userId) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?user_id=eq.${encodeURIComponent(userId)}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      ...SUPABASE_HEADERS,
      Prefer: "return=minimal"
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DELETE ${table} hiba: ${response.status} ${text}`);
  }

  return true;
}

async function supabaseInsertMany(table, rows) {
  if (!rows.length) return true;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      ...SUPABASE_HEADERS,
      Prefer: "return=minimal"
    },
    body: JSON.stringify(rows)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`INSERT ${table} hiba: ${response.status} ${text}`);
  }

  return true;
}

async function loadItemsCloud() {
  try {
    const userId = getCurrentCloudUser();
    const data = await supabaseSelect("items", userId);
    return ensureArray(data);
  } catch (error) {
    console.error("Cloud items betöltési hiba:", error);
    return [];
  }
}

async function saveItemsCloud(items) {
  try {
    const userId = getCurrentCloudUser();
    const safeItems = ensureArray(items).map((item) => ({
      ...item,
      id: ensureItemId(item),
      user_id: userId,
      updated_at: new Date().toISOString(),
      created_at: item.created_at || item.createdAt || new Date().toISOString()
    }));

    await supabaseDeleteAllForUser("items", userId);
    await supabaseInsertMany("items", safeItems);

    return true;
  } catch (error) {
    console.error("Cloud items mentési hiba:", error);
    return false;
  }
}

async function loadShoppingCloud() {
  return [];
}

async function saveShoppingCloud(list) {
  return true;
}
