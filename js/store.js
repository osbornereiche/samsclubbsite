(function (global) {
  "use strict";

  var SESSION_KEY = "clubsams_session";
  var CART_KEY = "clubsams_cart";
  var FULFILLMENT_KEY = "clubsams_fulfillment";
  var ORDERS_KEY = "clubsams_orders";

  var STORES = [
    { id: "dallas", name: "North Dallas, TX", address: "5959 Royal Ln, Dallas, TX 75231", zip: "75231" },
    { id: "miami", name: "Miami, FL", address: "1200 NW 87th Ave, Miami, FL 33172", zip: "33172" },
    { id: "la", name: "Los Angeles, CA", address: "9800 Beverly Blvd, Los Angeles, CA 90210", zip: "90210" },
    { id: "nyc", name: "Manhattan, NY", address: "770 Broadway, New York, NY 10003", zip: "10003" },
    { id: "chicago", name: "Chicago, IL", address: "2500 N Elston Ave, Chicago, IL 60647", zip: "60601" },
    { id: "houston", name: "Houston, TX", address: "8700 Westpark Dr, Houston, TX 77063", zip: "77001" }
  ];

  var PICKUP_SLOTS = [
    "9:00 AM – 10:00 AM", "10:00 AM – 11:00 AM", "11:00 AM – 12:00 PM",
    "12:00 PM – 1:00 PM", "1:00 PM – 2:00 PM", "2:00 PM – 3:00 PM",
    "3:00 PM – 4:00 PM", "4:00 PM – 5:00 PM", "5:00 PM – 6:00 PM",
    "6:00 PM – 7:00 PM", "7:00 PM – 8:00 PM"
  ];

  var DELIVERY_SLOTS = [
    "10:00 AM – 12:00 PM", "12:00 PM – 2:00 PM", "2:00 PM – 4:00 PM",
    "4:00 PM – 6:00 PM", "6:00 PM – 8:00 PM"
  ];

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  function slugify(text) {
    return (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60);
  }

  function parsePrice(text) {
    var n = parseFloat(String(text || "").replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : n;
  }

  function formatMoney(n) {
    return "$" + n.toFixed(2);
  }

  function getSession() {
    return readJSON(SESSION_KEY, null);
  }

  function setSession(user) {
    writeJSON(SESSION_KEY, user);
    document.dispatchEvent(new CustomEvent("clubsams:session"));
  }

  function clearSession() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
    document.dispatchEvent(new CustomEvent("clubsams:session"));
  }

  function getCart() {
    return readJSON(CART_KEY, []);
  }

  function saveCart(cart) {
    writeJSON(CART_KEY, cart);
    document.dispatchEvent(new CustomEvent("clubsams:cart"));
  }

  function getCartCount(cart) {
    cart = cart || getCart();
    return cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  function getCartTotal(cart) {
    cart = cart || getCart();
    return cart.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);
  }

  function addToCart(product) {
    var cart = getCart().slice();
    var index = cart.findIndex(function (item) { return item.id === product.id; });
    if (index >= 0) {
      cart[index] = Object.assign({}, cart[index], { qty: cart[index].qty + 1 });
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty: 1
      });
    }
    saveCart(cart);
    return cart;
  }

  function updateQty(id, qty) {
    var nextQty = Math.max(1, qty);
    var cart = getCart().map(function (item) {
      if (item.id !== id) return item;
      return Object.assign({}, item, { qty: nextQty });
    });
    saveCart(cart);
    return cart;
  }

  function removeFromCart(id) {
    var cart = getCart().filter(function (item) { return item.id !== id; });
    saveCart(cart);
    return cart;
  }

  function clearCart() {
    saveCart([]);
  }

  function getStores() {
    return STORES.slice();
  }

  function getStoreById(id) {
    return STORES.find(function (s) { return s.id === id; }) || STORES[0];
  }

  function formatDateLabel(dateStr) {
    var d = new Date(dateStr + "T12:00:00");
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    var target = new Date(d);
    target.setHours(0, 0, 0, 0);
    var weekday = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    if (+target === +today) return "Today · " + weekday;
    if (+target === +tomorrow) return "Tomorrow · " + weekday;
    return weekday;
  }

  function localDateISO(date) {
    var d = date || new Date();
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return y + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  }

  function getAvailableDates(days) {
    days = days || 7;
    var dates = [];
    var now = new Date();
    for (var i = 0; i < days; i++) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      var iso = localDateISO(d);
      dates.push({ value: iso, label: formatDateLabel(iso) });
    }
    return dates;
  }

  function slotStartHour(slot) {
    var match = String(slot).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return 0;
    var h = parseInt(match[1], 10);
    var m = parseInt(match[2], 10);
    var ampm = match[3].toUpperCase();
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return h + m / 60;
  }

  function getTimeSlots(mode, dateStr) {
    var slots = mode === "delivery" ? DELIVERY_SLOTS : PICKUP_SLOTS;
    var today = localDateISO();
    if (dateStr !== today) {
      return slots.map(function (s) { return { value: s, label: s, disabled: false }; });
    }
    var nowHour = new Date().getHours() + new Date().getMinutes() / 60 + 1;
    return slots.map(function (s) {
      var disabled = slotStartHour(s) <= nowHour;
      return { value: s, label: s, disabled: disabled };
    });
  }

  function defaultFulfillment() {
    return {
      mode: "pickup",
      storeId: STORES[0].id,
      date: getAvailableDates(1)[0].value,
      slot: "",
      address: { line1: "", line2: "", city: "", state: "", zip: "" }
    };
  }

  function getFulfillment() {
    var saved = readJSON(FULFILLMENT_KEY, null);
    var base = defaultFulfillment();
    if (!saved) return base;
    var merged = Object.assign({}, base, saved, {
      address: Object.assign({}, base.address, saved.address || {})
    });
    var validDates = getAvailableDates(7).map(function (d) { return d.value; });
    if (!merged.date || validDates.indexOf(merged.date) < 0) {
      merged.date = base.date;
    }
    return merged;
  }

  function setFulfillment(data) {
    var next = Object.assign(getFulfillment(), data || {});
    writeJSON(FULFILLMENT_KEY, next);
    document.dispatchEvent(new CustomEvent("clubsams:fulfillment"));
    return next;
  }

  function validateFulfillment(f) {
    f = f || getFulfillment();
    var errors = [];
    if (!f.mode || (f.mode !== "pickup" && f.mode !== "delivery")) {
      errors.push("Choose pickup or delivery.");
    }
    if (!f.storeId) errors.push("Select a club location.");
    if (!f.date) errors.push("Choose a date.");
    if (!f.slot) errors.push("Choose a time window.");
    if (f.mode === "delivery") {
      var a = f.address || {};
      if (!a.line1 || !a.line1.trim()) errors.push("Enter a delivery street address.");
      if (!a.city || !a.city.trim()) errors.push("Enter a delivery city.");
      if (!a.state || !a.state.trim()) errors.push("Enter a delivery state.");
      if (!a.zip || !/^\d{5}$/.test(a.zip.trim())) errors.push("Enter a valid 5-digit ZIP code.");
    }
    var slots = getTimeSlots(f.mode, f.date);
    var slotOk = slots.some(function (s) { return s.value === f.slot && !s.disabled; });
    if (f.slot && !slotOk) errors.push("That time slot is no longer available.");
    return { valid: errors.length === 0, errors: errors };
  }

  function saveOrder(cart, fulfillment, session) {
    var order = {
      id: "CS-" + Date.now().toString(36).toUpperCase(),
      createdAt: new Date().toISOString(),
      items: cart.slice(),
      subtotal: getCartTotal(cart),
      fulfillment: Object.assign({}, fulfillment, {
        store: getStoreById(fulfillment.storeId)
      }),
      customer: session ? { email: session.email, name: session.name || session.email } : null
    };
    var orders = readJSON(ORDERS_KEY, []);
    orders.unshift(order);
    writeJSON(ORDERS_KEY, orders.slice(0, 20));
    document.dispatchEvent(new CustomEvent("clubsams:order", { detail: order }));
    return order;
  }

  function productFromCard(card) {
    var img = card.querySelector(".product-card__img img");
    var nameEl = card.querySelector("h3");
    var priceEl = card.querySelector(".product-card__price");
    var name = nameEl ? nameEl.textContent.trim() : "Product";
    var imageSrc = img ? (img.getAttribute("src") || img.currentSrc || "") : "";
    return {
      id: slugify(name),
      name: name,
      price: parsePrice(priceEl ? priceEl.textContent : "0"),
      image: imageSrc
    };
  }

  global.ClubSamsStore = {
    SESSION_KEY: SESSION_KEY,
    CART_KEY: CART_KEY,
    slugify: slugify,
    parsePrice: parsePrice,
    formatMoney: formatMoney,
    getSession: getSession,
    setSession: setSession,
    clearSession: clearSession,
    getCart: getCart,
    saveCart: saveCart,
    getCartCount: getCartCount,
    getCartTotal: getCartTotal,
    addToCart: addToCart,
    updateQty: updateQty,
    removeFromCart: removeFromCart,
    clearCart: clearCart,
    productFromCard: productFromCard,
    getStores: getStores,
    getStoreById: getStoreById,
    getAvailableDates: getAvailableDates,
    getTimeSlots: getTimeSlots,
    getFulfillment: getFulfillment,
    setFulfillment: setFulfillment,
    validateFulfillment: validateFulfillment,
    saveOrder: saveOrder,
    formatDateLabel: formatDateLabel
  };
})(window);
