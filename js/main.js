(function () {
  "use strict";

  // Header scroll state
  var header = document.getElementById("header");
  var onScroll = function () {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile nav toggle
  var navToggle = document.getElementById("navToggle");
  var navMenu = document.getElementById("navMenu");

  var closeMenu = function () {
    navMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Abrir menú");
  };

  navToggle.addEventListener("click", function () {
    var isOpen = navMenu.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
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
      status.textContent = "Por favor completa todos los campos correctamente.";
      status.style.color = "#ff6b6b";
      return;
    }

    submitBtn.disabled = true;
    status.style.color = "";
    status.textContent = "Enviando...";

    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success) {
          status.style.color = "";
          status.textContent = "¡Gracias! Hemos recibido tu mensaje, te contactaremos pronto.";
          form.reset();
        } else {
          status.style.color = "#ff6b6b";
          status.textContent = "No se pudo enviar el mensaje. Intenta de nuevo o escríbenos por correo.";
        }
      })
      .catch(function () {
        status.style.color = "#ff6b6b";
        status.textContent = "Error de conexión. Intenta de nuevo o escríbenos por correo.";
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });

  // Footer year
  document.getElementById("year").textContent = new Date().getFullYear();
})();
