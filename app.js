let items=[]
let shopping=[]

function initApp(){

items=getItems()
shopping=getShopping()

render()

}

function saveItem(){

let name=document.getElementById("itemName").value

if(!name)return

let item={

id:Date.now(),
name:name,
qty:Number(document.getElementById("quantity").value)||1,
unit:document.getElementById("unit").value,
price:Number(document.getElementById("price").value)||0,
expiry:document.getElementById("expiry").value,
location:document.getElementById("location").value,
status:"active"

}

items.push(item)

if(document.getElementById("toShopping").checked){

shopping.push(name)

}

saveItems(items)
saveShopping(shopping)

document.getElementById("modal").style.display="none"

render()

}

function render(){

document.querySelectorAll(".place").forEach(p=>p.querySelectorAll(".item").forEach(i=>i.remove()))

let now=new Date()

items.forEach(i=>{

if(i.status!="active")return

let el=document.createElement("div")

el.className="item"

let exp=new Date(i.expiry)
let days=(exp-now)/86400000

if(days<0)el.classList.add("expired")
else if(days<3)el.classList.add("soon")
else el.classList.add("good")

el.innerText=i.name

el.onclick=()=>openItemModal(i)

document.getElementById(i.location).appendChild(el)

})

calcStats()

}

function consumeItem(id){

let item=items.find(i=>i.id==id)

item.status="consumed"

saveItems(items)

render()

}

function wasteItem(id){

let item=items.find(i=>i.id==id)

item.status="wasted"

saveItems(items)

render()

}

function deleteItem(id){

items=items.filter(i=>i.id!=id)

saveItems(items)

render()

}

function addToShopping(id){

let item=items.find(i=>i.id==id)

shopping.push(item.name)

saveShopping(shopping)

}

function calcStats(){

let week=0
let month=0

items.forEach(i=>{

if(i.status!="wasted")return

let value=i.price*i.qty

week+=value
month+=value

})

document.getElementById("weekLoss").innerText=week
document.getElementById("monthLoss").innerText=month

}

function showShopping(){

document.getElementById("mapView").style.display="none"
document.getElementById("shoppingView").style.display="block"

let box=document.getElementById("shoppingList")

box.innerHTML=""

shopping.forEach((s,i)=>{

box.innerHTML+=`<p>${s} <button onclick="removeShop(${i})">X</button></p>`

})

}

function removeShop(i){

shopping.splice(i,1)

saveShopping(shopping)

showShopping()

}

function showMap(){

document.getElementById("mapView").style.display="block"
document.getElementById("shoppingView").style.display="none"

}
