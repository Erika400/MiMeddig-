function showLoginTab() {
  document.getElementById("loginTab").style.display = "block";
  document.getElementById("registerTab").style.display = "none";
  document.getElementById("loginTabBtn").classList.add("active");
  document.getElementById("registerTabBtn").classList.remove("active");
}

function showRegisterTab() {
  document.getElementById("loginTab").style.display = "none";
  document.getElementById("registerTab").style.display = "block";
  document.getElementById("registerTabBtn").classList.add("active");
  document.getElementById("loginTabBtn").classList.remove("active");
}

function login() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!username || !password) {
    alert("Kérlek add meg a felhasználónevet és a jelszót.");
    return;
  }

  const users = getUsers();
  const user = users[username];

  if (!user || user.password !== password) {
    alert("Helytelen felhasználónév vagy jelszó.");
    return;
  }

  setCurrentUser(username);
  openApp();
}

function registerUser() {
  const username = document.getElementById("registerUsername").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();

  if (!username || !email || !password) {
    alert("Kérlek minden mezőt tölts ki.");
    return;
  }

  const users = getUsers();

  if (users[username]) {
    alert("Ez a név már foglalt.");
    return;
  }

  users[username] = {
    username,
    email,
    password,
    plan: "demo",
    family: [],
    isAdmin: false
  };

  saveUsers(users);

  alert("Sikeres regisztráció. A visszaigazoló email teszt módban elküldve.");
  showLoginTab();

  document.getElementById("registerUsername").value = "";
  document.getElementById("registerEmail").value = "";
  document.getElementById("registerPassword").value = "";
}

function logout() {
  clearCurrentUser();
  document.getElementById("appShell").style.display = "none";
  document.getElementById("authScreen").style.display = "flex";
}

function openApp() {
  document.getElementById("authScreen").style.display = "none";
  document.getElementById("appShell").style.display = "block";
  if (typeof initializeApp === "function") {
    initializeApp();
  }
}
