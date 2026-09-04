"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Camera,
  Church,
  Clock3,
  Heart,
  MapPin,
  Music2,
  PartyPopper,
  Sparkles,
  TicketCheck,
  Trophy,
  UsersRound,
  Wine,
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import type { LandingContent } from "@/lib/landing-content";

const heroSlides = [
  "/wedding/hero-composed-evening-v1.png",
  "/wedding/hero-composed-day-v1.png",
];
const mobileHeroSlides = [
  "/wedding/valdeze-patrick-hero.jpeg",
  "/wedding/valdeze-patrick-editorial.jpeg",
];

const momentIcons = [Trophy, UsersRound, Church, Church, Camera, Wine, Music2];

function Countdown({ content }: { content: LandingContent }) {
  const target = new Date("2026-10-30T08:00:00+01:00").getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const initialUpdate = window.setTimeout(() => setNow(Date.now()), 0);
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(initialUpdate);
      window.clearInterval(interval);
    };
  }, []);
  const remaining = now === null ? 0 : Math.max(0, target - now);
  const values = [
    [content.countdownDays, Math.floor(remaining / 86_400_000)],
    [content.countdownHours, Math.floor(remaining / 3_600_000) % 24],
    [content.countdownMinutes, Math.floor(remaining / 60_000) % 60],
    [content.countdownSeconds, Math.floor(remaining / 1000) % 60],
  ];
  return (
    <section className="relative overflow-hidden border-y border-[#d5a55e]/55 bg-[#6e1720] px-5 py-12 text-[#fff7e8] sm:px-8">
      <div className="pointer-events-none absolute -left-16 top-0 h-56 w-72 rounded-full bg-[#bc4d1e]/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 right-0 h-64 w-80 rounded-full bg-[#b4772a]/25 blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 text-[#e5b863]">
            <span className="h-px w-12 bg-current/55" />
            <Heart className="size-4 fill-current" />
            <span className="h-px w-12 bg-current/55" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[.3em] text-[#edc779]">
            {content.countdownEyebrow}
          </p>
          <h2 className="mt-2 text-3xl italic sm:text-4xl">{content.countdownTitle}</h2>
        </div>
        <div className="mx-auto mt-9 grid max-w-5xl grid-cols-2 gap-px overflow-hidden border border-[#d5a55e]/45 bg-[#d5a55e]/45 sm:grid-cols-4">
          {values.map(([label, value]) => (
            <div
              key={String(label)}
              className="bg-[#6e1720]/85 px-4 py-6 text-center backdrop-blur-sm"
            >
              <p className="text-5xl leading-none text-[#fff7e8] sm:text-6xl">
                {String(value).padStart(2, "0")}
              </p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#e5b863]">
                {label}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-[#f7dfb0]/85">
          {content.countdownNote}
        </p>
      </div>
    </section>
  );
}

function FloralThread() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-7 left-1/2 hidden h-[calc(100%-3.5rem)] w-40 -translate-x-1/2 lg:block"
      viewBox="0 0 160 760"
      fill="none"
      preserveAspectRatio="none"
    >
      <path
        d="M79 0C104 72 49 117 78 191C108 269 50 320 80 389C111 461 52 516 79 591C102 652 65 710 80 760"
        stroke="#bc7a25"
        strokeWidth="1.25"
      />
      <g stroke="#bc7a25" strokeWidth="1" fill="none" opacity=".95">
        <path d="M91 45c21-15 28-3 24 8c-5 12-19 12-24-8ZM67 137c-22-15-28-2-23 9c5 10 18 11 23-9ZM91 239c20-16 29-4 24 8c-4 12-18 13-24-8ZM68 338c-20-13-27-1-22 9c5 10 18 10 22-9ZM90 425c21-15 28-2 23 9c-5 10-19 11-23-9ZM68 533c-21-15-28-2-23 9c5 10 18 11 23-9ZM91 613c20-13 27-1 22 9c-5 10-18 10-22-9ZM68 711c-20-14-28-2-23 9c5 10 18 11 23-9Z" />
        <circle cx="105" cy="66" r="3" />
        <circle cx="55" cy="158" r="3" />
        <circle cx="105" cy="258" r="3" />
        <circle cx="56" cy="360" r="3" />
        <circle cx="105" cy="447" r="3" />
        <circle cx="55" cy="553" r="3" />
        <circle cx="104" cy="635" r="3" />
        <circle cx="55" cy="731" r="3" />
      </g>
    </svg>
  );
}

function WeddingPageLoader({
  content,
  leaving,
}: {
  content: LandingContent;
  leaving: boolean;
}) {
  return (
    <div
      aria-live="polite"
      aria-label="Chargement de la célébration"
      className={`wedding-loader-scene fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[#fff9ed] px-6 transition-all duration-1000 ease-[cubic-bezier(.22,1,.36,1)] ${leaving ? "pointer-events-none scale-[1.035] opacity-0" : "opacity-100"}`}
    >
      <div
        aria-hidden
        className="wedding-loader-orb-a absolute -left-28 -top-28 size-96 rounded-full border border-[#c9964e]/30"
      />
      <div
        aria-hidden
        className="wedding-loader-orb-b absolute -bottom-40 -right-24 size-[34rem] rounded-full border border-[#6e1720]/15"
      />
      <div
        aria-hidden
        className="wedding-loader-glow absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(207,152,67,.12),transparent_44%)]"
      />
      <span
        aria-hidden
        className="wedding-loader-spark absolute left-[22%] top-[29%] size-1.5 rounded-full bg-[#b4772a]"
      />
      <span
        aria-hidden
        className="wedding-loader-spark wedding-loader-spark-delayed absolute bottom-[28%] right-[21%] size-1 rounded-full bg-[#6e1720]"
      />
      <div className="relative flex flex-col items-center text-center">
        <div className="wedding-loader-mark relative grid size-28 place-items-center">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full border border-[#b4772a]/55 animate-[wedding-loader-orbit_3s_linear_infinite]"
          />
          <span
            aria-hidden
            className="absolute inset-2 rounded-full border border-dashed border-[#6e1720]/35 animate-[wedding-loader-orbit_5s_linear_infinite_reverse]"
          />
          <span className="text-4xl text-[#a56722]">{content.monogram}</span>
        </div>
        <div className="wedding-loader-ornament mt-7 flex items-center gap-3 text-[#b4772a]">
          <span className="h-px w-10 bg-current/55" />
          <Heart className="size-3.5 fill-current" />
          <span className="h-px w-10 bg-current/55" />
        </div>
        <p className="wedding-loader-name mt-5 text-xs font-semibold uppercase tracking-[.32em] text-[#a56722]">
          {content.loaderName}
        </p>
        <p className="wedding-loader-title mt-3 text-xl italic text-[#6e1720]">
          {content.loaderMessage}
        </p>
        <p className="wedding-loader-date mt-5 text-[10px] font-semibold uppercase tracking-[.25em] text-[#9b6e35]">
          {content.loaderDate}
        </p>
      </div>
    </div>
  );
}

export function WeddingHomepage({ content }: { content: LandingContent }) {
  const [active, setActive] = useState(0);
  const [loaderLeaving, setLoaderLeaving] = useState(false);
  const programRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoaderLeaving(true), 1550);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    const interval = window.setInterval(
      () => setActive((value) => (value + 1) % heroSlides.length),
      7000,
    );
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    const section = programRef.current;
    if (!section) return;
    const elements = Array.from(
      section.querySelectorAll<HTMLElement>("[data-program-reveal]"),
    );
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.16 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <WeddingPageLoader content={content} leaving={loaderLeaving} />
      <main className="min-h-screen overflow-hidden bg-[#fffaf0] font-serif text-[#53151d]">
        <section className="relative isolate min-h-[780px] overflow-hidden bg-[#fff9ed] lg:min-h-[760px]">
          {heroSlides.map((slide, index) => (
            <Image
              key={slide}
              src={slide}
              alt="Valdeze et Patrick"
              fill
              priority={index === 0}
              sizes="(min-width: 768px) 100vw, 1px"
              className={`pointer-events-none z-0 hidden object-cover object-[62%_center] transition-opacity duration-[1400ms] md:block lg:object-center ${active === index ? "hero-backdrop-in opacity-100" : "opacity-0"}`}
            />
          ))}
          {mobileHeroSlides.map((slide, index) => (
            <Image
              key={slide}
              src={slide}
              alt="Valdeze et Patrick"
              fill
              priority={index === 0}
              sizes="(max-width: 767px) 100vw, 1px"
              className={`pointer-events-none z-0 object-contain object-bottom transition-opacity duration-[1400ms] md:hidden ${active === index ? "hero-backdrop-in opacity-100" : "opacity-0"}`}
            />
          ))}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(255,249,237,.88)_0%,rgba(255,249,237,.70)_68%,rgba(255,249,237,.12)_100%)] md:hidden"
          />
          <header className="hero-header-in relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
            <a href="#accueil" className="text-3xl text-[#a56722]">
              {content.monogram}
            </a>
            <nav className="hidden items-center gap-10 text-sm font-semibold text-[#6e1720] [text-shadow:0_1px_9px_rgba(255,249,237,.95)] md:flex">
              <a
                className="border-b border-transparent pb-1 transition hover:border-[#a56722] hover:text-[#8b321a]"
                href="#message"
              >
                {content.navMessage}
              </a>
              <a
                className="border-b border-transparent pb-1 transition hover:border-[#a56722] hover:text-[#8b321a]"
                href="#programme"
              >
                {content.navProgram}
              </a>
              <a
                className="border-b border-transparent pb-1 transition hover:border-[#a56722] hover:text-[#8b321a]"
                href="#infos"
              >
                {content.navInfo}
              </a>
              <a
                className="border-b border-transparent pb-1 transition hover:border-[#a56722] hover:text-[#8b321a]"
                href="/galerie"
              >
                {content.navGallery}
              </a>
            </nav>
            <Link
              href="/connexion"
              className="inline-flex items-center gap-2 border border-[#a56722] bg-[#fffaf0]/95 px-4 py-2 text-sm font-semibold text-[#7b321d] shadow-[0_8px_28px_rgba(82,32,19,.14)] backdrop-blur-sm transition hover:bg-white"
            >
              <Heart className="size-3.5" /> {content.accessLabel}
            </Link>
          </header>
          <div
            id="accueil"
            className="relative z-10 mx-auto max-w-7xl px-5 pb-28 pt-16 sm:px-8 lg:pt-24"
          >
            <div className="hero-content-in max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#a56722]">
                {content.heroEyebrow}
              </p>
              <h1 className="mt-5 text-6xl leading-[.86] tracking-tight text-[#6e1720] sm:text-8xl">
                {content.heroFirstName}
                <br />
                <span className="text-[#b4772a]">&</span> {content.heroSecondName}
              </h1>
              <div className="my-7 h-px w-48 bg-[#b98a46]" />
              <p className="text-2xl text-[#b84012]">{content.heroDate}</p>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-[#63463a]">
                {content.heroDescription}
              </p>
              <a
                href="#programme"
                className="mt-8 inline-flex items-center gap-2 bg-[#c54b10] px-6 py-3 text-base text-white shadow-lg shadow-[#8b2b14]/20 transition hover:-translate-y-0.5 hover:bg-[#a83b0b]"
              >
                {content.heroCta} <PartyPopper className="size-4" />
              </a>
            </div>
            <div className="hero-controls-in mt-16 flex gap-2 lg:mt-24">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  aria-label={`Afficher la photo ${index + 1}`}
                  onClick={() => setActive(index)}
                  className={`h-1.5 w-7 transition ${active === index ? "bg-[#c56a1a]" : "bg-[#8d4b2c]/35"}`}
                />
              ))}
            </div>
          </div>
        </section>
        <Countdown content={content} />
        <section
          ref={programRef}
          id="programme"
          className="relative isolate overflow-hidden px-5 py-18 sm:px-8 sm:py-20"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 top-16 size-72 rounded-full border border-[#c9964e]/25"
          />
          <svg
            aria-hidden
            viewBox="0 0 210 300"
            className="pointer-events-none absolute -left-8 bottom-4 hidden h-72 w-56 text-[#b4772a]/35 lg:block"
            fill="none"
            stroke="currentColor"
          >
            <path d="M-10 268C65 205 54 122 159 31" strokeWidth="1.2" />
            <path d="M28 224c22-22 37-12 26 7c-10 16-28 12-26-7ZM73 166c-17-24 1-37 17-21c12 14 0 30-17 21ZM123 99c23-17 35 3 18 17c-15 12-29 0-18-17Z" />
            <circle cx="20" cy="235" r="3" />
            <circle cx="100" cy="139" r="3" />
            <circle cx="148" cy="77" r="3" />
          </svg>
          <svg
            aria-hidden
            viewBox="0 0 210 300"
            className="pointer-events-none absolute -right-8 top-14 hidden h-72 w-56 rotate-180 text-[#b4772a]/35 lg:block"
            fill="none"
            stroke="currentColor"
          >
            <path d="M-10 268C65 205 54 122 159 31" strokeWidth="1.2" />
            <path d="M28 224c22-22 37-12 26 7c-10 16-28 12-26-7ZM73 166c-17-24 1-37 17-21c12 14 0 30-17 21ZM123 99c23-17 35 3 18 17c-15 12-29 0-18-17Z" />
            <circle cx="20" cy="235" r="3" />
            <circle cx="100" cy="139" r="3" />
            <circle cx="148" cy="77" r="3" />
          </svg>
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-24 right-[10%] size-24 rotate-12 border border-[#c9964e]/20"
          />
          <div className="relative mx-auto max-w-5xl">
            <div data-program-reveal className="program-reveal text-center">
              <div className="flex items-center justify-center gap-3 text-[#b4772a]">
                <span className="h-px w-12 bg-current/45" />
                <Sparkles className="size-4" />
                <span className="h-px w-12 bg-current/45" />
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[.3em] text-[#a56722]">
                {content.programDate}
              </p>
              <h2 className="mt-3 text-4xl leading-none text-[#6e1720] sm:text-6xl">
                {content.programTitle}{" "}
                <span className="mt-2 block text-[#b4772a] italic">
                  {content.programAccent}
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#765342]">
                {content.programDescription}
              </p>
            </div>
            <div className="relative mx-auto mt-10 max-w-4xl sm:mt-12">
              <FloralThread />
              {content.moments.map((moment, index) => {
                const Icon = momentIcons[index] ?? Sparkles;
                const onRight = index % 2 === 1;
                return (
                  <article
                    key={`${moment.time}-${moment.title}`}
                    data-program-reveal
                    style={
                      {
                        "--reveal-delay": `${Math.min(index * 80, 280)}ms`,
                      } as CSSProperties
                    }
                    className={`program-reveal relative grid grid-cols-[38px_1fr] gap-5 py-7 lg:min-h-40 lg:grid-cols-[1fr_164px_1fr] lg:gap-4 ${onRight ? "lg:text-left" : "lg:text-right"}`}
                  >
                    <div
                      className={`${onRight ? "lg:col-start-3" : "lg:col-start-1"} lg:self-center`}
                    >
                      <p className="text-xs uppercase tracking-wider text-[#9c6a27]">
                        {moment.day}
                      </p>
                      <p className="mt-1 text-4xl text-[#b4772a]">{moment.time}</p>
                      <h3 className="mt-1 text-2xl text-[#6e1720]">{moment.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#67493c]">
                        {moment.text}
                      </p>
                    </div>
                    <div className="relative col-start-1 row-start-1 flex size-10 items-center justify-center self-center rounded-full border border-[#c9964e] bg-[#fffaf0] text-[#a56722] lg:col-start-2 lg:size-11">
                      <Icon className="size-4 lg:size-5" />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
        <section
          id="infos"
          className="relative overflow-hidden bg-[#f8ecd9] px-5 py-20 sm:px-8"
        >
          <div className="pointer-events-none absolute -right-24 top-4 size-80 rounded-full border border-[#c9964e]/20" />
          <div className="relative mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <div className="flex items-center justify-center gap-3 text-[#b4772a]">
                <span className="h-px w-10 bg-current/45" />
                <CalendarDays className="size-5" />
                <span className="h-px w-10 bg-current/45" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[.28em] text-[#a56722]">
                {content.infoEyebrow}
              </p>
              <h2 className="mt-4 text-4xl text-[#6e1720] sm:text-5xl">
                {content.infoTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-xl leading-relaxed text-[#765342]">
                {content.infoDescription}
              </p>
            </div>
            <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.35fr_1fr]">
              <article className="border-t-2 border-[#b4772a] pt-6">
                <div className="flex items-center gap-3 text-[#a56722]">
                  <Clock3 className="size-5" />
                  <p className="text-xs font-semibold uppercase tracking-[.22em]">
                    {content.fridayLabel}
                  </p>
                </div>
                <h3 className="mt-4 text-3xl text-[#6e1720]">{content.fridayTitle}</h3>
                <div className="mt-6 space-y-5 border-l border-[#c9964e]/55 pl-5">
                  {content.moments.slice(0, 2).map((moment, index) => (
                    <div key={`${moment.time}-${index}`}>
                      <p className="text-xl text-[#b4772a]">{moment.time}</p>
                      <p className="mt-1 font-semibold text-[#6e1720]">
                        {moment.title}
                      </p>
                      <p className="mt-1 text-sm text-[#765342]">{moment.text}</p>
                    </div>
                  ))}
                </div>
              </article>
              <article className="border-t-2 border-[#6e1720] pt-6">
                <div className="flex items-center gap-3 text-[#a56722]">
                  <MapPin className="size-5" />
                  <p className="text-xs font-semibold uppercase tracking-[.22em]">
                    {content.saturdayLabel}
                  </p>
                </div>
                <h3 className="mt-4 text-3xl text-[#6e1720]">
                  {content.saturdayTitle}
                </h3>
                <div className="mt-6 grid gap-x-8 gap-y-5 border-l border-[#c9964e]/55 pl-5 sm:grid-cols-2">
                  {content.moments.slice(2).map((moment, index) => (
                    <div key={`${moment.time}-${index}`}>
                      <p className="text-xl text-[#b4772a]">{moment.time}</p>
                      <p className="mt-1 font-semibold text-[#6e1720]">
                        {moment.title}
                      </p>
                      <p className="mt-1 text-sm text-[#765342]">{moment.text}</p>
                    </div>
                  ))}
                </div>
              </article>
              <article className="border-t-2 border-[#b4772a] pt-6">
                <div className="flex items-center gap-3 text-[#a56722]">
                  <TicketCheck className="size-5" />
                  <p className="text-xs font-semibold uppercase tracking-[.22em]">
                    {content.ticketLabel}
                  </p>
                </div>
                <h3 className="mt-4 text-3xl text-[#6e1720]">{content.ticketTitle}</h3>
                <p className="mt-5 leading-relaxed text-[#765342]">
                  {content.ticketDescription}
                </p>
                <Link
                  href="/connexion"
                  className="mt-7 inline-flex items-center gap-2 border border-[#a56722] px-4 py-2 text-sm text-[#7b321d] transition hover:bg-[#fffaf0]"
                >
                  {content.ticketCta} <Heart className="size-3.5" />
                </Link>
              </article>
            </div>
          </div>
        </section>
        <section
          id="message"
          className="relative isolate min-h-[620px] overflow-hidden bg-[#fff9ed] px-5 py-16 sm:px-8"
        >
          <Image
            src="/wedding/footer-composed-v1.png"
            alt="Valdeze et Patrick"
            fill
            sizes="100vw"
            className="-z-10 hidden object-cover object-[50%_top] md:block"
          />
          <Image
            src="/wedding/valdeze-patrick-editorial.jpeg"
            alt="Valdeze et Patrick"
            fill
            sizes="100vw"
            className="-z-10 object-contain object-top md:hidden"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[68%] bg-[linear-gradient(to_top,rgba(255,249,237,.98)_33%,rgba(255,249,237,.84)_69%,rgba(255,249,237,0)_100%)] md:hidden"
          />
          <div className="relative z-10 mx-auto flex min-h-[490px] max-w-6xl items-end justify-end md:min-h-[460px] md:items-center">
            <div className="max-w-xl pb-2 text-center md:ml-auto md:w-[54%] md:pb-0 md:text-left">
              <div className="flex items-center justify-center gap-3 text-[#b4772a] md:justify-start">
                <span className="h-px w-10 bg-current/45" />
                <Heart className="size-5" />
                <span className="h-px w-10 bg-current/45" />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[.28em] text-[#a56722]">
                {content.messageEyebrow}
              </p>
              <h2 className="mt-5 text-4xl leading-[1.05] text-[#6e1720] sm:text-6xl">
                {content.messageTitle}
                <br />
                <span className="italic text-[#b4772a]">{content.messageAccent}</span>
              </h2>
              <div className="my-7 h-px w-24 bg-[#b98a46]/70 md:mx-0 mx-auto" />
              <p className="mx-auto max-w-md text-lg leading-relaxed text-[#67493c] md:mx-0">
                {content.messageDescription}
              </p>
              <p className="mt-8 text-3xl italic text-[#8e461d]">{content.signature}</p>
            </div>
          </div>
        </section>
        <footer className="border-t border-[#d5a55e]/45 bg-[#6e1720] px-5 py-7 text-center text-sm text-[#f4d5a0]">
          <Heart className="mx-auto mb-2 size-4 text-[#d6a252]" />
          {content.footerText}
        </footer>
      </main>
    </>
  );
}
