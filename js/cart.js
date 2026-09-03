(function () {
  "use strict";

  var store = window.ClubSamsStore;
  if (!store) return;

  var drawer = document.getElementById("cart-drawer");
  var overlay = document.querySelector("[data-cart-overlay]");
  var itemsEl = document.querySelector("[data-cart-items]");
  var subtotalEl = document.querySelector("[data-cart-subtotal]");
  var countEls = document.querySelectorAll("[data-cart-count]");
  var totalEls = document.querySelectorAll("[data-cart-total]");
  var toast = document.getElementById("cart-toast");
  var fulfillmentPanel = document.querySelector("[data-fulfillment-panel]");
  var orderSuccess = document.getElementById("order-success");

  function openCart() {
    if (!drawer) return;
    drawer.hidden = false;
    drawer.classList.add("is-open");
    if (overlay) {
      overlay.hidden = false;
      overlay.classList.add("is-visible");
    }
    document.body.classList.add("cart-open");
  }

  function closeCart() {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    if (overlay) overlay.classList.remove("is-visible");
    document.body.classList.remove("cart-open");
    setTimeout(function () {
      drawer.hidden = true;
      if (overlay) overlay.hidden = true;
    }, 300);
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  function renderCart() {
    var cart = store.getCart();
    var count = store.getCartCount(cart);
    var total = store.getCartTotal(cart);

    countEls.forEach(function (el) {
      el.textContent = String(count);
      el.hidden = count === 0;
    });

    totalEls.forEach(function (el) {
      el.textContent = store.formatMoney(total);
    });

    if (subtotalEl) subtotalEl.textContent = store.formatMoney(total);

    if (!itemsEl) return;

    if (!cart.length) {
      if (fulfillmentPanel) fulfillmentPanel.hidden = true;
      itemsEl.innerHTML =
        '<div class="cart-empty">' +
        '<div class="cart-empty-icon" aria-hidden="true">🛒</div>' +
        "<p>Your cart is empty</p>" +
        '<p class="cart-empty-sub">Browse member deals and add items to get started.</p>' +
        '<button class="btn btn-primary" type="button" data-cart-close-inline>Shop Products</button>' +
        "</div>";
      var inlineClose = itemsEl.querySelector("[data-cart-close-inline]");
      if (inlineClose) {
        inlineClose.addEventListener("click", function () {
          closeCart();
          var products = document.getElementById("productos");
          if (products) products.scrollIntoView({ behavior: "smooth" });
        });
      }
      return;
    }

    if (fulfillmentPanel) fulfillmentPanel.hidden = false;

    itemsEl.innerHTML = cart.map(function (item) {
      return (
        '<article class="cart-item" data-cart-item="' + item.id + '">' +
        '<img src="' + escapeHtml(item.image) + '" alt="" width="72" height="72" loading="lazy" />' +
        '<div class="cart-item-info">' +
        '<h4>' + escapeHtml(item.name) + "</h4>" +
        '<p class="cart-item-price">' + store.formatMoney(item.price) + " each</p>" +
        '<div class="cart-item-qty">' +
        '<button type="button" data-qty-minus aria-label="Decrease quantity">−</button>' +
        '<span>' + item.qty + "</span>" +
        '<button type="button" data-qty-plus aria-label="Increase quantity">+</button>' +
        "</div>" +
        "</div>" +
        '<div class="cart-item-right">' +
        '<strong>' + store.formatMoney(item.price * item.qty) + "</strong>" +
        '<button type="button" class="cart-item-remove" data-remove aria-label="Remove item">Remove</button>' +
        "</div>" +
        "</article>"
      );
    }).join("");

    itemsEl.querySelectorAll(".cart-item").forEach(function (row) {
      var id = row.getAttribute("data-cart-item");
      var minus = row.querySelector("[data-qty-minus]");
      var plus = row.querySelector("[data-qty-plus]");
      var remove = row.querySelector("[data-remove]");

      if (minus) {
        minus.addEventListener("click", function () {
          var item = store.getCart().find(function (i) { return i.id === id; });
          if (!item) return;
          if (item.qty <= 1) store.removeFromCart(id);
          else store.updateQty(id, item.qty - 1);
        });
      }
      if (plus) {
        plus.addEventListener("click", function () {
          var item = store.getCart().find(function (i) { return i.id === id; });
          if (item) store.updateQty(id, item.qty + 1);
        });
      }
      if (remove) {
        remove.addEventListener("click", function () {
          store.removeFromCart(id);
        });
      }
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  document.querySelectorAll("[data-cart-open]").forEach(function (btn) {
    btn.addEventListener("click", openCart);
  });

  document.querySelectorAll("[data-cart-close]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      if (btn.tagName === "A") e.preventDefault();
      closeCart();
      if (btn.tagName === "A" && btn.getAttribute("href") && btn.getAttribute("href").charAt(0) === "#") {
        var target = document.querySelector(btn.getAttribute("href"));
        if (target) target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  if (overlay) {
    overlay.addEventListener("click", closeCart);
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeCart();
  });

  document.querySelectorAll(".btn-add").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var card = btn.closest(".product-card");
      if (!card) return;
      var product = store.productFromCard(card);
      store.addToCart(product);
      showToast("✓ Added to cart: " + product.name);
      btn.textContent = "Added ✓";
      setTimeout(function () { btn.textContent = "Add to Cart"; }, 1500);
    });
  });

  var checkoutBtn = document.querySelector("[data-cart-checkout]");

  function showOrderSuccess(order) {
    var f = order.fulfillment;
    var mode = f.mode === "delivery" ? "Delivery" : "Curbside Pickup";
    var msg =
      "Order " + order.id + " confirmed! " + mode +
      " · " + store.formatDateLabel(f.date) + " · " + f.slot;
    showToast(msg);
    if (orderSuccess) {
      orderSuccess.querySelector("[data-order-id]").textContent = order.id;
      orderSuccess.querySelector("[data-order-mode]").textContent = mode;
      orderSuccess.querySelector("[data-order-when]").textContent =
        store.formatDateLabel(f.date) + " · " + f.slot;
      orderSuccess.querySelector("[data-order-where]").textContent =
        f.mode === "delivery"
          ? f.address.line1 + ", " + f.address.city + " " + f.address.state
          : f.store.name + " — " + f.store.address;
      orderSuccess.hidden = false;
      orderSuccess.classList.add("is-visible");
    }
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
      var cart = store.getCart();
      if (!cart.length) {
        showToast("Your cart is empty");
        return;
      }
      var session = store.getSession();
      if (!session) {
        closeCart();
        window.location.href = "login.html?redirect=checkout";
        return;
      }
      var fulfillment = store.getFulfillment();
      var check = store.validateFulfillment(fulfillment);
      if (!check.valid) {
        showToast(check.errors[0]);
        if (fulfillmentPanel) {
          fulfillmentPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
        return;
      }
      var order = store.saveOrder(cart, fulfillment, session);
      store.clearCart();
      showOrderSuccess(order);
    });
  }

  document.querySelectorAll("[data-order-close]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (orderSuccess) {
        orderSuccess.classList.remove("is-visible");
        orderSuccess.hidden = true;
      }
      closeCart();
    });
  });

  document.addEventListener("clubsams:cart", renderCart);
  renderCart();
})();
