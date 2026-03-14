/* ---------------------------
   UI.js – Javított verzió
----------------------------*/

// Regisztráció mezőből
function registerForm(){
  let username = document.getElementById("regUsername").value.trim();
  let password = document.getElementById("regPassword").value.trim();
  if(!username || !password){ alert("Adj meg felhasználónevet és jelszót!"); return; }
  let users = getUsers();
  if(users.find(u=>u.username===username)){ alert("Ez a felhasználónév már foglalt!"); return; }
  users.push({username,password,premium:"demo",family:[]});
  saveUsers(users);
  localStorage.setItem("currentUser", username);
  showApp();
}

/* ---------------------------
   Termék modal
---------------------------- */
function openAddModal(itemId=null) {
  document.getElementById("modal").style.display = "flex";

  if(itemId){
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

/* ---------------------------
   Termék mentés
---------------------------- */
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
    let newItem = {
      id: Date.now().toString(),
      name, barcode, qty, unit, price, expiry, location, toShopping
    };
    items.push(newItem);
  }
  saveItems(items);
  closeModal();
  loadItems();
  loadShopping();
  updateStats();
}

/* ---------------------------
   Termékek megjelenítése
---------------------------- */
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
      span.dataset.id = item.id;
      span.onclick = ()=> openItemModal(item.id);
      el.appendChild(span);
    });
  });
}

/* ---------------------------
   Bevásárlólista
---------------------------- */
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

/* ---------------------------
   Státusz
---------------------------- */
function getStatus(expiry){
  if(!expiry) return "good";
  let today = new Date();
  let exp = new Date(expiry);
  let diff = (exp - today)/(1000*60*60*24);
  if(diff<0) return "expired";
  else if(diff<=2) return "soon";
  else return "good";
}

/* ---------------------------
   Termék részletek popup
---------------------------- */
function openItemModal(itemId){
  let items = getItems();
  let item = items.find(i=>i.id===itemId);
  if(!item) return;
  let modalBox = document.getElementById("itemDetails");
  modalBox.innerHTML = `
