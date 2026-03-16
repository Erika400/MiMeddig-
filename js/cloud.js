console.log("cloud.js loaded");

const SUPABASE_URL = "https://jzxdiunwfjbztcytohye.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6eGRpdW53ZmpienRjeXRvaHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NzM3NzYsImV4cCI6MjA4OTI0OTc3Nn0.kc7RnQ-d05PVzo6hfjmSJFLkPHqT87kjp8Ok-Cc7I18";

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

async function loadProductsCloud(username) {
  const user = getUser(username);

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/items?user_id=eq.${user}&select=*`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    }
  );

  if (!res.ok) {
    console.error(await res.text());
    return [];
  }

  const data = await res.json();

  return data.map((p) => ({
    ...p,
    expiryDate: p.expiry || ""
  }));
}

async function saveProductsCloud(username, products) {
  const user = getUser(username);

  await fetch(
    `${SUPABASE_URL}/rest/v1/items?user_id=eq.${user}`,
    {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    }
  );

  const rows = products.map((p) => ({
    id: p.id,
    user_id: user,
    name: p.name,
    note: p.note,
    quantity: p.quantity,
    unit: p.unit,
    price: p.price,
    expiry: p.expiryDate || null,
    location: p.location,
    barcode: p.barcode
  }));

  await fetch(`${SUPABASE_URL}/rest/v1/items`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(rows)
  });
}

async function loadWasteHistoryCloud(username) {
  return [];
}

async function saveWasteHistoryCloud(username, history) {
  return true;
}
