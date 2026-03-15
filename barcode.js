// Egyszerű manuális és későbbi barcode olvasó

function scanBarcode(){
    // Jelenleg csak prompt-tal működik teszteléshez
    const code = prompt("Add meg a vonalkódot vagy terméket:");
    if(!code) return;
    const items = JSON.parse(localStorage.getItem("items") || "[]");
    const found = items.find(i=>i.barcode === code);
    if(found){
        alert(`Megtalált termék: ${found.name}`);
        openModal(found);
    } else {
        alert("Termék nem található, hozzáadhatod manuálisan.");
    }
}

function addItemWithBarcode(name, place, barcode){
    const items = JSON.parse(localStorage.getItem("items") || "[]");
    const id = Date.now();
    items.push({id,name,place,barcode});
    localStorage.setItem("items", JSON.stringify(items));
    refreshUI();
}
