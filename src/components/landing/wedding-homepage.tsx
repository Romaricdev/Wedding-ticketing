"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Camera, Church, Clock3, Heart, MapPin, Music2, PartyPopper, Sparkles, TicketCheck, Trophy, UsersRound, Wine } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

const heroSlides = ["/wedding/hero-composed-evening-v1.png", "/wedding/hero-composed-day-v1.png"];

const moments = [
  { time: "08h00", day: "Vendredi 30 octobre 2026", title: "Match de gala", text: "Famille vs Invités.", icon: Trophy },
  { time: "17h00", day: "Vendredi 30 octobre 2026", title: "Mariage coutumier", text: "Célébration du mariage coutumier à Baham, quartier Batossou.", icon: UsersRound },
  { time: "09h00", day: "Samedi 31 octobre 2026", title: "Mariage civil", text: "Célébration du mariage civil à l’Hôtel de Ville de Pete Bandjoun, suivie d’une séance de photos et d’un cocktail.", icon: Church },
  { time: "13h00", day: "Samedi 31 octobre 2026", title: "Bénédiction nuptiale", text: "À la Chapelle de Dja, de la paroisse Saint-Joseph de Hiala Bandjoun.", icon: Church },
  { time: "15h30", day: "Samedi 31 octobre 2026", title: "Séance de photos des mariés", text: "Un temps dédié aux souvenirs des mariés.", icon: Camera },
  { time: "16h30", day: "Samedi 31 octobre 2026", title: "Vin d’honneur", text: "À Dja Bandjoun, au lieu-dit Plaque 80.", icon: Wine },
  { time: "19h00", day: "Samedi 31 octobre 2026", title: "Soirée de réception", text: "À la salle de banquet de l’Hôtel de Ville de Bandjoun.", icon: Music2 },
];

