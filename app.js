// Fő app logika, drag & drop és térkép interakció

// Térkép nézet / bevásárló lista váltás
function showMap(){
  document.getElementById("mapView").style.display = "block";
  document.getElementById("shoppingView").style.display = "none";
}

function showShopping(){
  document.getElementById("mapView").style.display = "none";
  document.getElementById("shoppingView").style.display = "block";
}

// Termékek drag & drop (alap)
let draggedItem = null;

document.addEventListener("dragstart", function(e){
  if(e.target.classList.contains("item")){
    draggedItem = e.target.dataset.id;
  }
});

document.addEventListener("dragover", function(e){
  if(e.target.classList.contains("place")){
    e.preventDefault();
  }
});

document.addEventListener("drop", function(e){
  if(e.target.classList.contains("place") && draggedItem){
    let items = getItems();
    let item = items.find(i=>i.id===draggedItem);
    if(item){
      item.location = e.target.id;
      saveItems(items);
      loadItems();
    }
    draggedItem = null;
  }
});

// Termékek inicializálása (példa, ha nincs semmi)
function initDemoItems(){
  let items = getItems();
  if(items.length===0){
    items = [
      {id:"1", name:"Tej", qty:1, unit:"l", price:400, expiry:"2026-03-18", location:"fridge", toShopping:false},
      {id:"2", name:"Alma", qty:5, unit:"db", price:100, expiry:"2026-03-20", location:"fridge", toShopping:false},
    ];
    saveItems(items);
  }
}

// Waste stat frissítés
function addWasteStats(item, qty){
  if(!item.wasted) item.wasted = 0;
  if(!item.wastedQty) item.wastedQty = 0;
  item.wasted += qty * item.price / item.qty;
  item.wastedQty += qty;
  item.wastedDate = new Date();
}

// Page load
window.onload = function(){
  initDemoItems();
  loadItems();
  loadShopping();
  updateStats();
};
