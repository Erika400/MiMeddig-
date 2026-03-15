function getUserData() {
  return JSON.parse(localStorage.getItem("users") || "{}");
}

function setUserData(data) {
  localStorage.setItem("users", JSON.stringify(data));
}

function login(){
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();

  if(!user || !pass){
    alert("Kérlek add meg a felhasználónevet és a jelszót!");
    return;
  }

  let users = getUserData();

  if(users[user] && users[user].password === pass){
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("app").style.display = "block";

    const currentUser = users[user];

    // Demo limit ellenőrzés
    if(currentUser.type === "demo"){
      const items = JSON.parse(localStorage.getItem("items") || "[]");
      if(items.length >= 10){
        alert("Elérted az ingyenes verzió termék limitjét (10). Frissíts premiumra!");
      }
    }

    // PremiumPro családtagok betöltése
    if(currentUser.type === "premiumPro" && currentUser.family){
      currentUser.family.forEach(fam=>{
        const famItems = JSON.parse(localStorage.getItem(fam+"_items") || "[]");
        famItems.forEach(i=>addItemWithBarcode(i.name,i.place,i.barcode));
      });
    }

    loadMap();
    loadShopping();
  } else{
    alert("Helytelen felhasználónév vagy jelszó");
  }
}

function register(){
  const user = prompt("Adj meg egy felhasználónevet:");
  if(!user) return alert("Érvénytelen felhasználónév");
  const pass = prompt("Adj meg egy jelszót:");
  if(!pass) return alert("Érvénytelen jelszó");

  let users = getUserData();
  if(users[user]){
    return alert("Ez a felhasználónév már foglalt");
  }

  users[user] = {
    password: pass,
    type: "demo",  // demo / premium / premiumPro
    family: []
  };

  setUserData(users);
  alert("Sikeres regisztráció! Most már be tudsz lépni.");
}

// Családtag hozzáadás (csak premiumPro)
function addFamilyMember(memberName){
  const users = getUserData();
  const currentUser = users[document.getElementById("username").value];
  if(!currentUser) return alert("Hibás felhasználó");

  if(currentUser.type !== "premiumPro") return alert("Ez a funkció csak Premium Pro felhasználóknak elérhető.");

  if(!currentUser.family) currentUser.family = [];
  currentUser.family.push(memberName);
  setUserData(users);
  alert(`${memberName} hozzáadva a családtagokhoz. Most már láthatja a termékeket.`);
}

// Upgrade verziókhoz (mock fizetés)
function upgradePremium(type){
  const user = document.getElementById("username").value;
  const users = getUserData();
  if(!users[user]) return alert("Hibás felhasználó");

  if(type === "premium") {
    users[user].type = "premium";
    alert("Sikeres frissítés premiumra!");
  }
  if(type === "premiumPro") {
    users[user].type = "premiumPro";
    alert("Sikeres frissítés premiumPro-ra!");
  }

  setUserData(users);
}
