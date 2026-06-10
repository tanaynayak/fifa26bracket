import type { Group } from "../types";

/**
 * 2026 FIFA World Cup final draw (held 5 Dec 2025, Washington D.C.).
 * Teams are listed in pot order (pot 1 → pot 4).
 */
export const GROUPS: Group[] = [
  {
    id: "A",
    teams: [
      { id: "MEX", name: "Mexico", flag: "mx" },
      { id: "RSA", name: "South Africa", flag: "za" },
      { id: "KOR", name: "South Korea", flag: "kr" },
      { id: "CZE", name: "Czechia", flag: "cz" },
    ],
  },
  {
    id: "B",
    teams: [
      { id: "CAN", name: "Canada", flag: "ca" },
      { id: "BIH", name: "Bosnia & Herz.", flag: "ba" },
      { id: "QAT", name: "Qatar", flag: "qa" },
      { id: "SUI", name: "Switzerland", flag: "ch" },
    ],
  },
  {
    id: "C",
    teams: [
      { id: "BRA", name: "Brazil", flag: "br" },
      { id: "MAR", name: "Morocco", flag: "ma" },
      { id: "HAI", name: "Haiti", flag: "ht" },
      { id: "SCO", name: "Scotland", flag: "gb-sct" },
    ],
  },
  {
    id: "D",
    teams: [
      { id: "USA", name: "United States", flag: "us" },
      { id: "PAR", name: "Paraguay", flag: "py" },
      { id: "AUS", name: "Australia", flag: "au" },
      { id: "TUR", name: "Türkiye", flag: "tr" },
    ],
  },
  {
    id: "E",
    teams: [
      { id: "GER", name: "Germany", flag: "de" },
      { id: "CUW", name: "Curaçao", flag: "cw" },
      { id: "CIV", name: "Ivory Coast", flag: "ci" },
      { id: "ECU", name: "Ecuador", flag: "ec" },
    ],
  },
  {
    id: "F",
    teams: [
      { id: "NED", name: "Netherlands", flag: "nl" },
      { id: "JPN", name: "Japan", flag: "jp" },
      { id: "SWE", name: "Sweden", flag: "se" },
      { id: "TUN", name: "Tunisia", flag: "tn" },
    ],
  },
  {
    id: "G",
    teams: [
      { id: "BEL", name: "Belgium", flag: "be" },
      { id: "EGY", name: "Egypt", flag: "eg" },
      { id: "IRN", name: "Iran", flag: "ir" },
      { id: "NZL", name: "New Zealand", flag: "nz" },
    ],
  },
  {
    id: "H",
    teams: [
      { id: "ESP", name: "Spain", flag: "es" },
      { id: "CPV", name: "Cape Verde", flag: "cv" },
      { id: "KSA", name: "Saudi Arabia", flag: "sa" },
      { id: "URU", name: "Uruguay", flag: "uy" },
    ],
  },
  {
    id: "I",
    teams: [
      { id: "FRA", name: "France", flag: "fr" },
      { id: "SEN", name: "Senegal", flag: "sn" },
      { id: "IRQ", name: "Iraq", flag: "iq" },
      { id: "NOR", name: "Norway", flag: "no" },
    ],
  },
  {
    id: "J",
    teams: [
      { id: "ARG", name: "Argentina", flag: "ar" },
      { id: "ALG", name: "Algeria", flag: "dz" },
      { id: "AUT", name: "Austria", flag: "at" },
      { id: "JOR", name: "Jordan", flag: "jo" },
    ],
  },
  {
    id: "K",
    teams: [
      { id: "POR", name: "Portugal", flag: "pt" },
      { id: "COD", name: "DR Congo", flag: "cd" },
      { id: "UZB", name: "Uzbekistan", flag: "uz" },
      { id: "COL", name: "Colombia", flag: "co" },
    ],
  },
  {
    id: "L",
    teams: [
      { id: "ENG", name: "England", flag: "gb-eng" },
      { id: "CRO", name: "Croatia", flag: "hr" },
      { id: "GHA", name: "Ghana", flag: "gh" },
      { id: "PAN", name: "Panama", flag: "pa" },
    ],
  },
];

export const GROUP_IDS = GROUPS.map((g) => g.id);

const TEAM_INDEX = new Map(
  GROUPS.flatMap((g) => g.teams).map((t) => [t.id, t])
);

export function teamById(id: string) {
  return TEAM_INDEX.get(id);
}
