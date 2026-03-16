console.log("cloud.js betöltve");

async function loadItemsCloud() {
  return [];
}

async function saveItemsCloud(items) {
  console.log("Cloud items mentés később ide jön:", items);
  return true;
}

async function loadShoppingCloud() {
  return [];
}

async function saveShoppingCloud(list) {
  console.log("Cloud shopping mentés később ide jön:", list);
  return true;
}
