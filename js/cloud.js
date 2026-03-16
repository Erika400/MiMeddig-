console.log("cloud.js loaded");

/* 
Ideiglenes cloud storage
Most még localStorage alapú "fake cloud".
Később Supabase/Firebase lesz.
*/

const CLOUD_KEY_ITEMS = "saveit_cloud_items";
const CLOUD_KEY_SHOPPING = "saveit_cloud_shopping";


async function loadItemsCloud() {
  try {
    const raw = localStorage.getItem(CLOUD_KEY_ITEMS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}


async function saveItemsCloud(items) {
  try {
    localStorage.setItem(CLOUD_KEY_ITEMS, JSON.stringify(items));
  } catch (e) {
    console.error("Cloud items save error", e);
  }
}


async function loadShoppingCloud() {
  try {
    const raw = localStorage.getItem(CLOUD_KEY_SHOPPING);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}


async function saveShoppingCloud(list) {
  try {
    localStorage.setItem(CLOUD_KEY_SHOPPING, JSON.stringify(list));
  } catch (e) {
    console.error("Cloud shopping save error", e);
  }
}
