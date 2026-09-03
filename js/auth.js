(function () {
  "use strict";

  var form = document.getElementById("login-form");
  var emailInput = document.getElementById("login-email");
  var passwordInput = document.getElementById("login-password");
  var emailError = document.getElementById("email-error");
  var passwordError = document.getElementById("password-error");
  var toggleBtn = document.querySelector("[data-password-toggle]");
  var alreadyPanel = document.getElementById("auth-already");
  var store = window.ClubSamsStore;

  function getRedirect() {
    var params = new URLSearchParams(window.location.search);
    return params.get("redirect") === "checkout" ? "index.html?openCart=1" : "index.html";
  }

  function showError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.hidden = !msg;
  }

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function checkAlreadyLoggedIn() {
    var session = store.getSession();
    if (session && alreadyPanel && form) {
      alreadyPanel.hidden = false;
      form.hidden = true;
    }
  }

  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener("click", function () {
      var isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      toggleBtn.textContent = isPassword ? "Hide" : "Show";
      toggleBtn.setAttribute("aria-pressed", isPassword ? "true" : "false");
    });
  }

  var forceLogout = document.querySelector("[data-force-logout]");
  if (forceLogout) {
    forceLogout.addEventListener("click", function () {
      store.clearSession();
      if (alreadyPanel) alreadyPanel.hidden = true;
      if (form) form.hidden = false;
    });
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      showError(emailError, "");
      showError(passwordError, "");

      var email = (emailInput.value || "").trim().toLowerCase();
      var password = passwordInput.value || "";

      if (!validateEmail(email)) {
        showError(emailError, "Please enter a valid email address.");
        emailInput.focus();
        return;
      }

      if (password.length < 6) {
        showError(passwordError, "Password must be at least 6 characters.");
        passwordInput.focus();
        return;
      }

      var demoOk =
        (email === "demo@clubsamsgrocery.com" && password === "demo123") ||
        password.length >= 6;

      if (!demoOk) {
        showError(passwordError, "Invalid email or password. Please try again.");
        return;
      }

      var firstName = email.split("@")[0].split(".")[0];
      firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

      store.setSession({
        email: email,
        firstName: firstName,
        loggedInAt: new Date().toISOString()
      });

      window.location.href = getRedirect();
    });
  }

  checkAlreadyLoggedIn();
})();
