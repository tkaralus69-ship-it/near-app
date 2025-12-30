alert("SCRIPT IS LOADED");

// Elements
const status = document.getElementById("status");
const signup = document.getElementById("signup");
const login = document.getElementById("login");

signup.onclick = () => {
  status.textContent = "Sign Up button works ✅";
};

login.onclick = () => {
  status.textContent = "Login button works ✅";
};
