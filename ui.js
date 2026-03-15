// Egyszerű UI helper funkciók

function createItemElement(item){
    const div = document.createElement("div");
    div.className = "item";
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

// Frissítés hívás
function refreshUI(){
    renderItems();
    renderShopping();
}
