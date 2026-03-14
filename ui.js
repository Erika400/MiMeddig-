function openAddModal(){

document.getElementById("modal").style.display="flex"

}

function closeModal(){

document.getElementById("modal").style.display="none"

}

function openItemModal(item){

let box=document.getElementById("itemDetails")

box.innerHTML=""

box.innerHTML+=`<h3>${item.name}</h3>`
box.innerHTML+=`<p>Lejár: ${item.expiry}</p>`
box.innerHTML+=`<p>Mennyiség: ${item.qty} ${item.unit}</p>`
box.innerHTML+=`<p>Ár: ${item.price} Ft</p>`

box.innerHTML+=`<button onclick="consumeItem(${item.id})">Elfogyasztva</button>`
box.innerHTML+=`<button onclick="wasteItem(${item.id})">Kidobva</button>`
box.innerHTML+=`<button onclick="addToShopping(${item.id})">Bevásárlólistára</button>`
box.innerHTML+=`<button onclick="deleteItem(${item.id})">Törlés</button>`

document.getElementById("itemModal").style.display="flex"

}
