(function () {
  "use strict";

  var store = window.ClubSamsStore;

  function updateAccountUI() {
    var session = store ? store.getSession() : null;
    var link = document.querySelector("[data-account-link]");
    var label = document.querySelector("[data-account-label]");
    var signOutBtn = document.querySelector("[data-sign-out]");

    if (!link || !label) return;

    if (session && session.email) {
      var name = session.firstName || session.email.split("@")[0];
      name = name.charAt(0).toUpperCase() + name.slice(1);
      label.textContent = "Hi, " + name;
      link.href = "index.html";
      link.setAttribute("aria-label", "Signed in as " + session.email);
      if (signOutBtn) signOutBtn.hidden = false;
    } else {
      label.textContent = "Sign In";
      link.href = "login.html";
      link.setAttribute("aria-label", "Sign in to your account");
      if (signOutBtn) signOutBtn.hidden = true;
    }
  }

  document.addEventListener("clubsams:session", updateAccountUI);

  var signOutBtn = document.querySelector("[data-sign-out]");
  if (signOutBtn && store) {
    signOutBtn.addEventListener("click", function () {
      store.clearSession();
      updateAccountUI();
    });
  }

  updateAccountUI();
})();
