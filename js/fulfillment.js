(function () {
  "use strict";

  var store = window.ClubSamsStore;
  if (!store) return;

  var panel = document.querySelector("[data-fulfillment-panel]");
  if (!panel) return;

  var modeBtns = panel.querySelectorAll("[data-fulfillment-mode]");
  var storeSelect = panel.querySelector("[data-fulfillment-store]");
  var dateSelect = panel.querySelector("[data-fulfillment-date]");
  var slotSelect = panel.querySelector("[data-fulfillment-slot]");
  var pickupFields = panel.querySelector("[data-fulfillment-pickup]");
  var deliveryFields = panel.querySelector("[data-fulfillment-delivery]");
  var storeLabel = panel.querySelector("[data-fulfillment-store-label]");
  var summaryEl = panel.querySelector("[data-fulfillment-summary]");
  var addrLine1 = panel.querySelector("[data-addr-line1]");
  var addrLine2 = panel.querySelector("[data-addr-line2]");
  var addrCity = panel.querySelector("[data-addr-city]");
  var addrState = panel.querySelector("[data-addr-state]");
  var addrZip = panel.querySelector("[data-addr-zip]");

  function escapeAttr(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function fillSelect(el, options, selected) {
    if (!el) return;
    var hasSelected = options.some(function (opt) {
      var val = typeof opt === "string" ? opt : opt.value;
      return val === selected;
    });
    el.innerHTML = options.map(function (opt) {
      var val = typeof opt === "string" ? opt : opt.value;
      var label = typeof opt === "string" ? opt : opt.label;
      var disabled = opt.disabled ? " disabled" : "";
      var sel = val === selected ? " selected" : "";
      return '<option value="' + escapeAttr(val) + '"' + disabled + sel + ">" + escapeAttr(label) + "</option>";
    }).join("");
    if (selected && hasSelected) {
      el.value = selected;
    }
  }

  function populateStores(selectedId) {
    if (!storeSelect) return;
    var stores = store.getStores();
    storeSelect.innerHTML = stores.map(function (s) {
      var sel = s.id === selectedId ? " selected" : "";
      return '<option value="' + s.id + '"' + sel + ">" + s.name + " — " + s.address + "</option>";
    }).join("");
  }

  function populateDates(selectedDate) {
    if (!dateSelect) return;
    var dates = store.getAvailableDates(7);
    fillSelect(dateSelect, [{ value: "", label: "Select date…" }].concat(dates), selectedDate);
  }

  function populateSlots(mode, date, selectedSlot) {
    if (!slotSelect) return;
    var slots = store.getTimeSlots(mode, date);
    var options = [{ value: "", label: "Select time window…" }];
    slots.forEach(function (s) {
      options.push({ value: s.value, label: s.disabled ? s.label + " (unavailable)" : s.label, disabled: s.disabled });
    });
    fillSelect(slotSelect, options, selectedSlot);
  }

  function toggleModeUI(mode) {
    modeBtns.forEach(function (btn) {
      var active = btn.getAttribute("data-fulfillment-mode") === mode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    if (pickupFields) pickupFields.hidden = true;
    if (deliveryFields) deliveryFields.hidden = mode !== "delivery";
    if (storeLabel) {
      storeLabel.textContent = mode === "delivery" ? "Fulfilling club" : "Pickup location";
    }
  }

  function updateSummary(f) {
    if (!summaryEl) return;
    var loc = store.getStoreById(f.storeId);
    var modeLabel = f.mode === "delivery" ? "Delivery" : "Curbside Pickup";
    var dateLabel = f.date ? store.formatDateLabel(f.date) : "—";
    var slotLabel = f.slot || "—";
    var html =
      '<strong>' + modeLabel + "</strong> · " + loc.name +
      "<br><span>" + dateLabel + " · " + slotLabel + "</span>";
    if (f.mode === "delivery" && f.address && f.address.line1) {
      html += "<br><span>" + f.address.line1 + ", " + (f.address.city || "") + " " + (f.address.state || "") + " " + (f.address.zip || "") + "</span>";
    }
    summaryEl.innerHTML = html;
  }

  function readAddress() {
    return {
      line1: addrLine1 ? addrLine1.value.trim() : "",
      line2: addrLine2 ? addrLine2.value.trim() : "",
      city: addrCity ? addrCity.value.trim() : "",
      state: addrState ? addrState.value.trim().toUpperCase().slice(0, 2) : "",
      zip: addrZip ? addrZip.value.replace(/\D/g, "").slice(0, 5) : ""
    };
  }

  function writeAddress(addr) {
    addr = addr || {};
    if (addrLine1) addrLine1.value = addr.line1 || "";
    if (addrLine2) addrLine2.value = addr.line2 || "";
    if (addrCity) addrCity.value = addr.city || "";
    if (addrState) addrState.value = addr.state || "";
    if (addrZip) addrZip.value = addr.zip || "";
  }

  function syncPanelVisibility() {
    panel.hidden = !store.getCart().length;
  }

  function syncFormFromStore() {
    var f = store.getFulfillment();
    toggleModeUI(f.mode);
    populateStores(f.storeId);
    populateDates(f.date);
    populateSlots(f.mode, f.date, f.slot);
    writeAddress(f.address);
    updateSummary(f);
  }

  function persist(patch) {
    var current = store.getFulfillment();
    if (patch.address) {
      patch.address = Object.assign({}, current.address, patch.address);
    }
    var next = store.setFulfillment(patch);
    populateSlots(next.mode, next.date, next.slot);
    updateSummary(next);
    return next;
  }

  modeBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var mode = btn.getAttribute("data-fulfillment-mode");
      persist({ mode: mode, slot: "" });
      toggleModeUI(mode);
    });
  });

  if (storeSelect) {
    storeSelect.addEventListener("change", function () {
      persist({ storeId: storeSelect.value });
    });
  }

  if (dateSelect) {
    dateSelect.addEventListener("change", function () {
      if (!dateSelect.value) {
        dateSelect.value = store.getFulfillment().date;
        return;
      }
      persist({ date: dateSelect.value, slot: "" });
    });
  }

  if (slotSelect) {
    slotSelect.addEventListener("change", function () {
      persist({ slot: slotSelect.value });
    });
  }

  [addrLine1, addrLine2, addrCity, addrState, addrZip].forEach(function (input) {
    if (!input) return;
    input.addEventListener("input", function () {
      if (addrState && input === addrState) {
        input.value = input.value.toUpperCase().slice(0, 2);
      }
      if (addrZip && input === addrZip) {
        input.value = input.value.replace(/\D/g, "").slice(0, 5);
      }
      persist({ address: readAddress() });
    });
  });

  document.addEventListener("clubsams:cart", syncPanelVisibility);
  document.addEventListener("clubsams:fulfillment", syncFormFromStore);

  syncFormFromStore();
  syncPanelVisibility();
})();
