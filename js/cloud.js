console.log("cloud.js betöltve");

async function loadProductsCloud(username) {
  console.log("Cloud products betöltés még nincs bekötve:", username);
  return [];
}

async function saveProductsCloud(username, products) {
  console.log("Cloud products mentés még nincs bekötve:", username, products);
  return true;
}

async function loadShoppingListCloud(username) {
  console.log("Cloud shopping list betöltés még nincs bekötve:", username);
  return [];
}

async function saveShoppingListCloud(username, list) {
  console.log("Cloud shopping list mentés még nincs bekötve:", username, list);
  return true;
}

async function loadKnownProductsCloud(username) {
  console.log("Cloud known products betöltés még nincs bekötve:", username);
  return {};
}

async function saveKnownProductsCloud(username, data) {
  console.log("Cloud known products mentés még nincs bekötve:", username, data);
  return true;
}

async function loadWasteHistoryCloud(username) {
  console.log("Cloud waste history betöltés még nincs bekötve:", username);
  return [];
}

async function saveWasteHistoryCloud(username, history) {
  console.log("Cloud waste history mentés még nincs bekötve:", username, history);
  return true;
}
