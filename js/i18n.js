(function () {
  "use strict";

  var STORAGE_KEY = "pompasys_lang";

  var translations = {
    es: {
      skip_link: "Saltar al contenido",
      nav_services: "Servicios",
      nav_about: "Nosotros",
      nav_process: "Proceso",
      nav_contact: "Contáctanos",
      nav_contact_footer: "Contacto",
      nav_toggle_open: "Abrir menú",
      nav_toggle_close: "Cerrar menú",

      hero_eyebrow: "Servicios informáticos de nueva generación",
      hero_title_before: "Tecnología que ",
      hero_title_highlight: "impulsa",
      hero_title_after: " tu negocio",
      hero_subtitle: "Desarrollamos software, aseguramos tu infraestructura y damos soporte técnico para que tu empresa opere sin fricciones. Rápido, seguro y a tu medida.",
      hero_cta_primary: "Solicitar cotización",
      hero_cta_secondary: "Ver servicios",
      hero_stat1_label: "Proyectos entregados",
      hero_stat2_label: "Uptime garantizado",
      hero_stat3_label: "Soporte técnico",

      trust_label: "Trabajamos con tecnología líder de la industria",
      trust_1: "Cloud",
      trust_2: "DevOps",
      trust_3: "Ciberseguridad",
      trust_4: "IA & Automatización",
      trust_5: "Redes",
      trust_6: "Bases de Datos",

      services_eyebrow: "Qué hacemos",
      services_title: "Servicios diseñados para escalar tu operación",
      services_subtitle: "Soluciones integrales de tecnología, desde el desarrollo hasta el mantenimiento.",
      service1_title: "Desarrollo de Software",
      service1_desc: "Aplicaciones web, móviles y sistemas a medida construidos con arquitecturas modernas y escalables.",
      service2_title: "Infraestructura Cloud",
      service2_desc: "Migración, arquitectura y administración de infraestructura en la nube con alta disponibilidad.",
      service3_title: "Ciberseguridad",
      service3_desc: "Auditorías, pentesting y monitoreo continuo para proteger tus datos y sistemas críticos.",
      service4_title: "Soporte Técnico",
      service4_desc: "Mesa de ayuda 24/7, mantenimiento preventivo y resolución de incidencias en tiempo récord.",
      service5_title: "Automatización & IA",
      service5_desc: "Optimizamos procesos con automatización inteligente e integraciones de inteligencia artificial.",
      service6_title: "Redes & Conectividad",
      service6_desc: "Diseño, instalación y administración de redes empresariales seguras y de alto rendimiento.",

      about_eyebrow: "Sobre nosotros",
      about_title: "Un equipo técnico obsesionado con resultados",
      about_text: "En PompaSys combinamos experiencia en desarrollo, infraestructura y seguridad para entregar soluciones que realmente mueven la aguja de tu negocio. Nada de promesas vacías: medimos cada proyecto por su impacto real.",
      about_check1: "Arquitecturas escalables y mantenibles",
      about_check2: "Comunicación clara en cada etapa del proyecto",
      about_check3: "Seguridad integrada desde el diseño",
      about_check4: "Entrega ágil con iteraciones constantes",

      process_eyebrow: "Cómo trabajamos",
      process_title: "Un proceso simple y transparente",
      process1_title: "Diagnóstico",
      process1_desc: "Analizamos tus necesidades técnicas y objetivos de negocio.",
      process2_title: "Propuesta",
      process2_desc: "Diseñamos una solución a medida con alcance y tiempos claros.",
      process3_title: "Implementación",
      process3_desc: "Desarrollamos e integramos con entregas iterativas y verificables.",
      process4_title: "Soporte continuo",
      process4_desc: "Monitoreamos, optimizamos y acompañamos el crecimiento de tu sistema.",

      contact_title: "¿Listo para modernizar tu tecnología?",
      contact_subtitle: "Cuéntanos sobre tu proyecto y te responderemos en menos de 24 horas.",
      form_name_placeholder: "Nombre completo",
      form_email_placeholder: "Correo electrónico",
      form_message_placeholder: "Cuéntanos sobre tu proyecto",
      form_submit: "Enviar mensaje",
      form_error_validity: "Por favor completa todos los campos correctamente.",
      form_sending: "Enviando...",
      form_success: "¡Gracias! Hemos recibido tu mensaje, te contactaremos pronto.",
      form_error_generic: "No se pudo enviar el mensaje. Intenta de nuevo o escríbenos por correo.",
      form_error_connection: "Error de conexión. Intenta de nuevo o escríbenos por correo.",

      footer_tagline: "Soluciones informáticas modernas para negocios que quieren crecer.",
      footer_site_heading: "Sitio",
      footer_contact_heading: "Contacto",
      footer_rights: "Todos los derechos reservados.",

      meta_title: "PompaSys | Soluciones Informáticas para tu Negocio",
      meta_description: "Servicios profesionales de informática: desarrollo de software, infraestructura, soporte técnico y ciberseguridad. Impulsa tu negocio con tecnología moderna."
    },
    en: {
      skip_link: "Skip to content",
      nav_services: "Services",
      nav_about: "About",
      nav_process: "Process",
      nav_contact: "Contact us",
      nav_contact_footer: "Contact",
      nav_toggle_open: "Open menu",
      nav_toggle_close: "Close menu",

      hero_eyebrow: "Next-generation IT services",
      hero_title_before: "Technology that ",
      hero_title_highlight: "drives",
      hero_title_after: " your business",
      hero_subtitle: "We build software, secure your infrastructure, and provide technical support so your business runs without friction. Fast, secure, and tailored to you.",
      hero_cta_primary: "Get a quote",
      hero_cta_secondary: "View services",
      hero_stat1_label: "Projects delivered",
      hero_stat2_label: "Guaranteed uptime",
      hero_stat3_label: "Technical support",

      trust_label: "We work with industry-leading technology",
      trust_1: "Cloud",
      trust_2: "DevOps",
      trust_3: "Cybersecurity",
      trust_4: "AI & Automation",
      trust_5: "Networking",
      trust_6: "Databases",

      services_eyebrow: "What we do",
      services_title: "Services designed to scale your operation",
      services_subtitle: "End-to-end technology solutions, from development to maintenance.",
      service1_title: "Software Development",
      service1_desc: "Web apps, mobile apps, and custom systems built on modern, scalable architectures.",
      service2_title: "Cloud Infrastructure",
      service2_desc: "Cloud migration, architecture, and management with high availability.",
      service3_title: "Cybersecurity",
      service3_desc: "Audits, penetration testing, and continuous monitoring to protect your data and critical systems.",
      service4_title: "Technical Support",
      service4_desc: "24/7 help desk, preventive maintenance, and rapid incident resolution.",
      service5_title: "Automation & AI",
      service5_desc: "We streamline processes with smart automation and AI integrations.",
      service6_title: "Networking & Connectivity",
      service6_desc: "Design, installation, and management of secure, high-performance business networks.",

      about_eyebrow: "About us",
      about_title: "A technical team obsessed with results",
      about_text: "At PompaSys we combine expertise in development, infrastructure, and security to deliver solutions that truly move the needle for your business. No empty promises — we measure every project by its real impact.",
      about_check1: "Scalable, maintainable architectures",
      about_check2: "Clear communication at every stage of the project",
      about_check3: "Security built in from the design phase",
      about_check4: "Agile delivery with continuous iteration",

      process_eyebrow: "How we work",
      process_title: "A simple, transparent process",
      process1_title: "Discovery",
      process1_desc: "We analyze your technical needs and business goals.",
      process2_title: "Proposal",
      process2_desc: "We design a tailored solution with clear scope and timelines.",
      process3_title: "Implementation",
      process3_desc: "We build and integrate with iterative, verifiable deliveries.",
      process4_title: "Ongoing support",
      process4_desc: "We monitor, optimize, and support your system as it grows.",

      contact_title: "Ready to modernize your technology?",
      contact_subtitle: "Tell us about your project and we'll get back to you within 24 hours.",
      form_name_placeholder: "Full name",
      form_email_placeholder: "Email address",
      form_message_placeholder: "Tell us about your project",
      form_submit: "Send message",
      form_error_validity: "Please fill in all fields correctly.",
      form_sending: "Sending...",
      form_success: "Thank you! We've received your message and will contact you soon.",
      form_error_generic: "We couldn't send your message. Please try again or email us directly.",
      form_error_connection: "Connection error. Please try again or email us directly.",

      footer_tagline: "Modern IT solutions for businesses that want to grow.",
      footer_site_heading: "Site",
      footer_contact_heading: "Contact",
      footer_rights: "All rights reserved.",

      meta_title: "PompaSys | IT Solutions for Your Business",
      meta_description: "Professional IT services: software development, infrastructure, technical support, and cybersecurity. Drive your business forward with modern technology."
    }
  };

  var currentLang = "es";

  function detectLanguage() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (saved === "es" || saved === "en") return saved;

    var nav = (navigator.language || navigator.userLanguage || "es").toLowerCase();
    return nav.indexOf("en") === 0 ? "en" : "es";
  }

  function t(key) {
    var dict = translations[currentLang] || translations.es;
    return dict[key] !== undefined ? dict[key] : key;
  }

  function applyLanguage(lang) {
    currentLang = translations[lang] ? lang : "es";
    var dict = translations[currentLang];

    document.documentElement.setAttribute("lang", currentLang);

    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute("data-i18n");
      if (dict[key] !== undefined) nodes[i].textContent = dict[key];
    }

    var placeholders = document.querySelectorAll("[data-i18n-placeholder]");
    for (var j = 0; j < placeholders.length; j++) {
      var pKey = placeholders[j].getAttribute("data-i18n-placeholder");
      if (dict[pKey] !== undefined) placeholders[j].setAttribute("placeholder", dict[pKey]);
    }

    var ariaEls = document.querySelectorAll("[data-i18n-aria-label]");
    for (var k = 0; k < ariaEls.length; k++) {
      var aKey = ariaEls[k].getAttribute("data-i18n-aria-label");
      if (dict[aKey] !== undefined) ariaEls[k].setAttribute("aria-label", dict[aKey]);
    }

    var titleEl = document.querySelector("title");
    if (titleEl && dict.meta_title) titleEl.textContent = dict.meta_title;

    var descEl = document.querySelector('meta[name="description"]');
    if (descEl && dict.meta_description) descEl.setAttribute("content", dict.meta_description);

    var ogTitleEl = document.querySelector('meta[property="og:title"]');
    if (ogTitleEl && dict.meta_title) ogTitleEl.setAttribute("content", dict.meta_title);

    var ogDescEl = document.querySelector('meta[property="og:description"]');
    if (ogDescEl && dict.meta_description) ogDescEl.setAttribute("content", dict.meta_description);

    var switches = document.querySelectorAll("[data-lang-switch]");
    for (var m = 0; m < switches.length; m++) {
      switches[m].setAttribute("data-active", currentLang);
      var opts = switches[m].querySelectorAll("[data-lang]");
      for (var n = 0; n < opts.length; n++) {
        opts[n].setAttribute("aria-pressed", opts[n].getAttribute("data-lang") === currentLang ? "true" : "false");
      }
    }
  }

  function setLanguage(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    applyLanguage(lang);
  }

  window.pompasysI18n = { t: t, setLanguage: setLanguage, getLang: function () { return currentLang; } };

  applyLanguage(detectLanguage());

  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest("[data-lang]") : null;
    if (!btn) return;
    var lang = btn.getAttribute("data-lang");
    if (lang && lang !== currentLang) setLanguage(lang);
  });
})();
