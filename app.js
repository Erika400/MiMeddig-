//////////////////////
// MAP / SHOP NAV
//////////////////////
function showMap(){
  document.getElementById("map").style.display = "block";
  document.getElementById("shopping").style.display = "none";
}

function showShopping(){
  document.getElementById("shopping").style.display = "block";
  document.getElementById("map").style.display = "none";
}

function logout(){
  document.getElementById("app").style.display = "none";
  document.getElementById("loginScreen").style.display = "block";
}

//////////////////////
// MAP BETÖLTÉS
//////////////////////
function loadMap(){
  const places = ["fridge","freezer","pantry","bath","meds","cosmetics"];
  places.forEach(place=>{
    const div = document.getElementById(place);
    div.innerHTML = `<h3>${div.id.charAt(0).toUpperCase()+div.id.slice(1)}</h3>`;
  });
}

function loadShopping(){
  const shoppingList = document.getElementById("shoppingList");
  shoppingList.innerHTML = "";
  const shopping = JSON.parse(localStorage.getItem("shopping") || "[]");
  shopping.forEach(item=>{
    const div = document.createElement("div");
    div.textContent = item;
    shoppingList.appendChild(div);
  });
}

//////////////////////
// TERMÉK MODAL
//////////////////////
let currentItem = null;

function openModal(item){
  currentItem = item;
  const info = document.getElementById("itemInfo");
  info.innerHTML = `<strong>${item.name}</strong><br>Hely: ${item.place}<br>Ár: ${item.price || 0} Ft<br>Mennyiség: ${item.amount || 1}`;
  document.getElementById("itemModal").style.display = "flex";
}

function closeModal(){
  currentItem = null;
  document.getElementById("itemModal").style.display = "none";
}

function consumeItem(){
  if(!currentItem) return;
  const amount = parseFloat(prompt("Mennyit fogyasztottál belőle?", currentItem.amount || 1));
  if(isNaN(amount) || amount <= 0) return;
  consumePartialItem(currentItem.id, amount);
  closeModal();
}

function wasteItem(){
  if(!currentItem) return;
  currentItem.wasteDate = new Date();
  alert(`${currentItem.name} kidobva`);
  refreshUI();
  closeModal();
}

function addShopping(){
  if(!currentItem) return;
  let shopping = JSON.parse(localStorage.getItem("shopping") || "[]");
  shopping.push(currentItem.name);
  localStorage.setItem("shopping", JSON.stringify(shopping));
  alert(`${currentItem.name} bekerült a bevásárlólistára`);
}

function deleteItem(){
  if(!currentItem) return;
  if(confirm(`Biztos törlöd ${currentItem.name}?`)){
    let items = JSON.parse(localStorage.getItem("items") || "[]");
    items = items.filter(i => i.id !== currentItem.id);
    localStorage.setItem("items", JSON.stringify(items));
    refreshUI();
    alert(`${currentItem.name} törölve`);
    closeModal();
  }
}

//////////////////////
// DRAG & DROP
//////////////////////
const places = document.querySelectorAll(".place");

places.forEach(place=>{
  place.addEventListener("dragover", e=>{
    e.preventDefault();
    place.style.background = "#fce4e4";
  });

  place.addEventListener("dragleave", e=>{
    place.style.background = "white";
  });

  place.addEventListener("drop", e=>{
    e.preventDefault();
    const id = e.dataTransfer.getData("text");
    const items = JSON.parse(localStorage.getItem("items") || "[]");
    const item = items.find(i=>i.id==id);
    if(item){
      item.place = place.id;
      localStorage.setItem("items", JSON.stringify(items));
      refreshUI();
      place.style.background = "white";
    }
  });
});

function makeDraggable(){
  const itemElements = document.querySelectorAll(".item");
  itemElements.forEach(el=>{
    el.setAttribute("draggable","true");
    el.addEventListener("dragstart", e=>{
      e.dataTransfer.setData("text", el.dataset.id);
    });
  });
}

//////////////////////
// PARTIAL CONSUME & LOSS
//////////////////////
function consumePartialItem(itemId, amountConsumed, unit="liter") {
  const items = JSON.parse(localStorage.getItem("items") || "[]");
  const item = items.find(i => i.id === itemId);
  if(!item) return;

  const originalAmount = item.amount || 1;
  const price = item.price || 0;

  const ratio = amountConsumed / originalAmount;
  const lossValue = ratio * price;

  item.amount = originalAmount - amountConsumed;

  if(item.amount <= 0){
    item.wasteDate = new Date();
  }

  localStorage.setItem("items", JSON.stringify(items));
  refreshUI();

  alert(`${item.name} részlegesen fogyasztva, veszteség: ${lossValue.toFixed(2)} Ft`);
}

//////////////////////
// SUBSCRIPTION / PREMIUM / PRO
//////////////////////
function checkUserLimits() {
    const username = document.getElementById("username").value;
    const users = getUserData();
    const currentUser = users[username];
    if(!currentUser) return;

    const items = JSON.parse(localStorage.getItem("items") || "[]");

    if(currentUser.type === "demo" && items.length >= 10){
        alert("Elérted az ingyenes demo verzió termék limitjét (10). Frissíts premiumra!");
        return false;
    }
    return true;
}

function addItemWithUserCheck(name, place, barcode, price=0){
    if(!checkUserLimits()) return;

    const items = JSON.parse(localStorage.getItem("items") || "[]");
    const id = Date.now();
    items.push({id,name,place,barcode,price});
    localStorage.setItem("items", JSON.stringify(items));
    refreshUI();
}

function syncFamilyItems() {
    const username = document.getElementById("username").value;
    const users = getUserData();
    const currentUser = users[username];
    if(!currentUser || currentUser.type !== "premiumPro") return;

    if(currentUser.family){
        currentUser.family.forEach(fam=>{
            const famItems = JSON.parse(localStorage.getItem(fam+"_items") || "[]");
            famItems.forEach(i=>addItemWithBarcode(i.name,i.place,i.barcode,i.price));
        });
    }
}

function mockUpgradeDemoToPremium(type){
    upgradePremium(type);
    alert(`Frissítés: ${type} sikeres!`);
}
