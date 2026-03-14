function getItems(){
return JSON.parse(localStorage.getItem("items")||"[]")
}

function saveItems(items){
localStorage.setItem("items",JSON.stringify(items))
}

function getShopping(){
return JSON.parse(localStorage.getItem("shopping")||"[]")
}

function saveShopping(list){
localStorage.setItem("shopping",JSON.stringify(list))
}
