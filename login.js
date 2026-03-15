function getUserData() {
  let users = JSON.parse(localStorage.getItem("users") || "{}");

  if (!users["Erika"]) {
    users["Erika"] = {
      password: "Erika",
      email: "admin@saveit.local",
      type: "premiumPro",
      family: [],
      isAdmin: true
    };
    localStorage.setItem("users", JSON.stringify(users));
  }

  return users;
}

function setUserData(data) {
  localStorage.setItem("users", JSON.stringify(data));
}

function showLoginTab(){
  document.getElementById("loginTab").style.display = "block";
  document.getElementById("registerTab").style.display = "none";
  document.getElementById("loginTabBtn").classList.add("active");
  document.getElementById("registerTabBtn").classList.remove("active");
}

function showRegisterTab(){
  document.getElementById("loginTab").style.display = "none";
  document.getElementById("registerTab").style.display = "block";
  document.getElementById("registerTabBtn").classList.add("active");
  document.getElementById("loginTabBtn").classList.remove("active");
}

function login(){
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();

  if(!user || !pass){
    alert("Kérlek add meg a felhasználónevet és a jelszót.");
    return;
  }

  const users = getUserData();

  if(users[user] && users[user].password === pass){
    localStorage.setItem("currentUser", user);

    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("app").style.display = "block";

    if (typeof loadMap === "function") loadMap();
    if (typeof loadShopping === "function") loadShopping();
    if (typeof refreshUI === "function") refreshUI();
  } else {
    alert("Helytelen felhasználónév vagy jelszó.");
  }
}

function registerForm(){
  const username = document.getElementById("regUsername").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();

  if(!username || !email || !password){
    alert("Kérlek minden mezőt tölts ki.");
    return;
  }

  const users = getUserData();

  if(users[username]){
    alert("Ez a név már foglalt.");
    return;
  }

  users[username] = {
    password: password,
    email: email,
    type: "demo",
    family: [],
    isAdmin: false
  };

  setUserData(users);

  alert("Sikeres regisztráció. A visszaigazoló email teszt módban elküldve.");

  document.getElementById("regUsername").value = "";
  document.getElementById("regEmail").value = "";
  document.getElementById("regPassword").value = "";

  showLoginTab();
}

function logout(){
  localStorage.removeItem("currentUser");
  document.getElementById("app").style.display = "none";
  document.getElementById("loginScreen").style.display = "flex";
}

function showAdminPanel(){
  const currentUser = localStorage.getItem("currentUser");
  const users = getUserData();

  if(!currentUser || !users[currentUser] || !users[currentUser].isAdmin){
    alert("Ehhez nincs jogosultságod.");
    return;
  }

  document.getElementById("map").style.display = "none";
  document.getElementById("shopping").style.display = "none";
  document.getElementById("adminPanel").style.display = "block";

  const box = document.getElementById("adminUsersList");
  box.innerHTML = "";

  Object.keys(users).forEach(name => {
    const u = users[name];
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${name}</strong><br>
      Email: ${u.email || "-"}<br>
      Csomag: ${u.type || "demo"}
    `;
    box.appendChild(div);
  });
}

window.addEventListener("load", () => {
  getUserData();

  const currentUser = localStorage.getItem("currentUser");
  if(currentUser){
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("app").style.display = "block";
    if (typeof loadMap === "function") loadMap();
    if (typeof loadShopping === "function") loadShopping();
    if (typeof refreshUI === "function") refreshUI();
  }
});
