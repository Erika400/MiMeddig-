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

// TERMÉK MODAL
let currentItem = null;

function openModal(item){
  currentItem = item;
  const info = document.getElementById("itemInfo");
  info.innerHTML = `<strong>${item.name}</strong><br>Hely: ${item.place}`;
  document.getElementById("itemModal").style.display = "flex";
}

function closeModal(){
  currentItem = null;
  document.getElementById("itemModal").style.display = "none";
}

function consumeItem(){
  if(!currentItem) return;
  alert(`${currentItem.name} elfogyasztva`);
  closeModal();
}

function wasteItem(){
  if(!currentItem) return;
  alert(`${currentItem.name} kidobva`);
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
    alert(`${currentItem.name} törölve`);
    closeModal();
  }
}
