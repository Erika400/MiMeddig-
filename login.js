function login(){

let user=document.getElementById("username").value
let pass=document.getElementById("password").value

if(!user)return

localStorage.setItem("logged","1")

document.getElementById("loginScreen").style.display="none"
document.getElementById("appScreen").style.display="block"

initApp()

}

function logout(){

localStorage.removeItem("logged")
location.reload()

}

window.onload=function(){

if(localStorage.getItem("logged")){

document.getElementById("loginScreen").style.display="none"
document.getElementById("appScreen").style.display="block"

initApp()

}

}
