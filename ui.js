function createItemElement(item){
    const div = document.createElement("div");
    div.className = "item";
    div.dataset.id = item.id;
    div.textContent = item.name;
    div.onclick = () => openModal(item);
    return div;
}

function renderItems(){
    const places = ["fridge","freezer","pantry","bath","meds","cosmetics"];
    const items = JSON.parse(localStorage.getItem("items") || "[]");

    places.forEach(placeId => {
        const container = document.getElementById(placeId);
        container.innerHTML = `<h3>${container.id.charAt(0).toUpperCase()+container.id.slice(1)}</h3>`;
        items.filter(i=>i.place===placeId).forEach(item=>{
            const el = createItemElement(item);
            container.appendChild(el);
        });
    });
}

function renderShopping(){
    const shoppingList = document.getElementById("shoppingList");
    shoppingList.innerHTML = "";
    const shopping = JSON.parse(localStorage.getItem("shopping") || "[]");
    shopping.forEach(item=>{
        const div = document.createElement("div");
        div.textContent = item;
        shoppingList.appendChild(div);
    });
}

// DRAG & DROP
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

// GRAFIKON
function calculateWasteData(){
  const items = JSON.parse(localStorage.getItem("items") || "[]");
  const now = new Date();
  const weekly = items.filter(i=>i.wasteDate && (new Date(i.wasteDate) > new Date(now.getTime()-7*24*60*60*1000)));
  const monthly = items.filter(i=>i.wasteDate && (new Date(i.wasteDate) > new Date(now.getTime()-30*24*60*60*1000)));
  const sum = arr => arr.reduce((a,b)=>a + (b.price || 0),0);
  return {
    weeklyCount: weekly.length,
    weeklyValue: sum(weekly),
    monthlyCount: monthly.length,
    monthlyValue: sum(monthly)
  };
}

function renderWasteChart(){
  const data = calculateWasteData();
  const ctx = document.getElementById("wasteChart").getContext("2d");
  if(window.wasteChartObj) window.wasteChartObj.destroy();
  window.wasteChartObj = new Chart(ctx,{
    type: 'bar',
    data:{
      labels: ["Heti db","Heti Ft","Havi db","Havi Ft"],
      datasets:[{
        label:"Veszteség",
        data:[data.weeklyCount, data.weeklyValue, data.monthlyCount, data.monthlyValue],
        backgroundColor:["#ff7b7b","#ff7b7b","#ffb86c","#ffb86c"]
      }]
    },
    options:{
      responsive:true,
      plugins:{legend:{display:false}}
    }
  });
}

// REFRESH UI + drag&drop + grafikon
const originalRefresh = refreshUI;
refreshUI = function(){
    originalRefresh();
    makeDraggable();
    renderWasteChart();
}
