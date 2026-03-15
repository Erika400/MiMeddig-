let items = JSON.parse(localStorage.getItem("items") || "[]")
let shopping = JSON.parse(localStorage.getItem("shopping") || "[]")

function saveItems(){
localStorage.setItem("items", JSON.stringify(items))
}

function saveShopping(){
localStorage.setItem("shopping", JSON.stringify(shopping))
}

function addItem(item){
items.push(item)
saveItems()
}

function removeItem(id){
items = items.filter(i => i.id !== id)
saveItems()
}

function updateItem(updated){
items = items.map(i => i.id === updated.id ? updated : i)
saveItems()
}

function addShopping(name){
shopping.push(name)
saveShopping()
}

function removeShopping(name){
shopping = shopping.filter(i => i !== name)
saveShopping()
}
