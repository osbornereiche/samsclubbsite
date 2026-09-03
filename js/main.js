(function () {
  "use strict";

  /* ── Mobile nav ── */
  var navToggle = document.querySelector(".nav-toggle");
  var navMobile = document.getElementById("nav-mobile");

  if (navToggle && navMobile) {
    navToggle.addEventListener("click", function () {
      var isOpen = navMobile.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      navMobile.hidden = !isOpen;
    });

    navMobile.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navMobile.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navMobile.hidden = true;
      });
    });
  }

  /* ── Smooth scroll ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var id = this.getAttribute("href");
      if (id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* ── Header scroll shadow ── */
  var header = document.querySelector(".site-header");
  if (header) {
    window.addEventListener("scroll", function () {
      header.classList.toggle("is-scrolled", window.scrollY > 20);
    }, { passive: true });
  }

  /* ── Scroll reveal ── */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ── Product rails ── */
  document.querySelectorAll(".rail-scroll-wrap").forEach(function (wrap) {
    var rail = wrap.querySelector("[data-rail]");
    var prev = wrap.querySelector("[data-rail-prev]");
    var next = wrap.querySelector("[data-rail-next]");
    if (!rail) return;

    function updateArrows() {
      if (!prev || !next) return;
      prev.hidden = rail.scrollLeft <= 4;
      next.hidden = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
    }

    function scrollBy(dir) {
      rail.scrollBy({ left: dir * 280, behavior: "smooth" });
    }

    if (prev) prev.addEventListener("click", function () { scrollBy(-1); });
    if (next) next.addEventListener("click", function () { scrollBy(1); });
    rail.addEventListener("scroll", updateArrows, { passive: true });
    updateArrows();
  });

  /* ── Category tabs filter ── */
  var tabs = document.querySelectorAll(".rail-tab");
  var allCards = document.querySelectorAll("#catalog-rail .product-card");

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.remove("is-active"); });
      tab.classList.add("is-active");
      var cat = tab.dataset.category;

      allCards.forEach(function (card) {
        if (cat === "all" || card.dataset.category === cat) {
          card.style.display = "";
        } else {
          card.style.display = "none";
        }
      });
    });
  });

  /* ── Location search ── */
  var zipInput = document.getElementById("zip-search");
  var locationCards = document.querySelectorAll(".location-card");
  var heroLocationSub = document.querySelector("[data-hero-location]");

  var usLocations = {
    "75231": { city: "Dallas, TX", store: "ClubSams Grocery — North Dallas" },
    "33101": { city: "Miami, FL", store: "ClubSams Grocery — Miami" },
    "90210": { city: "Los Angeles, CA", store: "ClubSams Grocery — Beverly Hills" },
    "10001": { city: "New York, NY", store: "ClubSams Grocery — Manhattan" },
    "60601": { city: "Chicago, IL", store: "ClubSams Grocery — Downtown Chicago" },
    "77001": { city: "Houston, TX", store: "ClubSams Grocery — Houston" },
    "85001": { city: "Phoenix, AZ", store: "ClubSams Grocery — Phoenix" },
    "98101": { city: "Seattle, WA", store: "ClubSams Grocery — Seattle" },
    "30301": { city: "Atlanta, GA", store: "ClubSams Grocery — Atlanta" },
    "19101": { city: "Philadelphia, PA", store: "ClubSams Grocery — Philadelphia" }
  };

  function findLocation(zip) {
    zip = (zip || "").trim().slice(0, 5);
    if (usLocations[zip]) return usLocations[zip];

    var prefix = zip.slice(0, 3);
    var fallback = {
      "752": usLocations["75231"],
      "331": usLocations["33101"],
      "902": usLocations["90210"],
      "100": usLocations["10001"],
      "606": usLocations["60601"],
      "770": usLocations["77001"],
      "850": usLocations["85001"],
      "981": usLocations["98101"],
      "303": usLocations["30301"],
      "191": usLocations["19101"]
    };

    if (fallback[prefix]) return fallback[prefix];
    return { city: "United States", store: "ClubSams Grocery — Nearest location" };
  }

  function applyLocation(zip) {
    var loc = findLocation(zip);
    if (heroLocationSub) {
      heroLocationSub.textContent = loc.store + " · " + loc.city;
    }
  }

  if (zipInput) {
    zipInput.addEventListener("input", function () {
      var val = zipInput.value.replace(/\D/g, "").slice(0, 5);
      zipInput.value = val;
      if (val.length === 5) applyLocation(val);
    });

    zipInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        applyLocation(zipInput.value);
        document.getElementById("ubicaciones").scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  applyLocation("75231");

  /* ── Contact form ── */
  var form = document.getElementById("contact-form");
  var formSuccess = document.getElementById("form-success");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (formSuccess) {
        formSuccess.classList.add("is-visible");
        form.reset();
        setTimeout(function () {
          formSuccess.classList.remove("is-visible");
        }, 5000);
      }
    });
  }

  /* ── Animated counters ── */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.dataset.count, 10);
        var suffix = el.dataset.suffix || "";
        var prefix = el.dataset.prefix || "";
        var duration = 1500;
        var start = performance.now();

        function tick(now) {
          var progress = Math.min((now - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = prefix + Math.floor(target * eased).toLocaleString() + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
        countObs.unobserve(el);
      });
    }, { threshold: 0.5 });

    counters.forEach(function (c) { countObs.observe(c); });
  }

  /* ── Cookie consent ── */
  var cookieBanner = document.getElementById("cookie-banner");
  var cookieAccept = document.getElementById("cookie-accept");
  var cookieDecline = document.getElementById("cookie-decline");
  var COOKIE_KEY = "clubsams_cookie_consent";

  function hideCookieBanner() {
    if (!cookieBanner) return;
    cookieBanner.classList.remove("is-visible");
    document.body.classList.remove("has-cookie-banner");
    setTimeout(function () {
      cookieBanner.hidden = true;
    }, 350);
  }

  function showCookieBanner() {
    if (!cookieBanner) return;
    cookieBanner.hidden = false;
    requestAnimationFrame(function () {
      cookieBanner.classList.add("is-visible");
      document.body.classList.add("has-cookie-banner");
    });
  }

  try {
    if (!localStorage.getItem(COOKIE_KEY)) {
      showCookieBanner();
    }
  } catch (e) {
    showCookieBanner();
  }

  function saveCookieChoice(value) {
    try {
      localStorage.setItem(COOKIE_KEY, value);
    } catch (e) {}
    hideCookieBanner();
  }

  if (cookieAccept) {
    cookieAccept.addEventListener("click", function () {
      saveCookieChoice("accepted");
    });
  }

  if (cookieDecline) {
    cookieDecline.addEventListener("click", function () {
      saveCookieChoice("essential");
    });
  }

  /* ── Open cart from URL after login ── */
  if (window.location.search.indexOf("openCart=1") !== -1) {
    setTimeout(function () {
      var openBtn = document.querySelector("[data-cart-open]");
      if (openBtn) openBtn.click();
    }, 400);
  }
})();
