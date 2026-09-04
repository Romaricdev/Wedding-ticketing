import type { Prisma } from "@prisma/client";

export type LandingMoment = { time: string; day: string; title: string; text: string };

export type LandingContent = {
  monogram: string;
  navMessage: string;
  navProgram: string;
  navInfo: string;
  navGallery: string;
  accessLabel: string;
  loaderName: string;
  loaderMessage: string;
  loaderDate: string;
  heroEyebrow: string;
  heroFirstName: string;
  heroSecondName: string;
  heroDate: string;
  heroDescription: string;
  heroCta: string;
  countdownEyebrow: string;
  countdownTitle: string;
  countdownNote: string;
  countdownDays: string;
  countdownHours: string;
  countdownMinutes: string;
  countdownSeconds: string;
  programDate: string;
  programTitle: string;
  programAccent: string;
  programDescription: string;
  moments: LandingMoment[];
  infoEyebrow: string;
  infoTitle: string;
  infoDescription: string;
  fridayLabel: string;
  fridayTitle: string;
  saturdayLabel: string;
  saturdayTitle: string;
  ticketLabel: string;
  ticketTitle: string;
  ticketDescription: string;
  ticketCta: string;
  messageEyebrow: string;
  messageTitle: string;
  messageAccent: string;
  messageDescription: string;
  signature: string;
  footerText: string;
};

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  monogram: "V&P",
  navMessage: "Notre message",
  navProgram: "Programme",
  navInfo: "Infos pratiques",
  navGallery: "Galerie",
  accessLabel: "Accès invité",
  loaderName: "Valdeze & Patrick",
  loaderMessage: "Préparons la célébration",
  loaderDate: "30 · 31 octobre 2026",
  heroEyebrow: "Célébrons l’amour",
  heroFirstName: "Valdeze",
  heroSecondName: "Patrick",
  heroDate: "30 & 31 octobre 2026",
  heroDescription:
    "Deux cœurs, une promesse, un avenir que nous choisissons d’écrire ensemble. Entourés de nos familles et de nos amis, nous avons la joie de vous inviter à célébrer notre amour.",
  heroCta: "Découvrir le programme",
  countdownEyebrow: "Le grand jour approche",
  countdownTitle: "Encore quelques instants avant de célébrer l’amour",
  countdownNote:
    "Rendez-vous les 30 & 31 octobre 2026 pour célébrer Valdeze & Patrick.",
  countdownDays: "Jours",
  countdownHours: "Heures",
  countdownMinutes: "Minutes",
  countdownSeconds: "Secondes",
  programDate: "30 & 31 octobre 2026",
  programTitle: "Le fil de",
  programAccent: "notre célébration",
  programDescription:
    "Deux jours de joie, de traditions et de promesses partagées avec ceux qui nous sont chers.",
  moments: [
    {
      time: "08h00",
      day: "Vendredi 30 octobre 2026",
      title: "Match de gala",
      text: "Famille vs Invités.",
    },
    {
      time: "17h00",
      day: "Vendredi 30 octobre 2026",
      title: "Mariage coutumier",
      text: "Célébration du mariage coutumier à Baham, quartier Batossou.",
    },
    {
      time: "09h00",
      day: "Samedi 31 octobre 2026",
      title: "Mariage civil",
      text: "Célébration du mariage civil à l’Hôtel de Ville de Pete Bandjoun, suivie d’une séance de photos et d’un cocktail.",
    },
    {
      time: "13h00",
      day: "Samedi 31 octobre 2026",
      title: "Bénédiction nuptiale",
      text: "À la Chapelle de Dja, de la paroisse Saint-Joseph de Hiala Bandjoun.",
    },
    {
      time: "15h30",
      day: "Samedi 31 octobre 2026",
      title: "Séance de photos des mariés",
      text: "Un temps dédié aux souvenirs des mariés.",
    },
    {
      time: "16h30",
      day: "Samedi 31 octobre 2026",
      title: "Vin d’honneur",
      text: "À Dja Bandjoun, au lieu-dit Plaque 80.",
    },
    {
      time: "19h00",
      day: "Samedi 31 octobre 2026",
      title: "Soirée de réception",
      text: "À la salle de banquet de l’Hôtel de Ville de Bandjoun.",
    },
  ],
  infoEyebrow: "Informations pratiques",
  infoTitle: "Repères pour nos invités",
  infoDescription:
    "Retrouvez les rendez-vous essentiels et les informations à garder avec vous tout au long de la célébration.",
  fridayLabel: "Vendredi 30 octobre",
  fridayTitle: "Les traditions",
  saturdayLabel: "Samedi 31 octobre",
  saturdayTitle: "Le grand jour",
  ticketLabel: "Votre invitation",
  ticketTitle: "Le billet à garder",
  ticketDescription:
    "Présentez votre billet et son QR code à l’entrée de la réception. Il permet une validation simple et sécurisée de votre arrivée.",
  ticketCta: "Accéder à mon invitation",
  messageEyebrow: "Avec tout notre amour",
  messageTitle: "Votre présence est",
  messageAccent: "notre plus beau cadeau.",
  messageDescription:
    "Nous avons hâte de vivre ces moments inoubliables avec vous, entourés de nos familles et de nos amis.",
  signature: "Valdeze & Patrick",
  footerText: "Avec amour, Valdeze & Patrick",
};

export function resolveLandingContent(
  value: Prisma.JsonValue | null | undefined,
): LandingContent {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return DEFAULT_LANDING_CONTENT;
  const draft = value as Record<string, unknown>;
  const momentValues = Array.isArray(draft.moments)
    ? draft.moments
    : DEFAULT_LANDING_CONTENT.moments;
  const moments = momentValues.flatMap((candidate, index) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate))
      return [];
    const fallback =
      DEFAULT_LANDING_CONTENT.moments[index] ?? DEFAULT_LANDING_CONTENT.moments.at(-1)!;
    const item = candidate as Record<string, unknown>;
    if (
      typeof item.time !== "string" ||
      typeof item.day !== "string" ||
      typeof item.title !== "string" ||
      typeof item.text !== "string"
    )
      return [];
    return [
      {
        time: item.time || fallback.time,
        day: item.day || fallback.day,
        title: item.title || fallback.title,
        text: item.text || fallback.text,
      },
    ];
  });
  const content = { ...DEFAULT_LANDING_CONTENT, moments } as LandingContent;
  (Object.keys(DEFAULT_LANDING_CONTENT) as Array<keyof LandingContent>).forEach(
    (key) => {
      if (key === "moments") return;
      const candidate = draft[key];
      if (typeof candidate === "string") content[key] = candidate as never;
    },
  );
  return {
    ...content,
    moments: moments.length > 0 ? moments : DEFAULT_LANDING_CONTENT.moments,
  };
}