function Countdown() {
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
  const values = [["Jours", Math.floor(remaining / 86_400_000)], ["Heures", Math.floor(remaining / 3_600_000) % 24], ["Minutes", Math.floor(remaining / 60_000) % 60], ["Secondes", Math.floor(remaining / 1000) % 60]];
  return <section className="relative overflow-hidden border-y border-[#d5a55e]/55 bg-[#6e1720] px-5 py-12 text-[#fff7e8] sm:px-8"><div className="pointer-events-none absolute -left-16 top-0 h-56 w-72 rounded-full bg-[#bc4d1e]/35 blur-3xl" /><div className="pointer-events-none absolute -bottom-28 right-0 h-64 w-80 rounded-full bg-[#b4772a]/25 blur-3xl" /><div className="relative mx-auto max-w-6xl"><div className="text-center"><div className="flex items-center justify-center gap-3 text-[#e5b863]"><span className="h-px w-12 bg-current/55" /><Heart className="size-4 fill-current" /><span className="h-px w-12 bg-current/55" /></div><p className="mt-4 text-xs font-semibold uppercase tracking-[.3em] text-[#edc779]">Le grand jour approche</p><h2 className="mt-2 text-3xl italic sm:text-4xl">Encore quelques instants avant de célébrer l’amour</h2></div><div className="mx-auto mt-9 grid max-w-5xl grid-cols-2 gap-px overflow-hidden border border-[#d5a55e]/45 bg-[#d5a55e]/45 sm:grid-cols-4">{values.map(([label, value]) => <div key={String(label)} className="bg-[#6e1720]/85 px-4 py-6 text-center backdrop-blur-sm"><p className="text-5xl leading-none text-[#fff7e8] sm:text-6xl">{String(value).padStart(2, "0")}</p><p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#e5b863]">{label}</p></div>)}</div><p className="mt-6 text-center text-sm text-[#f7dfb0]/85">Rendez-vous les 30 & 31 octobre 2026 pour célébrer Valdeze & Patrick.</p></div></section>;
}

function FloralThread() {
  return <svg aria-hidden="true" className="pointer-events-none absolute inset-y-7 left-1/2 hidden h-[calc(100%-3.5rem)] w-40 -translate-x-1/2 lg:block" viewBox="0 0 160 760" fill="none" preserveAspectRatio="none">
    <path d="M79 0C104 72 49 117 78 191C108 269 50 320 80 389C111 461 52 516 79 591C102 652 65 710 80 760" stroke="#bc7a25" strokeWidth="1.25" />
    <g stroke="#bc7a25" strokeWidth="1.15" fill="#fffaf0"><circle cx="79" cy="54" r="17" /><circle cx="81" cy="165" r="17" /><circle cx="79" cy="275" r="17" /><circle cx="81" cy="385" r="17" /><circle cx="79" cy="495" r="17" /><circle cx="81" cy="605" r="17" /><circle cx="79" cy="710" r="17" /></g>
    <g stroke="#bc7a25" strokeWidth="1" fill="none" opacity=".95"><path d="M91 45c21-15 28-3 24 8c-5 12-19 12-24-8ZM67 137c-22-15-28-2-23 9c5 10 18 11 23-9ZM91 239c20-16 29-4 24 8c-4 12-18 13-24-8ZM68 338c-20-13-27-1-22 9c5 10 18 10 22-9ZM90 425c21-15 28-2 23 9c-5 10-19 11-23-9ZM68 533c-21-15-28-2-23 9c5 10 18 11 23-9ZM91 613c20-13 27-1 22 9c-5 10-18 10-22-9ZM68 711c-20-14-28-2-23 9c5 10 18 11 23-9Z" /><circle cx="105" cy="66" r="3" /><circle cx="55" cy="158" r="3" /><circle cx="105" cy="258" r="3" /><circle cx="56" cy="360" r="3" /><circle cx="105" cy="447" r="3" /><circle cx="55" cy="553" r="3" /><circle cx="104" cy="635" r="3" /><circle cx="55" cy="731" r="3" /></g>
  </svg>;
}

export function WeddingHomepage() {
  const [active, setActive] = useState(0);
  const programRef = useRef<HTMLElement>(null);
  useEffect(() => { const interval = window.setInterval(() => setActive((value) => (value + 1) % heroSlides.length), 7000); return () => window.clearInterval(interval); }, []);
  useEffect(() => {
    const section = programRef.current;
    if (!section) return;
    const elements = Array.from(section.querySelectorAll<HTMLElement>("[data-program-reveal]"));
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }), { threshold: 0.16 });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  return <main className="min-h-screen overflow-hidden bg-[#fffaf0] font-serif text-[#53151d]">
    <section className="relative isolate min-h-[780px] overflow-hidden bg-[#fff9ed] lg:min-h-[760px]">
      {heroSlides.map((slide, index) => <Image key={slide} src={slide} alt="Valdeze et Patrick" fill priority={index === 0} sizes="100vw" className={`pointer-events-none z-0 object-cover object-[62%_center] transition-opacity duration-[1400ms] lg:object-center ${active === index ? "hero-backdrop-in opacity-100" : "opacity-0"}`} />)}
      <header className="hero-header-in relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8"><a href="#accueil" className="text-3xl text-[#a56722]">V<span className="text-[#6e1720]">&</span>P</a><nav className="hidden items-center gap-10 text-sm font-semibold text-[#6e1720] [text-shadow:0_1px_9px_rgba(255,249,237,.95)] md:flex"><a className="border-b border-transparent pb-1 transition hover:border-[#a56722] hover:text-[#8b321a]" href="#message">Notre message</a><a className="border-b border-transparent pb-1 transition hover:border-[#a56722] hover:text-[#8b321a]" href="#programme">Programme</a><a className="border-b border-transparent pb-1 transition hover:border-[#a56722] hover:text-[#8b321a]" href="#infos">Infos pratiques</a></nav><Link href="/connexion" className="inline-flex items-center gap-2 border border-[#a56722] bg-[#fffaf0]/95 px-4 py-2 text-sm font-semibold text-[#7b321d] shadow-[0_8px_28px_rgba(82,32,19,.14)] backdrop-blur-sm transition hover:bg-white"><Heart className="size-3.5" /> Accès invité</Link></header>
      <div id="accueil" className="relative z-10 mx-auto max-w-7xl px-5 pb-28 pt-16 sm:px-8 lg:pt-24"><div className="hero-content-in max-w-xl"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#a56722]">Célébrons l’amour</p><h1 className="mt-5 text-6xl leading-[.86] tracking-tight text-[#6e1720] sm:text-8xl">Valdeze<br /><span className="text-[#b4772a]">&</span> Patrick</h1><div className="my-7 h-px w-48 bg-[#b98a46]" /><p className="text-2xl text-[#b84012]">30 & 31 octobre 2026</p><p className="mt-6 max-w-md text-lg leading-relaxed text-[#63463a]">Deux cœurs, une promesse, un avenir que nous choisissons d’écrire ensemble. Entourés de nos familles et de nos amis, nous avons la joie de vous inviter à célébrer notre amour.</p><a href="#programme" className="mt-8 inline-flex items-center gap-2 bg-[#c54b10] px-6 py-3 text-base text-white shadow-lg shadow-[#8b2b14]/20 transition hover:-translate-y-0.5 hover:bg-[#a83b0b]">Découvrir le programme <PartyPopper className="size-4" /></a></div><div className="hero-controls-in mt-16 flex gap-2 lg:mt-24">{heroSlides.map((_, index) => <button key={index} aria-label={`Afficher la photo ${index + 1}`} onClick={() => setActive(index)} className={`h-1.5 w-7 transition ${active === index ? "bg-[#c56a1a]" : "bg-[#8d4b2c]/35"}`} />)}</div></div>
    </section>
    <Countdown />
    <section ref={programRef} id="programme" className="relative isolate overflow-hidden px-5 py-18 sm:px-8 sm:py-20">
      <div aria-hidden className="pointer-events-none absolute -left-20 top-16 size-72 rounded-full border border-[#c9964e]/25" />
      <svg aria-hidden viewBox="0 0 210 300" className="pointer-events-none absolute -left-8 bottom-4 hidden h-72 w-56 text-[#b4772a]/35 lg:block" fill="none" stroke="currentColor"><path d="M-10 268C65 205 54 122 159 31" strokeWidth="1.2" /><path d="M28 224c22-22 37-12 26 7c-10 16-28 12-26-7ZM73 166c-17-24 1-37 17-21c12 14 0 30-17 21ZM123 99c23-17 35 3 18 17c-15 12-29 0-18-17Z" /><circle cx="20" cy="235" r="3" /><circle cx="100" cy="139" r="3" /><circle cx="148" cy="77" r="3" /></svg>
      <svg aria-hidden viewBox="0 0 210 300" className="pointer-events-none absolute -right-8 top-14 hidden h-72 w-56 rotate-180 text-[#b4772a]/35 lg:block" fill="none" stroke="currentColor"><path d="M-10 268C65 205 54 122 159 31" strokeWidth="1.2" /><path d="M28 224c22-22 37-12 26 7c-10 16-28 12-26-7ZM73 166c-17-24 1-37 17-21c12 14 0 30-17 21ZM123 99c23-17 35 3 18 17c-15 12-29 0-18-17Z" /><circle cx="20" cy="235" r="3" /><circle cx="100" cy="139" r="3" /><circle cx="148" cy="77" r="3" /></svg>
      <div aria-hidden className="pointer-events-none absolute bottom-24 right-[10%] size-24 rotate-12 border border-[#c9964e]/20" />
      <div className="relative mx-auto max-w-5xl">
        <div data-program-reveal className="program-reveal text-center">
          <div className="flex items-center justify-center gap-3 text-[#b4772a]"><span className="h-px w-12 bg-current/45" /><Sparkles className="size-4" /><span className="h-px w-12 bg-current/45" /></div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[.3em] text-[#a56722]">30 & 31 octobre 2026</p>
          <h2 className="mt-3 text-4xl leading-none text-[#6e1720] sm:text-6xl">Le fil de <span className="mt-2 block text-[#b4772a] italic">notre célébration</span></h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#765342]">Deux jours de joie, de traditions et de promesses partagées avec ceux qui nous sont chers.</p>
        </div>
        <div className="relative mx-auto mt-10 max-w-4xl sm:mt-12">
          <FloralThread />
          {moments.map((moment, index) => {
            const Icon = moment.icon;
            const onRight = index % 2 === 1;
            return <article key={`${moment.time}-${moment.title}`} data-program-reveal style={{ "--reveal-delay": `${Math.min(index * 80, 280)}ms` } as CSSProperties} className={`program-reveal relative grid grid-cols-[38px_1fr] gap-5 py-7 lg:min-h-40 lg:grid-cols-[1fr_164px_1fr] lg:gap-4 ${onRight ? "lg:text-left" : "lg:text-right"}`}><div className={`${onRight ? "lg:col-start-3" : "lg:col-start-1"} lg:self-center`}><p className="text-xs uppercase tracking-wider text-[#9c6a27]">{moment.day}</p><p className="mt-1 text-4xl text-[#b4772a]">{moment.time}</p><h3 className="mt-1 text-2xl text-[#6e1720]">{moment.title}</h3><p className="mt-2 text-sm leading-relaxed text-[#67493c]">{moment.text}</p></div><div className="relative col-start-1 row-start-1 flex size-10 items-center justify-center self-center rounded-full border border-[#c9964e] bg-[#fffaf0] text-[#a56722] lg:col-start-2 lg:size-11"><Icon className="size-4 lg:size-5" /></div></article>;
          })}
        </div>
      </div>
    </section>
    <section id="infos" className="relative overflow-hidden bg-[#f8ecd9] px-5 py-20 sm:px-8"><div className="pointer-events-none absolute -right-24 top-4 size-80 rounded-full border border-[#c9964e]/20" /><div className="relative mx-auto max-w-6xl"><div className="mx-auto max-w-2xl text-center"><div className="flex items-center justify-center gap-3 text-[#b4772a]"><span className="h-px w-10 bg-current/45" /><CalendarDays className="size-5" /><span className="h-px w-10 bg-current/45" /></div><p className="mt-4 text-xs font-semibold uppercase tracking-[.28em] text-[#a56722]">Informations pratiques</p><h2 className="mt-4 text-4xl text-[#6e1720] sm:text-5xl">Repères pour nos invités</h2><p className="mx-auto mt-4 max-w-xl leading-relaxed text-[#765342]">Retrouvez les rendez-vous essentiels et les informations à garder avec vous tout au long de la célébration.</p></div><div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.35fr_1fr]"><article className="border-t-2 border-[#b4772a] pt-6"><div className="flex items-center gap-3 text-[#a56722]"><Clock3 className="size-5" /><p className="text-xs font-semibold uppercase tracking-[.22em]">Vendredi 30 octobre</p></div><h3 className="mt-4 text-3xl text-[#6e1720]">Les traditions</h3><div className="mt-6 space-y-5 border-l border-[#c9964e]/55 pl-5"><div><p className="text-xl text-[#b4772a]">08h00</p><p className="mt-1 font-semibold text-[#6e1720]">Match de gala</p><p className="mt-1 text-sm text-[#765342]">Famille vs Invités.</p></div><div><p className="text-xl text-[#b4772a]">17h00</p><p className="mt-1 font-semibold text-[#6e1720]">Mariage coutumier</p><p className="mt-1 text-sm text-[#765342]">Baham, quartier Batossou.</p></div></div></article><article className="border-t-2 border-[#6e1720] pt-6"><div className="flex items-center gap-3 text-[#a56722]"><MapPin className="size-5" /><p className="text-xs font-semibold uppercase tracking-[.22em]">Samedi 31 octobre</p></div><h3 className="mt-4 text-3xl text-[#6e1720]">Le grand jour</h3><div className="mt-6 grid gap-x-8 gap-y-5 border-l border-[#c9964e]/55 pl-5 sm:grid-cols-2"><div><p className="text-xl text-[#b4772a]">09h00</p><p className="mt-1 font-semibold text-[#6e1720]">Mariage civil</p><p className="mt-1 text-sm text-[#765342]">Hôtel de Ville de Pete Bandjoun.</p></div><div><p className="text-xl text-[#b4772a]">13h00</p><p className="mt-1 font-semibold text-[#6e1720]">Bénédiction nuptiale</p><p className="mt-1 text-sm text-[#765342]">Chapelle de Dja, paroisse Saint-Joseph de Hiala Bandjoun.</p></div><div><p className="text-xl text-[#b4772a]">15h30</p><p className="mt-1 font-semibold text-[#6e1720]">Séance de photos des mariés</p><p className="mt-1 text-sm text-[#765342]">Un temps dédié aux souvenirs des mariés.</p></div><div><p className="text-xl text-[#b4772a]">16h30</p><p className="mt-1 font-semibold text-[#6e1720]">Vin d’honneur</p><p className="mt-1 text-sm text-[#765342]">Dja Bandjoun, lieu-dit Plaque 80.</p></div><div><p className="text-xl text-[#b4772a]">19h00</p><p className="mt-1 font-semibold text-[#6e1720]">Soirée de réception</p><p className="mt-1 text-sm text-[#765342]">Salle de banquet de l’Hôtel de Ville de Bandjoun.</p></div></div></article><article className="border-t-2 border-[#b4772a] pt-6"><div className="flex items-center gap-3 text-[#a56722]"><TicketCheck className="size-5" /><p className="text-xs font-semibold uppercase tracking-[.22em]">Votre invitation</p></div><h3 className="mt-4 text-3xl text-[#6e1720]">Le billet à garder</h3><p className="mt-5 leading-relaxed text-[#765342]">Présentez votre billet et son QR code à l’entrée de la réception. Il permet une validation simple et sécurisée de votre arrivée.</p><Link href="/connexion" className="mt-7 inline-flex items-center gap-2 border border-[#a56722] px-4 py-2 text-sm text-[#7b321d] transition hover:bg-[#fffaf0]">Accéder à mon invitation <Heart className="size-3.5" /></Link></article></div></div></section>
    <section id="message" className="relative isolate min-h-[590px] overflow-hidden bg-[#fff9ed] px-5 py-16 sm:px-8"><Image src="/wedding/footer-composed-v1.png" alt="Valdeze et Patrick" fill sizes="100vw" className="-z-10 object-cover object-[39%_top] md:object-[50%_top]" /><div className="mx-auto flex min-h-[460px] max-w-6xl items-end justify-end md:items-center"><div className="max-w-xl text-center md:ml-auto md:w-[54%] md:text-left"><div className="flex items-center justify-center gap-3 text-[#b4772a] md:justify-start"><span className="h-px w-10 bg-current/45" /><Heart className="size-5" /><span className="h-px w-10 bg-current/45" /></div><p className="mt-5 text-xs font-semibold uppercase tracking-[.28em] text-[#a56722]">Avec tout notre amour</p><h2 className="mt-5 text-4xl leading-[1.05] text-[#6e1720] sm:text-6xl">Votre présence est<br /><span className="italic text-[#b4772a]">notre plus beau cadeau.</span></h2><div className="my-7 h-px w-24 bg-[#b98a46]/70 md:mx-0 mx-auto" /><p className="mx-auto max-w-md text-lg leading-relaxed text-[#67493c] md:mx-0">Nous avons hâte de vivre ces moments inoubliables avec vous, entourés de nos familles et de nos amis.</p><p className="mt-8 text-3xl italic text-[#8e461d]">Valdeze & Patrick</p></div></div></section>
    <footer className="border-t border-[#d5a55e]/45 bg-[#6e1720] px-5 py-7 text-center text-sm text-[#f4d5a0]"><Heart className="mx-auto mb-2 size-4 text-[#d6a252]" />Avec amour, Valdeze & Patrick</footer>
  </main>;
}
