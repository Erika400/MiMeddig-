function login(){
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();

  if(!user || !pass){
    alert("Kérlek add meg a felhasználónevet és a jelszót!");
    return;
  }

  let users = JSON.parse(localStorage.getItem("users") || "{}");

  if(users[user] && users[user] === pass){
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("app").style.display = "block";
    loadMap();
    loadShopping();
  }else{
    alert("Helytelen felhasználónév vagy jelszó");
  }
}

function register(){
  const user = prompt("Adj meg egy felhasználónevet:");
  if(!user) return alert("Érvénytelen felhasználónév");
  const pass = prompt("Adj meg egy jelszót:");
  if(!pass) return alert("Érvénytelen jelszó");

  let users = JSON.parse(localStorage.getItem("users") || "{}");
  if(users[user]){
    return alert("Ez a felhasználónév már foglalt");
  }

  users[user] = pass;
  localStorage.setItem("users", JSON.stringify(users));
  alert("Sikeres regisztráció! Most már be tudsz lépni.");
}
