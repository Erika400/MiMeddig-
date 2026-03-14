// UI funkciók, popupok, drag & drop alap

// Modal nyitás / bezárás
function openAddModal(itemId=null) {
  document.getElementById("modal").style.display = "flex";
  
  if(itemId){
    // Szerkesztés esetén előtöltés
    let items = getItems();
    let item = items.find(i => i.id === itemId);
    if(item){
      document.getElementById("itemName").value = item.name;
      document.getElementById("barcode").value = item.barcode || "";
      document.getElementById("quantity").value = item.qty;
      document.getElementById("unit").value = item.unit;
      document.getElementById("price").value = item.price;
      document.getElementById("expiry").value = item.expiry;
      document.getElementById("location").value = item.location;
      document.getElementById("toShopping").checked = item.toShopping || false;
      document.getElementById("modal").dataset.editId = itemId;
    }
  } else {
    // Új termék
    document.getElementById("modal").dataset.editId = "";
    document.getElementById("itemName").value = "";
    document.getElementById("barcode").value = "";
    document.getElementById("quantity").value = "";
    document.getElementById("unit").value = "db";
    document.getElementById("price").value = "";
    document.getElementById("expiry").value = "";
    document.getElementById("location").value = "fridge";
    document.getElementById("toShopping").checked = false;
  }
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

// Termék mentése
function saveItem() {
  let id = document.getElementById("modal").dataset.editId;
  let name = document.getElementById("itemName").value.trim();
  if(!name) { alert("Add meg a termék nevét!"); return; }
  let barcode = document.getElementById("barcode").value.trim();
  let qty = parseFloat(document.getElementById("quantity").value);
  let unit = document.getElementById("unit").value;
  let price = parseFloat(document.getElementById("price").value);
  let expiry = document.getElementById("expiry").value;
  let location = document.getElementById("location").value;
  let toShopping = document.getElementById("toShopping").checked;

  let items = getItems();
  if(id){
    // Szerkesztés
    let item = items.find(i => i.id === id);
    if(item){
      item.name = name;
      item.barcode = barcode;
      item.qty = qty;
      item.unit = unit;
      item.price = price;
      item.expiry = expiry;
      item.location = location;
      item.toShopping = toShopping;
    }
  } else {
    // Új termék
    let newItem = {
      id: Date.now().toString(),
      name,
      barcode,
      qty,
      unit,
      price,
      expiry,
      location,
      toShopping
    };
    items.push(newItem);
  }
  saveItems(items);
  closeModal();
  loadItems();
  loadShopping();
  updateStats();
}

// Termékek betöltése és megjelenítése a térképen
function loadItems() {
  let items = getItems();
  let places = ["fridge","freezer","pantry","bath","meds","cosmetics"];
  places.forEach(p=>{
    let el = document.getElementById(p);
    el.innerHTML = `<h3>${el.querySelector("h3").textContent}</h3>`;
    items.filter(i=>i.location===p).forEach(item=>{
      let status = getStatus(item.expiry);
      let span = document.createElement("span");
      span.className = `item ${status}`;
      span.textContent = `${item.name} (${item.qty}${item.unit})`;
      span.onclick = ()=> openItemModal(item.id);
      el.appendChild(span);
    });
  });
}

// Bevásárlólista
function loadShopping() {
  let shopping = getShopping();
  let container = document.getElementById("shoppingList");
  container.innerHTML = "";
  shopping.forEach(i=>{
    let div = document.createElement("div");
    div.textContent = `${i.name} (${i.qty}${i.unit})`;
    container.appendChild(div);
  });
}

// Termék státusz
function getStatus(expiry){
  if(!expiry) return "good";
  let today = new Date();
  let exp = new Date(expiry);
  let diff = (exp - today)/(1000*60*60*24);
  if(diff<0) return "expired";
  else if(diff<=2) return "soon";
  else return "good";
}

// Popup termék részletek
function openItemModal(itemId){
  let items = getItems();
  let item = items.find(i=>i.id===itemId);
  if(!item) return;
  let modalBox = document.getElementById("itemDetails");
  modalBox.innerHTML = `
    <h3>${item.name}</h3>
    <p>Mennyiség: ${item.qty} ${item.unit}</p>
    <p>Ár: ${item.price} Ft</p>
    <p>Lejárat: ${item.expiry || "Nincs"} </p>
    <button onclick="consumeItem('${item.id}')">Elfogyasztva</button>
    <button onclick="wasteItem('${item.id}')">Kidobva</button>
    <button onclick="toggleShopping('${item.id}')">Bevásárlólistára</button>
    <button onclick="deleteItem('${item.id}')">Törlés</button>
    <button onclick="editItem('${item.id}')">Szerkeszt</button>
    <button onclick="closeItemModal()">Mégse</button>
  `;
  document.getElementById("itemModal").style.display = "flex";
}

function closeItemModal(){
  document.getElementById("itemModal").style.display = "none";
}

// Popup gombok
function consumeItem(id){
  let qty = parseFloat(prompt("Mennyit fogyasztottál?"));
  if(isNaN(qty) || qty<=0) return;
  adjustItemQty(id, qty, "consume");
  closeItemModal();
}

function wasteItem(id){
  let qty = parseFloat(prompt("Mennyit dobtál ki?"));
  if(isNaN(qty) || qty<=0) return;
  adjustItemQty(id, qty, "waste");
  closeItemModal();
}

// Termék mennyiség kezelése
function adjustItemQty(id, qty, type){
  let items = getItems();
  let item = items.find(i=>i.id===id);
  if(!item) return;
  if(qty >= item.qty){
    if(type==="waste") addWasteStats(item, item.qty);
    item.qty = 0;
  } else {
    if(type==="waste") addWasteStats(item, qty);
    item.qty -= qty;
  }
  saveItems(items);
  loadItems();
  updateStats();
}

// Termék törlés
function deleteItem(id){
  if(!confirm("Biztos törlöd a terméket?")) return;
  let items = getItems();
  items = items.filter(i=>i.id!==id);
  saveItems(items);
  loadItems();
  updateStats();
  closeItemModal();
}

// Termék szerkesztés
function editItem(id){
  openAddModal(id);
  closeItemModal();
}

// Bevásárlólista toggle
function toggleShopping(id){
  let items = getItems();
  let item = items.find(i=>i.id===id);
  if(!item) return;
  let shopping = getShopping();
  if(shopping.find(i=>i.id===id)){
    shopping = shopping.filter(i=>i.id!==id);
  } else {
    shopping.push(item);
  }
  saveShopping(shopping);
  loadShopping();
}

// Statisztika frissítés
function updateStats(){
  let items = getItems();
  let weekLoss = 0, monthLoss = 0;
  let today = new Date();
  items.forEach(i=>{
    // Ha kidobva lett, hozzáadódik
    if(i.wasted && i.wastedDate){
      let diff = (today - new Date(i.wastedDate))/(1000*60*60*24);
      weekLoss += (diff<=7)? i.price * (i.wastedQty/i.qty) : 0;
      monthLoss += (diff<=30)? i.price * (i.wastedQty/i.qty) : 0;
    }
  });
  document.getElementById("weekLoss").textContent = Math.round(weekLoss);
  document.getElementById("monthLoss").textContent = Math.round(monthLoss);

  // TODO: Chart.js grafikon frissítés
}
