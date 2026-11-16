"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LOCALE_COOKIE, type Dictionary, type Locale } from "@/lib/i18n";

// Top bar: logo, section links, language switch and contact button.
// Becomes bordered after scrolling and collapses into a menu on small screens.
export function Header({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setOpen(false);
  const rememberLocale = (locale: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <header className={`header${scrolled ? " is-scrolled" : ""}`} id="header">
      <nav className="nav container">
        <Link href={`/${lang}#top`} className="logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo-mark.svg" alt="" width={28} height={28} className="logo-mark" />
          PompaSys
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-label={open ? dict.nav_toggle_close : dict.nav_toggle_open}
          aria-expanded={open}
          aria-controls="navMenu"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <ul className={`nav-menu${open ? " is-open" : ""}`} id="navMenu">
          <li><a href="#servicios" className="nav-link" onClick={closeMenu}>{dict.nav_services}</a></li>
          <li><a href="#nosotros" className="nav-link" onClick={closeMenu}>{dict.nav_about}</a></li>
          <li><a href="#proceso" className="nav-link" onClick={closeMenu}>{dict.nav_process}</a></li>
          <li>
            <div className="lang-switch" data-active={lang} role="group" aria-label="Idioma / Language">
              <span className="lang-switch-thumb" aria-hidden="true" />
              <Link
                href="/es"
                className="lang-option"
                hrefLang="es"
                aria-current={lang === "es" ? "true" : undefined}
                onClick={() => rememberLocale("es")}
              >
                ES
              </Link>
              <Link
                href="/en"
                className="lang-option"
                hrefLang="en"
                aria-current={lang === "en" ? "true" : undefined}
                onClick={() => rememberLocale("en")}
              >
                EN
              </Link>
            </div>
          </li>
          <li><a href="#contacto" className="nav-link nav-cta" onClick={closeMenu}>{dict.nav_contact}</a></li>
        </ul>
      </nav>
    </header>
  );
}
