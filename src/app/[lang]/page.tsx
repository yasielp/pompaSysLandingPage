import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { BackToTop } from "@/components/BackToTop";
import { ContactForm } from "@/components/ContactForm";
import { CountUp } from "@/components/CountUp";
import { Header } from "@/components/Header";
import { ProcessTimeline } from "@/components/ProcessTimeline";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Terminal } from "@/components/Terminal";
import { TrafficChart } from "@/components/TrafficChart";
import { getDictionary, hasLocale } from "@/lib/i18n";

const EMAIL = "pompasys@gmail.com";
const PHONE_LABEL = "+1 (321) 524-3712";
const PHONE_HREF = "tel:+13215243712";

const ICON_PATHS: Record<string, ReactNode> = {
  code: <path d="M9 18l-6-6 6-6M15 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />,
  cloud: (
    <>
      <path d="M12 2l9 4.5v9L12 20l-9-4.5v-9L12 2z" strokeLinejoin="round" />
      <path d="M12 22V12M21 6.5L12 12 3 6.5" strokeLinejoin="round" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  support: (
    <>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M8 21h8M12 18v3" strokeLinecap="round" />
    </>
  ),
  automation: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" strokeLinecap="round" />
    </>
  ),
  network: <path d="M4 19h16M4 19V7l8-4 8 4v12M9 19v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />,
};

const SERVICES = [
  { n: 1, icon: "code" },
  { n: 2, icon: "cloud" },
  { n: 3, icon: "shield" },
  { n: 4, icon: "support" },
  { n: 5, icon: "automation" },
  { n: 6, icon: "network" },
] as const;

// Landing page, rendered on the server in the language taken from the URL.
export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const text = dict as Record<string, string>;
  const year = new Date().getFullYear();

  return (
    <>
      <a href="#main" className="skip-link">{dict.skip_link}</a>
      <Header lang={lang} dict={dict} />

      <main id="main">
        <section className="hero" id="top">
          <div className="hero-bg" aria-hidden="true">
            <div className="binary-overlay" />
          </div>

          <div className="container hero-inner">
            <div className="hero-copy">
              <h1 className="hero-title">{dict.hero_title}</h1>
              <p className="hero-subtitle">{dict.hero_subtitle}</p>
              <div className="hero-actions">
                <a href="#contacto" className="btn btn-primary">{dict.hero_cta_primary}</a>
                <a href="#servicios" className="btn btn-ghost">{dict.hero_cta_secondary}</a>
              </div>
            </div>

            <div className="status-panel" role="group" aria-label={dict.panel_aria}>
              <div className="status-head">
                <span className="status-dot" aria-hidden="true" />
                <span>{dict.panel_title}</span>
              </div>
              <TrafficChart inLabel={dict.panel_in} outLabel={dict.panel_out} />
              <ul className="status-list">
                <li>
                  <span className="status-label">{dict.hero_stat2_label}</span>
                  <span className="status-value"><CountUp value={99.9} decimals={1} suffix="%" delayMs={600} /></span>
                </li>
                <li>
                  <span className="status-label">{dict.hero_stat3_label}</span>
                  <span className="status-value"><CountUp value={24} suffix="/7" delayMs={700} /></span>
                </li>
                <li>
                  <span className="status-label">{dict.hero_stat1_label}</span>
                  <span className="status-value"><CountUp value={10} prefix="+" delayMs={800} /></span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section" id="servicios">
          <div className="container">
            <div className="services-top">
              <div className="section-head" data-reveal>
                <h2 className="section-title">{dict.services_title}</h2>
                <p className="section-subtitle">{dict.services_subtitle}</p>
              </div>
              <Terminal />
            </div>

            <ul className="service-list">
              {SERVICES.map(({ n, icon }) => (
                <li className="service" data-reveal key={n}>
                  <div className="service-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {ICON_PATHS[icon]}
                    </svg>
                  </div>
                  <div>
                    <h3>{text[`service${n}_title`]}</h3>
                    <p>{text[`service${n}_desc`]}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section section-alt" id="nosotros">
          <div className="container about-grid">
            <div>
              <h2 className="section-title">{dict.about_title}</h2>
              <p className="about-text">{dict.about_text}</p>
            </div>

            <ul className="check-list" data-reveal>
              <li>{dict.about_check1}</li>
              <li>{dict.about_check2}</li>
              <li>{dict.about_check3}</li>
              <li>{dict.about_check4}</li>
            </ul>
          </div>
        </section>

        <section className="section" id="proceso">
          <div className="container">
            <div className="section-head" data-reveal>
              <h2 className="section-title">{dict.process_title}</h2>
            </div>

            <ProcessTimeline
              steps={[1, 2, 3, 4].map((n) => ({
                title: text[`process${n}_title`],
                desc: text[`process${n}_desc`],
              }))}
            />
          </div>
        </section>

        <section className="section section-alt" id="contacto">
          <div className="container contact-grid">
            <div className="contact-text">
              <h2 className="section-title">{dict.contact_title}</h2>
              <p className="section-subtitle">{dict.contact_subtitle}</p>
              <ul className="contact-links">
                <li><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
                <li><a href={PHONE_HREF} className="contact-call">{PHONE_LABEL}</a></li>
              </ul>
            </div>

            <ContactForm dict={dict} lang={lang} turnstileSiteKey={process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY ? process.env.TURNSTILE_SITE_KEY : undefined} />
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <a href="#top" className="logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo-mark.svg" alt="" width={28} height={28} className="logo-mark" />
              PompaSys
            </a>
            <p className="footer-text">{dict.footer_tagline}</p>
          </div>

          <nav className="footer-nav" aria-label={dict.footer_site_heading}>
            <h4>{dict.footer_site_heading}</h4>
            <a href="#servicios">{dict.nav_services}</a>
            <a href="#nosotros">{dict.nav_about}</a>
            <a href="#contacto">{dict.nav_contact_footer}</a>
          </nav>

          <div className="footer-contact">
            <h4>{dict.footer_contact_heading}</h4>
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            <a href={PHONE_HREF}>{PHONE_LABEL}</a>
          </div>
        </div>
        <div className="container footer-bottom">
          <p>© {year} PompaSys. {dict.footer_rights}</p>
        </div>
      </footer>

      <BackToTop label={dict.back_to_top} />
      <ScrollReveal />
    </>
  );
}
