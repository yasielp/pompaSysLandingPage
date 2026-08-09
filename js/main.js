(function () {
  "use strict";

  // Header scroll state
  var header = document.getElementById("header");
  var backToTop = document.getElementById("backToTop");
  var onScroll = function () {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
    backToTop.classList.toggle("is-visible", window.scrollY > 480);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  backToTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Mobile nav toggle
  var navToggle = document.getElementById("navToggle");
  var navMenu = document.getElementById("navMenu");

  var t = function (key) { return window.pompasysI18n ? window.pompasysI18n.t(key) : key; };

  var closeMenu = function () {
    navMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", t("nav_toggle_open"));
  };

  navToggle.addEventListener("click", function () {
    var isOpen = navMenu.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? t("nav_toggle_close") : t("nav_toggle_open"));
  });

  navMenu.addEventListener("click", function (e) {
    if (e.target.classList.contains("nav-link")) closeMenu();
  });

  // Scroll reveal animations
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // Contact form (submits to our Cloudflare Worker at /api/contact)
  var form = document.getElementById("contactForm");
  var status = document.getElementById("formStatus");
  var submitBtn = form.querySelector("button[type='submit']");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      status.textContent = t("form_error_validity");
      status.style.color = "#ffc4b3";
      return;
    }

    submitBtn.disabled = true;
    status.style.color = "";
    status.textContent = t("form_sending");

    fetch("https://pompasys.com/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success) {
          status.style.color = "";
          status.textContent = t("form_success");
          form.reset();
        } else {
          status.style.color = "#ffc4b3";
          status.textContent = t("form_error_generic");
        }
      })
      .catch(function () {
        status.style.color = "#ffc4b3";
        status.textContent = t("form_error_connection");
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });

  // Footer year
  document.getElementById("year").textContent = new Date().getFullYear();
})();
